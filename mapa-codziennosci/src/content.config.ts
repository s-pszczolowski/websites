import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_SLUGS } from './config/site';

const articles = defineCollection({
  // Każdy artykuł to osobny plik Markdown; nazwa pliku = adres URL (/nazwa-pliku/).
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(10),
    metaTitle: z.string().min(10).max(70),
    metaDescription: z.string().min(70).max(170),
    lead: z.string().min(80),
    category: z.enum(CATEGORY_SLUGS),
    format: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    image: z.string().optional(),
    imageAlt: z.string().min(10),
    related: z.array(z.string()).min(2).max(4),
    sponsored: z.boolean().default(false),
    client: z.string().optional(),
    featured: z.boolean().default(false),
    recommended: z.boolean().default(false),
    sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
  }),
});

export const collections = { articles };
