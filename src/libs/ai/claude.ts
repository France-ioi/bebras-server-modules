import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

export async function claudeGenerateTextFromPrompt(input: string, model: string, jsonSchema: object|null, systemInstructions: string|null): Promise<string> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 16384,
    messages: [
      ...(systemInstructions ? [{ role: "assistant" as const, content: systemInstructions}] : []),
      { role: "user", content: input }
    ],
    ...(jsonSchema ? {
      output_config: {
        format: {
          type: "json_schema",
          schema: jsonSchema as any,
        }
      },
    } : {}),
  });

  for (const block of response.content) {
    if (block.type === "text") {
      return block.text;
    }
  }

  throw new Error("AI model returned no text from prompt.");
}
