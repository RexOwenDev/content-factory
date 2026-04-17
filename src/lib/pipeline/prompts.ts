import type { BrandVoiceProfile, ContentType, Locale, ProductBrief } from '../types'
import { CULTURAL_CONTEXT_PRESETS } from '../config'

interface PromptInput {
  brief: ProductBrief
  brandVoice: BrandVoiceProfile
  locale: Locale
}

export function buildGenerationPrompt(
  contentType: ContentType,
  input: PromptInput
): { system: string; user: string } {
  const { brief, brandVoice } = input

  const brandVoiceBlock = `
BRAND VOICE REQUIREMENTS:
- Tone: ${brandVoice.tone}
- Style: ${brandVoice.style}
- Must include these keywords: ${brandVoice.keywords.join(', ') || 'none specified'}
- NEVER use these words: ${brandVoice.avoid_words.join(', ') || 'none specified'}
${brandVoice.sample_copy ? `\nREFERENCE COPY (match this voice):\n"${brandVoice.sample_copy}"` : ''}`

  const briefBlock = `
PRODUCT BRIEF:
- Product name: ${brief.product_name}
- Category: ${brief.category}
- USP: ${brief.usp}
- Target audience: ${brief.target_audience}
- Price point: ${brief.price_point}
- Key features: ${brief.key_features.filter(Boolean).join('; ')}
${brief.extra_context ? `- Additional context: ${brief.extra_context}` : ''}`

  switch (contentType) {
    case 'product_description':
      return {
        system: `You are an expert copywriter specializing in ${brief.category}. Your task is to write a product description in English (en-US) that will be transcreated into multiple languages.\n${brandVoiceBlock}`,
        user: `${briefBlock}\n\nWrite a product description (150–300 words). Lead with the USP. Include 3–4 key features with their specific benefits. Close with a confidence statement. Return the description only — no title, no framing.`,
      }

    case 'ad_copy':
      return {
        system: `You are a conversion copywriter for ${brief.category} targeting ${brief.target_audience}.\n${brandVoiceBlock}`,
        user: `${briefBlock}\n\nWrite ad copy in this exact format:\nHEADLINE: [max 8 words, benefit-driven]\nBODY: [25–50 words, one key benefit + proof point]\nCTA: [max 5 words]\n\nReturn only the formatted ad copy — no commentary.`,
      }

    case 'meta_tags':
      return {
        system: `You are an SEO specialist for ${brief.category}. Write metadata optimized for both search engines and click-through rate.\n${brandVoiceBlock}`,
        user: `${briefBlock}\n\nReturn a JSON object with exactly these fields:\n{\n  "title": "SEO title (50–60 chars, include primary keyword)",\n  "description": "Meta description (140–155 chars, include USP + CTA)",\n  "keywords": "comma-separated focus keywords (5–8 terms)"\n}\nReturn valid JSON only.`,
      }

    case 'landing_page_copy':
      return {
        system: `You are a landing page copywriter for ${brief.category}. Your copy must convert ${brief.target_audience} who are comparison-shopping.\n${brandVoiceBlock}`,
        user: `${briefBlock}\n\nWrite landing page copy in this exact structure:\nHERO_HEADLINE: [max 10 words — the one reason to buy]\nSUBHEADLINE: [max 20 words — who this is for and what they get]\nBENEFIT_1: [label] | [1 sentence]\nBENEFIT_2: [label] | [1 sentence]\nBENEFIT_3: [label] | [1 sentence]\nCTA_PRIMARY: [max 5 words]\nCTA_SECONDARY: [max 5 words]\n\nReturn only the structured copy — no extra commentary.`,
      }
  }
}

export function buildTranscreationPrompt(
  sourceContent: string,
  sourceLocale: Locale,
  targetLocale: Locale,
  brandVoice: BrandVoiceProfile,
  contentType: ContentType
): { system: string; user: string } {
  const culturalContext = CULTURAL_CONTEXT_PRESETS[targetLocale]

  return {
    system: `You are a native ${targetLocale} transcreation specialist with expertise in ${contentType.replace('_', ' ')} copywriting. You do not translate — you transcreate. You adapt meaning, tone, and cultural nuance while preserving the brand voice and factual claims.\n\nBRAND VOICE: ${brandVoice.tone}. ${brandVoice.style}.\nNEVER USE: ${brandVoice.avoid_words.join(', ')}\nMUST INCLUDE (adapted to ${targetLocale}): ${brandVoice.keywords.join(', ')}`,
    user: `CULTURAL CONTEXT FOR ${targetLocale}: ${culturalContext}\n\nSOURCE CONTENT (${sourceLocale}):\n${sourceContent}\n\nTranscreate this into ${targetLocale}. Rules:\n1. Adapt idioms — never translate them literally\n2. Adjust formality register to ${targetLocale} norms\n3. Keep all factual claims (numbers, certifications) exact\n4. Preserve structure and approximate length\n5. Return only the transcreated content — no explanation or framing`,
  }
}

export function buildEvalPrompt(
  content: string,
  brandVoice: BrandVoiceProfile,
  locale: Locale,
  contentType: ContentType
): { system: string; user: string } {
  return {
    system: `You are a brand voice quality evaluator. You assess content against a brand voice profile and return a structured JSON score. You are strict and calibrated — a score of 80 means genuinely good, not just acceptable.`,
    user: `BRAND VOICE PROFILE:
- Tone: ${brandVoice.tone}
- Style: ${brandVoice.style}
- Required keywords: ${brandVoice.keywords.join(', ') || 'none'}
- Banned words: ${brandVoice.avoid_words.join(', ') || 'none'}
- Reference copy: "${brandVoice.sample_copy || 'not provided'}"

TARGET LOCALE: ${locale}
CONTENT TYPE: ${contentType}

CONTENT TO EVALUATE:
${content}

Score the content and return ONLY valid JSON:
{
  "score": <0-100 composite>,
  "tone_match": <0-100>,
  "brand_voice_adherence": <0-100>,
  "cultural_accuracy": <0-100>,
  "hallucination_flag": <true if content claims facts not in the brief>,
  "reasoning": "<1-2 sentences explaining the score>"
}`,
  }
}

export function buildBackTranslationPrompt(
  transcreatedContent: string,
  sourceLocale: Locale,
  targetLocale: Locale
): { system: string; user: string } {
  return {
    system: `You are a professional translator. Translate the following ${targetLocale} content back to ${sourceLocale} literally and accurately. Do not improve or adapt — translate as faithfully as possible.`,
    user: `Translate this ${targetLocale} content to ${sourceLocale}:\n\n${transcreatedContent}\n\nReturn only the translation.`,
  }
}
