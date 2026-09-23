/**
 * Model providers for the AI mentor, behind one interface.
 *
 * The mentor needs exactly one capability — system prompt + turns in, text out —
 * so the seam is narrow enough that swapping providers is a config change rather
 * than a rewrite. Pick one with MENTOR_PROVIDER; override the model with
 * MENTOR_MODEL.
 *
 *   anthropic  ANTHROPIC_API_KEY   default model claude-opus-5
 *   openai     OPENAI_API_KEY      default model gpt-4o
 *   deepseek   DEEPSEEK_API_KEY    default model deepseek-chat
 *   gemini     GEMINI_API_KEY      default model gemini-3.8-flash
 *   mock       (no key)            the scripted mentor in src/lib/mentor.ts
 *
 * Server-only: this file reads API keys and must never reach the browser bundle.
 * Import it with `await import(...)` from inside a server handler.
 */

export interface MentorTurn {
  role: "user" | "assistant";
  content: string;
}

export interface MentorProvider {
  name: string;
  model: string;
  complete(input: { system: string; messages: MentorTurn[] }): Promise<string>;
}

const MAX_REPLY_TOKENS = 1024;

function anthropicProvider(): MentorProvider {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("MENTOR_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set.");
  const model = process.env["MENTOR_MODEL"] || "claude-opus-5";

  return {
    name: "anthropic",
    model,
    async complete({ system, messages }) {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model,
        max_tokens: MAX_REPLY_TOKENS,
        system,
        // Low effort rather than disabled thinking: a tutor reply is a short
        // answer, but disabling thinking outright on current models risks
        // leaking internal tags into the visible text.
        output_config: { effort: "low" },
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      if (response.stop_reason === "refusal") {
        throw new Error("The model declined to answer that one. Try rephrasing your question.");
      }

      return response.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("\n")
        .trim();
    },
  };
}

type OpenAiFlavour = "openai" | "deepseek" | "gemini";

/**
 * OpenAI, DeepSeek and Gemini (through Google's OpenAI-compatible endpoint)
 * speak the same chat-completions dialect, so one adapter serves all three —
 * only the base URL, key and default model differ.
 */
function openAiCompatibleProvider(flavour: OpenAiFlavour): MentorProvider {
  const configs = {
    openai: {
      key: process.env["OPENAI_API_KEY"],
      keyName: "OPENAI_API_KEY",
      baseUrl: process.env["OPENAI_BASE_URL"] || "https://api.openai.com/v1",
      defaultModel: "gpt-4o",
    },
    deepseek: {
      key: process.env["DEEPSEEK_API_KEY"],
      keyName: "DEEPSEEK_API_KEY",
      baseUrl: process.env["DEEPSEEK_BASE_URL"] || "https://api.deepseek.com/v1",
      defaultModel: "deepseek-chat",
    },
    gemini: {
      key: process.env["GEMINI_API_KEY"],
      keyName: "GEMINI_API_KEY",
      baseUrl:
        process.env["GEMINI_BASE_URL"] || "https://generativelanguage.googleapis.com/v1beta/openai",
      defaultModel: "gemini-3.8-flash",
    },
  } satisfies Record<OpenAiFlavour, unknown>;
  const config = configs[flavour];

  if (!config.key) {
    throw new Error(`MENTOR_PROVIDER=${flavour} but ${config.keyName} is not set.`);
  }
  const model = process.env["MENTOR_MODEL"] || config.defaultModel;

  return {
    name: flavour,
    model,
    async complete({ system, messages }) {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_REPLY_TOKENS,
          // Gemini thinks by default and its thinking can eat the reply budget,
          // leaving an empty answer; a tutor reply doesn't need much of it.
          ...(flavour === "gemini" ? { reasoning_effort: "low" } : {}),
          messages: [{ role: "system", content: system }, ...messages],
        }),
      });

      if (!response.ok) {
        throw new Error(`${flavour} returned ${response.status}: ${await response.text()}`);
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return payload.choices?.[0]?.message?.content?.trim() ?? "";
    },
  };
}

/** null means "no model configured" — the caller falls back to the scripted mentor. */
export function getMentorProvider(): MentorProvider | null {
  const choice = (process.env["MENTOR_PROVIDER"] || "mock").toLowerCase();
  switch (choice) {
    case "anthropic":
    case "claude":
      return anthropicProvider();
    case "openai":
      return openAiCompatibleProvider("openai");
    case "deepseek":
      return openAiCompatibleProvider("deepseek");
    case "gemini":
    case "google":
      return openAiCompatibleProvider("gemini");
    case "mock":
    case "":
      return null;
    default:
      throw new Error(
        `Unknown MENTOR_PROVIDER "${choice}". Use anthropic, openai, deepseek, gemini or mock.`,
      );
  }
}
