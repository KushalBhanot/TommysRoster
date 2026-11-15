// POST /api/assistant: the small helper "Tommy" (see lib/assistant.ts).
// body { messages: [{ role: "user" | "assistant", content: string }] }
// → { reply: string, links: [{ label, href }] }

import { askAssistant } from "@/lib/assistant";
import { errorJson, json, readJsonObject } from "@/lib/http";
import type { ChatTurn } from "@/lib/llm";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { SIGN_IN_FIRST, mayUseSite } from "@/lib/session";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 600;

// Each question can call a paid model up to four times, so one IP gets 12 per minute.
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;

/** The conversation from the body, or an error message saying what is wrong with it. */
function readTurns(value: unknown): ChatTurn[] | string {
  if (!Array.isArray(value) || value.length === 0) {
    return "Send messages as a list with at least one message.";
  }
  if (value.length > MAX_MESSAGES) {
    return `Send at most ${MAX_MESSAGES} messages. Start a new conversation to keep going.`;
  }

  const turns: ChatTurn[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return "Each message needs a role and content.";
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") {
      return 'Each message role must be "user" or "assistant".';
    }
    if (typeof content !== "string" || !content.trim()) return "Each message needs some text.";
    const text = content.trim();
    if (text.length > MAX_MESSAGE_CHARS) {
      return `Please keep each message under ${MAX_MESSAGE_CHARS} characters.`;
    }
    turns.push({ role, content: text });
  }
  if (turns[turns.length - 1].role !== "user") return "The last message must be from you.";
  return turns;
}

export async function POST(request: Request) {
  // The AI costs money per call: when only USC Google sign-in is accepted,
  // it answers signed-in USC accounts and nobody else.
  if (!(await mayUseSite())) return errorJson(SIGN_IN_FIRST, 401);

  if (!allowRequest(`assistant:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return errorJson("Too many questions in a short time. Please wait a minute and try again.", 429);
  }

  const body = await readJsonObject(request);
  if (!body) return errorJson("Send a JSON body with a list of messages.", 400);

  const turns = readTurns(body.messages);
  if (typeof turns === "string") return errorJson(turns, 400);

  try {
    return json(await askAssistant(turns));
  } catch (error) {
    // askAssistant handles model failures itself; this is only for the unexpected.
    console.error("[api/assistant]", error);
    return errorJson("The helper could not answer right now. Please try again.", 500);
  }
}
