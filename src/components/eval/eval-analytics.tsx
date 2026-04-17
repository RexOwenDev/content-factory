'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { CONTENT_TYPE_LABELS, LOCALE_FLAGS } from '@/lib/config'
import type { ContentType, Locale } from '@/lib/types'

interface EvalSummary {
  total: number
  avg_score: number
  avg_tone_match: number
  avg_brand_voice: number
  avg_cultural: number
  pass_count: number
  warn_count: number
  fail_count: number
  hallucination_count: number
}

interface ByLocale {
  locale: Locale
  avg_score: number
  count: number
}

interface ByContentType {
  contentType: ContentType
  avg_score: number
  count: number
}

interface EvalAnalyticsProps {
  summary: EvalSummary
  byLocale: ByLocale[]
  byContentType: ByContentType[]
}

function scoreColor(score: number) {
  if (score >= 80) return 'var(--color-accent-green)'
  if (score >= 60) return '#f59e0b'
  return 'var(--color-accent-red, #f85149)'
}

export function EvalAnalytics({ summary, byLocale, byContentType }: EvalAnalyticsProps) {
  const radarData = [
    { dimension: 'Composite', value: summary.avg_score },
    { dimension: 'Tone', value: summary.avg_tone_match },
    { dimension: 'Brand voice', value: summary.avg_brand_voice },
    { dimension: 'Cultural', value: summary.avg_cultural },
  ]

  const localeBarData = byLocale
    .slice()
    .sort((a, b) => b.avg_score - a.avg_score)
    .map((row) => ({
      name: `${LOCALE_FLAGS[row.locale] ?? '🌐'} ${row.locale}`,
      score: row.avg_score,
    }))

  const ctBarData = byContentType.map((row) => ({
    name: CONTENT_TYPE_LABELS[row.contentType] ?? row.contentType,
    score: row.avg_score,
  }))

  return (
    <div className="space-y-6">
      {/* Stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Avg score"
          value={summary.avg_score}
          sub={`${summary.total} evals`}
          color={scoreColor(summary.avg_score)}
        />
        <StatCard
          label="Passed"
          value={summary.pass_count}
          sub={`≥ 75 score`}
          color="var(--color-accent-green)"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Warned"
          value={summary.warn_count}
          sub="50–74 score"
          color="#f59e0b"
        />
        <StatCard
          label="Hallucinations"
          value={summary.hallucination_count}
          sub="flag triggered"
          color={summary.hallucination_count > 0 ? 'var(--color-accent-red, #f85149)' : 'var(--color-text-muted)'}
          icon={summary.hallucination_count > 0 ? <AlertTriangle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar chart */}
        <div
          className="rounded-xl border p-5 space-y-3"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Score dimensions
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              />
              <Radar
                dataKey="value"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.25}
                dot={{ fill: 'var(--color-primary)', r: 3 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* By content type */}
        <div
          className="rounded-xl border p-5 space-y-3"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Score by content type
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ctBarData} layout="vertical" margin={{ left: 8 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--color-text)',
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {ctBarData.map((entry, i) => (
                  <Cell key={i} fill={scoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By locale */}
      {localeBarData.length > 0 && (
        <div
          className="rounded-xl border p-5 space-y-3"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Score by locale
          </p>
          <ResponsiveContainer width="100%" height={Math.max(180, localeBarData.length * 28)}>
            <BarChart data={localeBarData} layout="vertical" margin={{ left: 8 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--color-text)',
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {localeBarData.map((entry, i) => (
                  <Cell key={i} fill={scoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string
  value: number
  sub: string
  color: string
  icon?: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-2xl font-bold font-mono">{value}</span>
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
        {label}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {sub}
      </p>
    </div>
  )
}
