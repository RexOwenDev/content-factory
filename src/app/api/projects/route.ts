import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createProject, createMarketsForProject, listProjects } from '@/lib/db/queries/projects'
import type { Locale, ContentType, TranslationMode } from '@/lib/types'

const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  brief: z.object({
    product_name: z.string().min(1),
    category: z.string().min(1),
    key_features: z.array(z.string()).min(1).max(10),
    target_audience: z.string().min(1),
    price_point: z.string().min(1),
    usp: z.string().min(1),
    avoid_words: z.array(z.string()).default([]),
    extra_context: z.string().max(2000).optional(),
  }),
  brand_voice: z.object({
    tone: z.string().min(1),
    style: z.string().min(1),
    keywords: z.array(z.string()).default([]),
    avoid_words: z.array(z.string()).default([]),
    sample_copy: z.string().default(''),
  }),
  target_locales: z.array(z.string()).min(1).max(12),
  content_types: z.array(z.string()).min(1),
  translation_mode: z.enum(['deepl', 'claude_transcreation', 'both']),
})

export async function GET() {
  try {
    const projects = await listProjects()
    return NextResponse.json({ projects })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as unknown
    const parsed = createProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const input = parsed.data
    const project = await createProject({
      ...input,
      target_locales: input.target_locales as Locale[],
      content_types: input.content_types as ContentType[],
      translation_mode: input.translation_mode as TranslationMode,
    })

    await createMarketsForProject(project.id, project.target_locales)

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}
