import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "astro/zod";

const docs = defineCollection({
  loader: glob({
    pattern: "zh-CN/**/*.md",
    base: new URL("../../tutorial/", import.meta.url).pathname,
  }),
  schema: docsSchema({
    extend: () =>
      z.object({
        lang: z.string().optional().default("zh-CN"),
        content_status: z.string().optional(),
        source_version: z.union([z.string(), z.date()]).transform((v) => v instanceof Date ? v.toISOString().slice(0, 10) : v).optional(),
        translations: z.record(z.string(), z.unknown()).optional(),
        learning_contract: z
          .object({
            inherits: z.string().optional(),
            tension: z.string().optional(),
            resolves: z.string().optional(),
            invariant: z.union([z.string(), z.array(z.string())]).optional(),
            invariants: z.union([z.string(), z.array(z.string())]).optional(),
            hands_off: z.string().optional(),
            next_question: z.string().optional(),
          })
          .passthrough()
          .optional(),
        review: z
          .object({
            polish: z.object({ verdict: z.string() }).passthrough().optional(),
            implementation: z
              .object({ verdict: z.string() })
              .passthrough()
              .optional(),
          })
          .passthrough()
          .optional(),
      }),
  }),
});

export const collections = { docs };
