import Anthropic from '@anthropic-ai/sdk'

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5'

let client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey })
  }
  return client
}

/** Shared tone rules so every feature sounds like the same honest reviewer. */
export const HOUSE_STYLE = `Writing rules:
- Plain, direct British-Singapore English. Short sentences.
- No em dashes. No exclamation marks. No filler like "Great question" or "It's worth noting".
- Never flatter. If something is weak, say so and say why.`

/**
 * Forces the model to answer through a single tool call, which gives us
 * schema-shaped JSON without parsing prose or stripping code fences.
 */
export async function callStructured<T>(params: {
  system: string
  content: Anthropic.MessageParam['content']
  toolName: string
  toolDescription: string
  schema: Anthropic.Tool['input_schema']
  maxTokens: number
}): Promise<T> {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: params.maxTokens,
    system: params.system,
    tools: [{ name: params.toolName, description: params.toolDescription, input_schema: params.schema }],
    tool_choice: { type: 'tool', name: params.toolName },
    messages: [{ role: 'user', content: params.content }],
  })

  const block = response.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') {
    throw new Error('The model did not return a structured answer')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('The answer was cut off. Try a shorter job description.')
  }
  return block.input as T
}

/** Keeps prompt inputs bounded and strips anything that looks like markup noise. */
export function clip(text: string | null | undefined, max: number): string {
  if (!text) return ''
  const clean = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
  return clean.length > max ? `${clean.slice(0, max)}\n[truncated]` : clean
}

export const str = { type: 'string' } as const
export const strArr = { type: 'array', items: { type: 'string' } } as const
