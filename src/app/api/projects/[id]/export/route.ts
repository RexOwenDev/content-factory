import { NextRequest, NextResponse } from 'next/server'
import { getProjectWithMarkets } from '@/lib/db/queries/projects'
import { listOutputsByProject } from '@/lib/db/queries/outputs'
import { adapters } from '@/lib/adapters'
import type { Output } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

interface ExportBundle {
  project: { id: string; name: string; status: string }
  exportedAt: string
  adapterMode: string
  markets: Array<{
    locale: string
    outputs: Array<{
      contentType: string
      sourceContent: string
      finalContent: string | null
      shopify: ReturnType<typeof adapters.shopify>['shape'] extends (...args: any[]) => infer R ? R : never
      wordpress: ReturnType<typeof adapters.wordpress>['shape'] extends (...args: any[]) => infer R ? R : never
    }>
  }>
}

export async function POST(_req: NextRequest, { params }: Props) {
  const { id } = await params

  const result = await getProjectWithMarkets(id).catch(() => null)
  if (!result) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { project } = result
  const outputs = await listOutputsByProject(id).catch(() => [] as Output[])

  const shopify = adapters.shopify()
  const wordpress = adapters.wordpress()

  // Group outputs by locale
  const byLocale = new Map<string, Output[]>()
  for (const output of outputs) {
    const existing = byLocale.get(output.locale) ?? []
    existing.push(output)
    byLocale.set(output.locale, existing)
  }

  const markets = Array.from(byLocale.entries()).map(([locale, localeOutputs]) => ({
    locale,
    outputs: localeOutputs.map((output) => {
      // Parse meta from final_content if meta_tags type
      let metaTags: Record<string, string> = {}
      if (output.content_type === 'meta_tags' && output.final_content) {
        try {
          metaTags = JSON.parse(output.final_content) as Record<string, string>
        } catch {
          metaTags = {}
        }
      }

      const title = project.brief.product_name
      const description = output.final_content ?? output.source_content
      const adCopy = output.content_type === 'ad_copy' ? description : ''

      const shopifyPayload = shopify.shape({
        title,
        description,
        adCopy,
        metaTags,
        locale: output.locale as any,
      })

      const wpPayload = wordpress.shape({
        title,
        description,
        adCopy,
        metaTags,
        locale: output.locale as any,
        originalPostId: 0,
        siteUrl: `https://${project.brief.product_name.toLowerCase().replace(/\s+/g, '-')}.com`,
      })

      return {
        contentType: output.content_type,
        sourceContent: output.source_content,
        finalContent: output.final_content,
        shopify: shopifyPayload,
        wordpress: wpPayload,
      }
    }),
  }))

  const bundle = {
    project: { id: project.id, name: project.name, status: project.status },
    exportedAt: new Date().toISOString(),
    adapterMode: process.env['ADAPTER_MODE'] ?? 'fixture',
    markets,
  }

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="contentfactory-${id}-export.json"`,
    },
  })
}
