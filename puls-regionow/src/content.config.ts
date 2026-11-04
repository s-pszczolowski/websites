import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SECTION_SLUGS, REGION_SLUGS } from './config/portal';

export const collections = {
  articles: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/articles' }),
    schema: z.object({
      title: z.string().min(10),
      metaTitle: z.string().min(10).max(68),
      metaDescription: z.string().min(80).max(160),
      lead: z.string().min(80),
      section: z.enum(SECTION_SLUGS),
      region: z.enum(REGION_SLUGS),
      genre: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      picture: z.string().optional(),
      pictureAlt: z.string().min(10),
      related: z.array(z.string()).length(3),
      sponsored: z.boolean().default(false),
      client: z.string().optional(),
      top: z.number().optional(),
      pick: z.boolean().default(false),
      residents: z.boolean().default(false),
      sources: z.array(z.object({ label: z.string(), url: z.string().url() })).min(1),
    }),
  }),
};
