import { z } from "zod";

export const projectUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Use a full https:// or http:// project URL.");

export const publicationSchema = z
  .object({
    projectId: z.string().min(1),
    published: z.boolean(),
    summary: z.string().trim().max(5000),
  })
  .refine(
    (value) => !value.published || value.summary.length >= 20,
    "Add a public case study of at least 20 characters before publishing.",
  );
