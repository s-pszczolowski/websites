import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { RUBRIC_SLUGS } from './config/magazine';

// Każdy tekst to osobny plik Markdown w src/content/teksty/.
export const collections = {
  teksty: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/teksty' }),
    schema: z.object({
      title: z.string().min(15),
      seo: z.object({ title: z.string().min(15).max(66), description: z.string().min(90).max(158) }),
      standfirst: z.string().min(120),
      rubric: z.enum(RUBRIC_SLUGS),
      format: z.enum(['Poradnik', 'Przewodnik', 'Porównanie', 'Lista kontrolna', 'Esej poradnikowy', 'Wyjaśniamy']),
      published: z.coerce.date(),
      revised: z.coerce.date().optional(),
      visualAlt: z.string().min(15),
      mood: z.string().optional(),
      related: z.array(z.string()).min(3).max(4),
      hero: z.boolean().default(false),
      weekTopic: z.boolean().default(false),
      worthReading: z.boolean().default(false),
      toc: z.boolean().default(true),
      sponsored: z.boolean().default(false),
      partner: z.string().optional(),
      sources: z.array(z.object({ name: z.string(), url: z.string().url() })).min(2),
    }),
  }),
};
