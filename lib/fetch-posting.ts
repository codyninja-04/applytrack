import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Fetches a job posting page on the user's behalf. Because this runs on our
 * server, it refuses anything that resolves to a private or local address so
 * the endpoint cannot be used to poke at internal infrastructure.
 */

const BLOCKED_HOSTS = /(^|\.)(linkedin\.com|lnkd\.in)$/i
const MAX_BYTES = 2 * 1024 * 1024
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3

export class PostingFetchError extends Error {}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return mapped ? isPrivateAddress(mapped[1]) : false
  }
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

async function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new PostingFetchError('Only http and https links work')
  }
  if (BLOCKED_HOSTS.test(url.hostname)) {
    throw new PostingFetchError('LinkedIn does not allow automated fetching. Copy the job text and paste it instead.')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address)
  if (addresses.length === 0) throw new PostingFetchError('Could not find that website')
  if (addresses.some(isPrivateAddress)) throw new PostingFetchError('That address is not reachable from here')
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*/g, '\n\n')
    .trim()
}

export async function fetchPostingText(rawUrl: string): Promise<string> {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new PostingFetchError('That does not look like a valid link')
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url)

    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ApplyTrack/1.0; +https://applytrack.sg)',
        Accept: 'text/html,application/xhtml+xml,text/plain',
      },
    }).catch(() => {
      throw new PostingFetchError('The site did not respond. Paste the job text instead.')
    })

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) break
      url = new URL(location, url)
      continue
    }

    if (!res.ok) throw new PostingFetchError(`The site returned ${res.status}. Paste the job text instead.`)

    const type = res.headers.get('content-type') ?? ''
    if (!/text\/html|text\/plain|application\/xhtml/.test(type)) {
      throw new PostingFetchError('That link is not a web page')
    }

    const length = Number(res.headers.get('content-length') ?? 0)
    if (length > MAX_BYTES) throw new PostingFetchError('That page is too large')

    const body = (await res.text()).slice(0, MAX_BYTES)
    const text = type.includes('text/plain') ? body : htmlToText(body)
    if (text.length < 300) {
      throw new PostingFetchError('The page loaded but had almost no text. It probably needs JavaScript. Paste the job text instead.')
    }
    return text
  }

  throw new PostingFetchError('Too many redirects')
}
