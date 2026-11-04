import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TOPIC_SLUGS } from './config/site';

const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(10),
    seoTitle: z.string().min(10).max(70),
    seoDescription: z.string().min(70).max(165),
    lead: z.string().min(80),
    topic: z.enum(TOPIC_SLUGS),
    kind: z.string(),
    published: z.coerce.date(),
    modified: z.coerce.date().optional(),
    cover: z.string().optional(),
    coverAlt: z.string().min(10),
    keyPoints: z.array(z.string()).min(3).max(4),
    related: z.array(z.string()).min(3).max(4),
    sponsored: z.boolean().default(false),
    partner: z.string().optional(),
    heroOrder: z.number().optional(),
    guide: z.boolean().default(false),
    sources: z.array(z.object({ name: z.string(), url: z.string().url() })).default([]),
  }),
});

export const collections = { articles };
