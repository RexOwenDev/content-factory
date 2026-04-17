import { supabaseAdmin } from '../client'
import type { Project, Market, Locale, ContentType, TranslationMode, BrandVoiceProfile, ProductBrief } from '../../types'
import { DEFAULT_MARKET_CONFIGS } from '../../config'

export interface CreateProjectInput {
  name: string
  brief: ProductBrief
  brand_voice: BrandVoiceProfile
  target_locales: Locale[]
  content_types: ContentType[]
  translation_mode: TranslationMode
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data, error } = await (supabaseAdmin.from('projects') as any)
    .insert({
      name: input.name,
      status: 'draft',
      brief: input.brief,
      brand_voice: input.brand_voice,
      target_locales: input.target_locales,
      content_types: input.content_types,
      translation_mode: input.translation_mode,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create project: ${error.message}`)
  return data as Project
}

export async function createMarketsForProject(
  projectId: string,
  locales: Locale[]
): Promise<Market[]> {
  const markets = locales.map((locale) => ({
    project_id: projectId,
    locale,
    cultural_context: DEFAULT_MARKET_CONFIGS[locale]?.cultural_context ?? '',
    status: 'pending',
  }))

  const { data, error } = await (supabaseAdmin.from('markets') as any)
    .insert(markets)
    .select()

  if (error) throw new Error(`Failed to create markets: ${error.message}`)
  return data as Market[]
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await (supabaseAdmin.from('projects') as any)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to list projects: ${error.message}`)
  return (data ?? []) as Project[]
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await (supabaseAdmin.from('projects') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Project
}

export async function getProjectWithMarkets(id: string): Promise<{
  project: Project
  markets: Market[]
} | null> {
  const [projectResult, marketsResult] = await Promise.all([
    (supabaseAdmin.from('projects') as any).select('*').eq('id', id).single(),
    (supabaseAdmin.from('markets') as any).select('*').eq('project_id', id).order('locale'),
  ])

  if (projectResult.error || !projectResult.data) return null
  return {
    project: projectResult.data as Project,
    markets: (marketsResult.data ?? []) as Market[],
  }
}
