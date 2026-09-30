import type { JDKeyword, KeywordCoverage } from '@/lib/types'

/**
 * Keyword coverage is counted in code, not estimated by the model. ATS
 * filters do literal matching, so the honest number is "does this exact term
 * (or an accepted alias) appear in the resume text", nothing fuzzier.
 */

function normalise(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
}

/** "CI/CD" -> "CICD", "Node.js" -> "Nodejs", "e-commerce" -> "ecommerce", still word bounded. */
function joinPunctuated(text: string): string {
  return text.replace(/([a-z0-9])[./-](?=[a-z0-9])/gi, '$1')
}

function compact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#]/g, '')
}

function termAppears(term: string, haystack: string, haystackJoined: string, haystackCompact: string): boolean {
  const n = normalise(term).trim()
  if (!n) return false
  if (haystack.includes(` ${n} `)) return true
  const joined = normalise(joinPunctuated(term)).trim()
  if (haystackJoined.includes(` ${joined} `)) return true
  // Plural and simple -ing / -ed forms: "API" vs "APIs", "deploy" vs "deployed"
  if (haystack.includes(` ${n}s `) || haystack.includes(` ${n}es `) || haystack.includes(` ${n}ed `) || haystack.includes(` ${n}ing `)) {
    return true
  }
  // "Node.js" vs "NodeJS", "CI/CD" vs "CICD". Only for longer terms, otherwise
  // "go" would match inside "google".
  const c = compact(term)
  return c.length >= 5 && haystackCompact.includes(c)
}

export function keywordCoverage(resumeText: string, keywords: JDKeyword[]): KeywordCoverage {
  const hay = normalise(resumeText)
  const hayJoined = normalise(joinPunctuated(resumeText))
  const hayCompact = compact(resumeText)

  const found: string[] = []
  const missing: string[] = []
  const mustMissing: string[] = []
  const seen = new Set<string>()

  for (const kw of keywords) {
    const key = kw.term.toLowerCase().trim()
    if (!key || seen.has(key)) continue
    seen.add(key)

    const hit = [kw.term, ...(kw.aliases ?? [])].some((t) => termAppears(t, hay, hayJoined, hayCompact))
    if (hit) {
      found.push(kw.term)
    } else {
      missing.push(kw.term)
      if (kw.must_have) mustMissing.push(kw.term)
    }
  }

  const total = found.length + missing.length
  return {
    found,
    missing,
    must_have_missing: mustMissing,
    percent: total === 0 ? 0 : Math.round((found.length / total) * 100),
  }
}
