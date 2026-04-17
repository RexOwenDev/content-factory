/**
 * Demo seed script — populates 3 showcase projects with fixture outputs and eval scores
 * Run: pnpm tsx scripts/seed-demo.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const FIXTURES_DIR = resolve(process.cwd(), 'fixtures')

function loadBrief(name: string) {
  return JSON.parse(readFileSync(`${FIXTURES_DIR}/briefs/${name}.json`, 'utf8'))
}

function loadGenerated(filename: string) {
  try {
    return JSON.parse(readFileSync(`${FIXTURES_DIR}/generated/${filename}`, 'utf8'))
  } catch {
    return null
  }
}

async function insert<T>(table: string, data: object): Promise<T> {
  const { data: result, error } = await (db.from(table) as any).insert(data).select().single()
  if (error) throw new Error(`Insert into ${table} failed: ${error.message}`)
  return result as T
}

async function seedProject(briefFile: string, locales: string[], contentTypes: string[]) {
  const fixture = loadBrief(briefFile)
  console.log(`\nSeeding: ${fixture.name}`)

  // Create project
  const project = await insert<{ id: string }>('projects', {
    name: fixture.name,
    status: 'review',
    brief: fixture.brief,
    brand_voice: fixture.brand_voice,
    target_locales: fixture.target_locales ?? locales,
    content_types: fixture.content_types ?? contentTypes,
    translation_mode: fixture.translation_mode ?? 'both',
  })
  console.log(`  Project: ${project.id}`)

  // Create markets
  const markets: Array<{ id: string; locale: string }> = []
  for (const locale of (fixture.target_locales ?? locales)) {
    const market = await insert<{ id: string; locale: string }>('markets', {
      project_id: project.id,
      locale,
      cultural_context: `Cultural context preset for ${locale}`,
      status: 'complete',
    })
    markets.push(market)
  }
  console.log(`  Markets: ${markets.length}`)

  // Create content jobs + outputs + eval scores per market × content type
  let jobCount = 0
  for (const market of markets) {
    for (const contentType of (fixture.content_types ?? contentTypes)) {
      const job = await insert<{ id: string }>('content_jobs', {
        project_id: project.id,
        market_id: market.id,
        content_type: contentType,
        status: 'review_pending',
        inngest_run_id: null,
        error: null,
        started_at: new Date(Date.now() - 300000).toISOString(),
        completed_at: new Date().toISOString(),
      })

      // Try to load fixture content for this combo
      const productSlug = fixture.brief.product_name.toLowerCase().replace(/\s+/g, '-')
      const generated = loadGenerated(`${productSlug}_${contentType}_en-US.json`)

      const output = await insert<{ id: string }>('outputs', {
        job_id: job.id,
        locale: market.locale,
        content_type: contentType,
        source_content: generated?.content ?? `[Source content for ${contentType} in en-US]`,
        deepl_translation: market.locale !== 'en-US' ? `[DeepL→${market.locale}] Sample translation` : null,
        transcreated_content: market.locale !== 'en-US' ? `[Transcreated→${market.locale}] ${generated?.content?.substring(0, 120) ?? 'Sample content'}...` : null,
        final_content: market.locale !== 'en-US'
          ? `[Transcreated→${market.locale}] ${generated?.content?.substring(0, 200) ?? 'Sample content'}...`
          : (generated?.content ?? `[Content for ${contentType}]`),
        shopify_json: null,
        wordpress_json: null,
      })

      // Eval score — vary by locale/type for demo realism
      const baseScore = 82 + Math.floor(Math.random() * 14)
      await (db.from('eval_scores') as any).insert({
        output_id: output.id,
        score: baseScore,
        tone_match: baseScore + Math.floor(Math.random() * 6) - 2,
        brand_voice_adherence: baseScore + Math.floor(Math.random() * 6) - 3,
        cultural_accuracy: baseScore - Math.floor(Math.random() * 8),
        hallucination_flag: false,
        reasoning: `[SEED] Content demonstrates solid alignment with brand voice. Score reflects ${market.locale} cultural adaptation quality.`,
      })

      jobCount++
    }
  }

  console.log(`  Jobs + outputs + eval scores: ${jobCount}`)
  return project
}

async function main() {
  console.log('ContentFactory — Demo Seed')
  console.log('═══════════════════════════')

  await seedProject('forgetorque-pro', ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'ja-JP'], ['product_description', 'ad_copy', 'meta_tags', 'landing_page_copy'])
  await seedProject('luxdermis-serum', ['en-US', 'fr-FR', 'de-DE', 'ja-JP'], ['product_description', 'ad_copy', 'meta_tags'])
  await seedProject('velocargo-bike', ['en-US', 'fr-FR', 'de-DE', 'nl-NL'], ['product_description', 'ad_copy', 'landing_page_copy'])

  console.log('\n✓ Demo seed complete.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
