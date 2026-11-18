import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  language: z.string().trim().min(2).max(60),
  phrases: z
    .array(z.object({ id: z.string().max(40), text: z.string().max(200) }))
    .min(1)
    .max(60),
});

export const translatePhrases = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { translatePhrasesServer } = await import("./translate.server");
    return translatePhrasesServer(data.language, data.phrases);
  });
