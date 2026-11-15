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
      { timeout: TIMEOUT_MS, maxRetries: 1 },
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
