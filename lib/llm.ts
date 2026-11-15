// The only file that talks to an LLM provider. Everything else calls
// generateJson(), so switching providers means changing this file only.
//
// Provider: Claude, through the official @anthropic-ai/sdk, with structured
// output (the model must return JSON that follows the schema we pass).
// Docs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs

import Anthropic from "@anthropic-ai/sdk";

/** Any reason the model could not give us usable JSON. Callers fall back. */
export class LlmError extends Error {}

// Fast and cheap, which is what a public, unauthenticated endpoint needs.
// Set ANTHROPIC_MODEL=claude-sonnet-5-5 to trade cost for quality.
const DEFAULT_MODEL = "claude-haiku-5-5";

// How long we wait for one attempt before giving up. With one retry the
// worst case is about twice this, then the caller uses its fallback.
const TIMEOUT_MS = 10_000;

// The answers we ask for are a few sentences. This cap covers them plus the
// model's own reasoning, and bounds what a single request can cost.
const MAX_OUTPUT_TOKENS = 4000;

export interface GenerateJsonOptions {
  /** Rules for the model (who it is, what it may and may not do). */
  system: string;
  /** The data for this one request. */
  input: string;
  /**
   * JSON Schema the answer must follow. Every object in it needs
   * `additionalProperties: false`, and length/size limits are not supported.
   */
  schema: Record<string, unknown>;
  /**
   * For the rare large request: wait this long, once, instead of the usual
   * 10 seconds with one retry. A call that is about to finish is not cut off.
   */
  patientMs?: number;
}

/**
 * Ask the model for JSON that follows `schema` and return it parsed.
 * Throws LlmError when the key is missing, the call fails or times out, the
 * model declines, or the answer is cut off. The schema only guarantees the
 * shape: callers must still check the values.
 */
export async function generateJson(options: GenerateJsonOptions): Promise<unknown> {
  if (!process.env.ANTHROPIC_API_KEY) throw new LlmError("ANTHROPIC_API_KEY is not set.");

  // Reads ANTHROPIC_API_KEY from the environment.
  const client = new Anthropic();

  let response: Anthropic.Message;
  try {
    response = await client.messages.create(
      {
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: options.system,
        messages: [{ role: "user", content: options.input }],
        output_config: {
          // Ranking a short list is a simple task: low effort keeps it fast.
          effort: "low",
          format: { type: "json_schema", schema: options.schema },
        },
      },
      options.patientMs
        ? { timeout: options.patientMs, maxRetries: 0 }
        : { timeout: TIMEOUT_MS, maxRetries: 1 },
    );
  } catch (error) {
    // Most specific first. The messages go to the server log, never the key.
    if (error instanceof Anthropic.AuthenticationError) {
      throw new LlmError("Claude rejected the API key.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new LlmError("Claude rate limit reached.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new LlmError(`Claude API error ${error.status ?? ""}: ${error.message}`);
    }
    throw new LlmError(`Claude call failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // With "refusal" or "max_tokens" the text may not follow the schema.
  if (response.stop_reason !== "end_turn") {
    throw new LlmError(`Model stopped with "${response.stop_reason}".`);
  }

  // The answer is the text block; a thinking block may come before it.
  const text = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  )?.text;
  if (!text) throw new LlmError("Model returned no text.");
  try {
    return JSON.parse(text);
  } catch {
    throw new LlmError("Model returned text that is not valid JSON.");
  }
}

// ---------------------------------------------------------------------------
// Tool loop: a short conversation in which the model may call our own
// functions ("tools") before it answers in plain text.
// Docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

// Each call in the loop gets this long. There is no automatic retry, so with
// the cap below the worst case is about TOOL_LOOP_MAX_CALLS x this.
const TOOL_LOOP_TIMEOUT_MS = 12_000;

// One question, at most a few tool rounds, then an answer. If the model still
// wants tools after this many calls, we give up and the caller falls back.
const TOOL_LOOP_MAX_CALLS = 4;

// Replies are a few sentences; this bounds what one loop can cost.
const TOOL_LOOP_MAX_OUTPUT_TOKENS = 1200;

/** A function the model may ask us to run. */
export interface LlmTool {
  name: string;
  /** Tells the model when to use the tool and what it returns. */
  description: string;
  /** JSON Schema for the input the model must send. */
  input_schema: Anthropic.Tool.InputSchema;
  /**
   * Does the work and returns a plain object, which is sent back to the model
   * as JSON. Throwing is fine: the model is told the tool failed.
   */
  run(input: Record<string, unknown>): unknown | Promise<unknown>;
}

/** One turn of the conversation so far. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface RunToolLoopOptions {
  system: string;
  /** The conversation so far. It should start with and end with a user turn. */
  messages: ChatTurn[];
  tools: LlmTool[];
}

/** Turn an SDK error into an LlmError with a short message for the server log. */
function toLlmError(error: unknown): LlmError {
  if (error instanceof Anthropic.AuthenticationError) return new LlmError("Claude rejected the API key.");
  if (error instanceof Anthropic.RateLimitError) return new LlmError("Claude rate limit reached.");
  if (error instanceof Anthropic.APIError) {
    return new LlmError(`Claude API error ${error.status ?? ""}: ${error.message}`);
  }
  return new LlmError(`Claude call failed: ${error instanceof Error ? error.message : String(error)}`);
}

/** Run every tool the model asked for in one turn and collect the results. */
async function runToolCalls(
  calls: Anthropic.ToolUseBlock[],
  tools: LlmTool[],
): Promise<Anthropic.ToolResultBlockParam[]> {
  return Promise.all(
    calls.map(async (call): Promise<Anthropic.ToolResultBlockParam> => {
      const tool = tools.find((candidate) => candidate.name === call.name);
      if (!tool) {
        return { type: "tool_result", tool_use_id: call.id, is_error: true, content: `Unknown tool "${call.name}".` };
      }
      // The input should be an object (the schema says so), but never trust it blindly.
      const input =
        typeof call.input === "object" && call.input !== null && !Array.isArray(call.input)
          ? (call.input as Record<string, unknown>)
          : {};
      try {
        const result = await tool.run(input);
        return { type: "tool_result", tool_use_id: call.id, content: JSON.stringify(result ?? null) };
      } catch (error) {
        // is_error lets the model say the lookup failed instead of guessing.
        const message = error instanceof Error ? error.message : "The tool failed.";
        return { type: "tool_result", tool_use_id: call.id, is_error: true, content: message };
      }
    }),
  );
}

/**
 * Let the model answer the last user turn, calling `tools` as often as it
 * needs (within TOOL_LOOP_MAX_CALLS model calls), and return its final text.
 * Throws LlmError when the key is missing, a call fails or times out, the
 * model declines or is cut off, or it never gives a final answer.
 */
export async function runToolLoop(options: RunToolLoopOptions): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new LlmError("ANTHROPIC_API_KEY is not set.");

  const client = new Anthropic();
  const tools: Anthropic.Tool[] = options.tools.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }));
  // Grows as the loop goes: each model turn, then the tool results for it.
  const messages: Anthropic.MessageParam[] = options.messages.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  for (let call = 0; call < TOOL_LOOP_MAX_CALLS; call++) {
    let response: Anthropic.Message;
    try {
      response = await client.messages.create(
        {
          model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
          max_tokens: TOOL_LOOP_MAX_OUTPUT_TOKENS,
          system: options.system,
          messages,
          // tool_choice is left out, so the model decides whether to call a tool.
          tools,
          output_config: { effort: "low" },
        },
        { timeout: TOOL_LOOP_TIMEOUT_MS, maxRetries: 0 },
      );
    } catch (error) {
      throw toLlmError(error);
    }

    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join(" ")
        .trim();
      if (!text) throw new LlmError("Model returned no text.");
      return text;
    }

    // Anything other than a request for tools ("max_tokens", "refusal", ...)
    // means there is no usable answer, and any tool input may be cut off.
    if (response.stop_reason !== "tool_use") {
      throw new LlmError(`Model stopped with "${response.stop_reason}".`);
    }

    const calls = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (calls.length === 0) throw new LlmError("Model asked for tools but named none.");

    // The whole model turn goes back (with its tool_use blocks), then every
    // result in one user message, each matched to its call by tool_use_id.
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: await runToolCalls(calls, options.tools) });
  }

  throw new LlmError(`Model did not answer within ${TOOL_LOOP_MAX_CALLS} calls.`);
}
