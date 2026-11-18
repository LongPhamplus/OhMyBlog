import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";

// Controlled vocabularies: a typo here is a build error, not a new "category".
export const KINDS = ["writeup", "research", "notes", "post"] as const;
export const PLATFORMS = [
  "htb",
  "thm",
  "ctf",
  "portswigger",
  "vulnlab",
  "other",
] as const;
export const CATEGORIES = [
  "web",
  "pwn",
  "rev",
  "crypto",
  "forensics",
  "malware",
  "ad",
  "cloud",
  "osint",
  "mobile",
  "hardware",
  "misc",
] as const;
export const DIFFICULTIES = ["easy", "medium", "hard", "insane"] as const;

// Platforms whose rules only allow write-ups after the content is retired/ended.
const EMBARGOED = new Set(["htb", "thm", "ctf", "vulnlab"]);

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        // ---- AstroPaper fields (unchanged) ----
        author: z.string().default(config.site.author),
        pubDatetime: z.date(),
        modDatetime: z.date().optional().nullable(),
        title: z.string(),
        featured: z.boolean().optional(),
        draft: z.boolean().optional(),
        // tag rule: lowercase kebab-case only ("active-directory", not "Active Directory")
        tags: z
          .array(
            z
              .string()
              .regex(
                /^[a-z0-9]+(-[a-z0-9]+)*$/,
                "tags must be lowercase kebab-case"
              )
          )
          .default(["others"]),
        ogImage: image().or(z.string()).optional(),
        description: z.string(),
        canonicalURL: z.string().optional(),
        hideEditPost: z.boolean().optional(),
        hideToc: z.boolean().optional(),
        timezone: z
          .string()
          .optional()
          .transform(tz => tz || undefined),

        // ---- security-blog fields ----
        kind: z.enum(KINDS).default("post"),
        platform: z.enum(PLATFORMS).optional(),
        event: z.string().optional(), //          "HTB Cyber Apocalypse 2026", "Machine: Sau"
        category: z.enum(CATEGORIES).optional(),
        difficulty: z.enum(DIFFICULTIES).optional(),
        points: z.number().int().nonnegative().optional(),
        os: z.enum(["linux", "windows", "other"]).optional(),
        // must be set to true explicitly before an HTB/THM/CTF write-up can be published
        retired: z.boolean().optional(),
        cve: z.array(z.string().regex(/^CVE-\d{4}-\d{4,}$/)).optional(),
        mitre: z.array(z.string().regex(/^T\d{4}(\.\d{3})?$/)).optional(),
        comments: z.boolean().default(true),
      })
      .superRefine((d, ctx) => {
        if (d.kind === "writeup" && !d.platform) {
          ctx.addIssue({
            code: "custom",
            path: ["platform"],
            message: "write-ups need a platform",
          });
        }
        if (d.kind === "writeup" && !d.category) {
          ctx.addIssue({
            code: "custom",
            path: ["category"],
            message: "write-ups need a category",
          });
        }
        if (
          d.kind === "writeup" &&
          d.platform &&
          EMBARGOED.has(d.platform) &&
          !d.draft &&
          d.retired !== true
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["retired"],
            message:
              "set `retired: true` (machine retired / CTF ended) or keep `draft: true`",
          });
        }
      }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

export const collections = { posts, pages };
