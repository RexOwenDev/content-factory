import type { Metadata } from 'next'
import { Inter, Geist_Mono, Geist } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ContentFactory',
    template: '%s | ContentFactory',
  },
  description:
    'Multi-market AI content production pipeline. Generate product copy in 12 languages — shaped for Shopify and WordPress.',
  keywords: [
    'content automation',
    'AI copywriting',
    'international marketing',
    'i18n content',
    'Shopify content',
    'WordPress multilingual',
  ],
  openGraph: {
    title: 'ContentFactory',
    description: 'Multi-market AI content production pipeline',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(inter.variable, geistMono.variable, "font-sans", geist.variable)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
