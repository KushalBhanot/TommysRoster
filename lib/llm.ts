// The only file that talks to an LLM provider. Everything else calls
// generateJson(), so switching providers means changing this file only.
//
// Provider: Gemini, through the official @google/genai SDK and its
// Interactions API, with structured output (the model must return JSON that
// follows the schema we pass). Docs: https://aistudio.google.com/docs/structured-output

import { GoogleGenAI } from "@google/genai";

/** Any reason the model could not give us usable JSON. Callers fall back. */
export class LlmError extends Error {}

// How long we wait for the model before giving up and using the fallback.
const TIMEOUT_MS = 15_000;

export interface GenerateJsonOptions {
  /** Rules for the model (who it is, what it may and may not do). */
  system: string;
  /** The data for this one request. */
  input: string;
  /** JSON Schema the answer must follow. */
  schema: Record<string, unknown>;
}

/**
 * Ask the model for JSON that follows `schema` and return it parsed.
 * Throws LlmError when the key or model name is missing, the call fails or
 * times out, or the answer is not valid JSON. The schema only guarantees the
 * shape: callers must still check the values.
 */
export async function generateJson(options: GenerateJsonOptions): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey) throw new LlmError("GEMINI_API_KEY is not set.");
  if (!model) throw new LlmError("GEMINI_MODEL is not set.");

  const ai = new GoogleGenAI({ apiKey });

  let text: string | undefined;
  try {
    const interaction = await ai.interactions.create(
      {
        model,
        system_instruction: options.system,
        input: options.input,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: options.schema,
        },
        // Do not keep the question or the people list on Google's side.
        store: false,
      },
      { timeout: TIMEOUT_MS, maxRetries: 1 },
    );
    if (interaction.status !== "completed") {
      throw new LlmError(`Model finished with status "${interaction.status}".`);
    }
    text = interaction.output_text;
  } catch (error) {
    if (error instanceof LlmError) throw error;
    // Keep the provider's message for the server log, never the key.
    throw new LlmError(`Gemini call failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!text) throw new LlmError("Model returned no text.");
  try {
    return JSON.parse(text);
  } catch {
    throw new LlmError("Model returned text that is not valid JSON.");
  }
}
