/**
 * KouriChat relay provider for DeepSeek Harness.
 *
 * The provider is a thin pi-ai-backed route whose model metadata carries the
 * reasoning levels the native model menu already understands. GPT and Claude
 * always speak the OpenAI Responses protocol; the endpoint is normalised so a
 * pasted `.../v1/responses` address is accepted.
 */

import { existsSync } from 'node:fs'
import { basename, dirname, join, parse } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * Locate the running DSH installation's `node_modules` directory.
 *
 * A profile bundle is linked from outside the installation, so bare
 * `@deepseek-ai/*` specifiers do not resolve from its own directory. The
 * running Host, however, was started from the installation (possibly inside
 * `app.asar`), so its entry argument reaches that `node_modules` directory.
 */
function findDshNodeModules() {
  const candidates = [process.argv[1], process.argv[0], fileURLToPath(import.meta.url)]
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || candidate.length === 0) continue
    let current = candidate.startsWith('file:') ? fileURLToPath(candidate) : candidate
    if (current.length === 0) continue
    while (current.length > 0) {
      if (basename(current) === 'node_modules' && existsSync(join(current, '@deepseek-ai', 'dsh-llm'))) return current
      const nested = join(current, 'node_modules')
      if (existsSync(join(nested, '@deepseek-ai', 'dsh-llm'))) return nested
      const parent = dirname(current)
      if (parent === current || current === parse(current).root) break
      current = parent
    }
  }
  return undefined
}

const dshNodeModules = findDshNodeModules()
if (dshNodeModules === undefined) {
  throw new Error('kourichat: could not locate the running DSH installation node_modules directory')
}

const importFromDsh = specifier => import(pathToFileURL(join(dshNodeModules, specifier)).href)

const { default: z } = await importFromDsh('@deepseek-ai/schemastery/lib/index.mjs')
const { LlmError, normalizeApiKey } = await importFromDsh('@deepseek-ai/dsh-llm/lib/index.js')
const { credentialRef } = await importFromDsh('@deepseek-ai/dsh-credentials/lib/index.js')
const { PiAiAdapter } = await importFromDsh('@deepseek-ai/dsh-llm-pi-ai/lib/index.js')
const { createProvider } = await importFromDsh('@earendil-works/pi-ai/dist/index.js')
const { openAIResponsesApi } = await importFromDsh('@earendil-works/pi-ai/dist/api/openai-responses.lazy.js')
const { openAICompletionsApi } = await importFromDsh('@earendil-works/pi-ai/dist/api/openai-completions.lazy.js')

const PROVIDER = 'kourichat'
const PRIMARY_BASE_URL = 'https://api.kourichat.com/v1'
const BACKUP_BASE_URL = 'https://api.kouri.chat/v1'
const DEFAULT_MODELS = [
  'claude-sonnet-5',
  'gpt-5.6-terra',
  'gpt-5.6-sol-codex',
  'deepseek-v4-flash',
  'gemini-3.1-pro',
]
const ALL_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']
const GPT_LEVELS = ['off', 'low', 'medium', 'high', 'xhigh', 'max']
const CLAUDE_LEVELS = ['off', 'low', 'medium', 'high', 'max']
const DEEPSEEK_LEVELS = ['off', 'low', 'high', 'max']
const SIMPLE_LEVELS = ['off', 'low', 'medium', 'high']

export const Config = z.object({
  baseURL: z.string().default(PRIMARY_BASE_URL).volatile(),
  apiKeyEnv: z.string().role('credential-ref').default('KOURICHAT_API_KEY').volatile(),
  displayName: z.string().default('KouriChat 推理').volatile(),
  useResponses: z.boolean().default(false).volatile(),
  gptUltra: z.boolean().default(true).volatile(),
  ultraWire: z.union(['max', 'xhigh', 'ultra']).default('max').volatile(),
  models: z.array(z.string()).default(DEFAULT_MODELS).volatile(),
})

export const inject = ['llm', 'credentials']

/** Strip a pasted OpenAI endpoint down to the base the Responses client appends to. */
export function normalizeBaseURL(input) {
  let value = String(input ?? '').trim()
  if (value.length === 0) return PRIMARY_BASE_URL
  value = value.replace(/\/+$/u, '')
  value = value.replace(/\/responses$/iu, '')
  value = value.replace(/\/chat\/completions$/iu, '')
  value = value.replace(/\/+$/u, '')
  return value.length === 0 ? PRIMARY_BASE_URL : value
}

/** The final OpenAI Responses endpoint for one base address. */
export function responsesURL(baseURL) {
  return `${normalizeBaseURL(baseURL)}/responses`
}

/** The final chat endpoint for the selected wire protocol. */
export function requestURL(baseURL, useResponses) {
  return `${normalizeBaseURL(baseURL)}${useResponses ? '/responses' : '/chat/completions'}`
}

/** Classify a model id into the vendor family that decides its reasoning ladder. */
export function familyOf(model) {
  const value = String(model ?? '').toLowerCase()
  if (value.startsWith('gpt-5.6')) return 'gpt56'
  if (value.startsWith('gpt-6.1')) return 'gpt61'
  if (value.startsWith('gpt-6')) return 'gpt6'
  if (value.startsWith('gpt-5')) return 'gpt5'
  if (value.startsWith('gpt-') || value.startsWith('o1') || value.startsWith('o3') || value.startsWith('o4')) return 'gpt'
  if (value.startsWith('claude')) return 'claude'
  if (value.startsWith('deepseek')) return 'deepseek'
  if (value.startsWith('gemini')) return 'gemini'
  if (value.startsWith('grok')) return 'grok'
  if (value.startsWith('kimi')) return 'kimi'
  if (value.startsWith('glm')) return 'glm'
  if (value.startsWith('qwen')) return 'qwen'
  if (value.startsWith('minimax')) return 'minimax'
  if (value.startsWith('mimo')) return 'mimo'
  if (value.startsWith('step')) return 'step'
  if (value.startsWith('longcat')) return 'longcat'
  if (value.startsWith('hy')) return 'hy'
  return 'other'
}

/** Whether this family offers the added top level the settings call "Ultra". */
export function familyOffersUltra(family) {
  return family === 'gpt56' || family === 'gpt6' || family === 'gpt61'
}

/** The reasoning ladder for one family. */
export function levelsFor(family) {
  if (family === 'gpt56' || family === 'gpt6' || family === 'gpt61') return GPT_LEVELS
  if (family === 'gpt5' || family === 'gpt') return GPT_LEVELS
  if (family === 'claude') return CLAUDE_LEVELS
  if (family === 'deepseek') return DEEPSEEK_LEVELS
  return SIMPLE_LEVELS
}

/** Capacity defaults for a model the relay does not describe. */
export function sizingFor(family) {
  if (family === 'gpt56' || family === 'gpt6' || family === 'gpt61') return { contextWindow: 272000, maxTokens: 128000 }
  if (family === 'gpt5') return { contextWindow: 400000, maxTokens: 128000 }
  if (family === 'gpt') return { contextWindow: 128000, maxTokens: 16384 }
  if (family === 'claude') return { contextWindow: 200000, maxTokens: 64000 }
  if (family === 'gemini') return { contextWindow: 1000000, maxTokens: 64000 }
  if (family === 'deepseek') return { contextWindow: 128000, maxTokens: 64000 }
  return { contextWindow: 128000, maxTokens: 32768 }
}

const NAME_TOKENS = new Map([
  ['gpt', 'GPT'],
  ['claude', 'Claude'],
  ['deepseek', 'DeepSeek'],
  ['gemini', 'Gemini'],
  ['kimi', 'Kimi'],
  ['glm', 'GLM'],
  ['qwen', 'Qwen'],
  ['grok', 'Grok'],
  ['minimax', 'MiniMax'],
  ['mimo', 'MiMo'],
  ['step', 'Step'],
  ['longcat', 'LongCat'],
  ['hy', 'HY'],
  ['codex', 'Codex'],
  ['sol', 'Sol'],
  ['terra', 'Terra'],
  ['luna', 'Luna'],
  ['astra', 'Astra'],
  ['carbon', 'Carbon'],
  ['argon', 'Argon'],
  ['opus', 'Opus'],
  ['sonnet', 'Sonnet'],
  ['haiku', 'Haiku'],
  ['fable', 'Fable'],
  ['pro', 'Pro'],
  ['flash', 'Flash'],
  ['max', 'Max'],
  ['plus', 'Plus'],
  ['turbo', 'Turbo'],
  ['mini', 'Mini'],
  ['nano', 'Nano'],
  ['vision', 'Vision'],
  ['r1', 'R1'],
  ['v3', 'V3'],
  ['v4', 'V4'],
])

/** A readable display name for a relay model id. */
export function displayNameOf(model) {
  return String(model ?? '')
    .split(/[-_/]+/u)
    .filter(token => token.length > 0)
    .map((token) => {
      const lower = token.toLowerCase()
      const known = NAME_TOKENS.get(lower)
      if (known !== undefined) return known
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function levelName(level, ultra) {
  if (level === 'max') return ultra ? 'Ultra' : 'Max'
  if (level === 'xhigh') return 'Xhigh'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function levelDescription(level, ultra, ultraWire) {
  switch (level) {
    case 'off': return 'Use for simple tasks that do not need reasoning.'
    case 'low': return 'Prefer for routine or latency-sensitive tasks.'
    case 'medium': return 'A balanced amount of reasoning.'
    case 'high': return 'The default balance for most tasks.'
    case 'xhigh': return 'More reasoning for complex work.'
    case 'max': return ultra
      ? `The highest level; sent as "${ultraWire}".`
      : 'Reserve for the hardest quality-first tasks.'
    default: return undefined
  }
}

/** Build the reasoning metadata the native model menu renders. */
export function reasoningFor(model, settings) {
  const family = familyOf(model)
  const ultra = settings.gptUltra === true && familyOffersUltra(family)
  const levels = levelsFor(family)
  const efforts = levels.map(level => ({
    id: level,
    name: levelName(level, ultra && level === 'max'),
    ...(() => {
      const description = levelDescription(level, ultra && level === 'max', settings.ultraWire)
      return description === undefined ? {} : { description }
    })(),
  }))
  const fallback = levels.includes('high') ? 'high' : levels.includes('medium') ? 'medium' : levels.includes('low') ? 'low' : 'off'
  const defaultEffort = ultra ? 'max' : fallback
  return { efforts, defaultEffort, ultra }
}

function wireFor(level, ultra, ultraWire) {
  if (level === 'off') return 'none'
  if (level === 'max') return ultra ? ultraWire : 'max'
  return level
}

/** Build the pi-ai model descriptor for one relay id. */
export function modelDescriptor(model, settings) {
  const family = familyOf(model)
  const reasoning = reasoningFor(model, settings)
  const sizing = sizingFor(family)
  const useResponses = settings.useResponses === true
  const thinkingLevelMap = {}
  for (const level of ALL_LEVELS) {
    thinkingLevelMap[level] = reasoning.efforts.some(effort => effort.id === level)
      ? wireFor(level, reasoning.ultra, settings.ultraWire)
      : null
  }
  return {
    id: model,
    name: model,
    api: useResponses ? 'openai-responses' : 'openai-completions',
    provider: PROVIDER,
    baseUrl: normalizeBaseURL(settings.baseURL),
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: sizing.contextWindow,
    maxTokens: sizing.maxTokens,
    thinkingLevelMap,
    compat: useResponses
      ? { supportsStrictMode: true, supportsOpenAIGrammarTools: true }
      : { supportsStrictMode: true, supportsReasoningEffort: true, supportsDeveloperRole: true, supportsStore: false },
    type: 'chat',
  }
}

function harnessApiKeyAuth(name) {
  return {
    name,
    resolve: ({ credential }) => Promise.resolve({
      auth: credential?.key === undefined ? {} : { apiKey: credential.key },
      source: name,
    }),
  }
}

/** The route adapter: pi-ai streaming with relay-specific model metadata. */
class KourichatAdapter extends PiAiAdapter {
  constructor(config, readSettings) {
    super(config)
    this.readSettings = readSettings
  }

  modelInfo(snapshot, provider, model) {
    const info = super.modelInfo(snapshot, provider, model)
    const settings = this.readSettings()
    const reasoning = reasoningFor(model, settings)
    return {
      ...info,
      reasoning: {
        efforts: reasoning.efforts,
        defaultEffort: reasoning.defaultEffort,
      },
    }
  }
}

function readConfig(config) {
  return {
    baseURL: normalizeBaseURL(config.baseURL.get()),
    apiKeyEnv: String(config.apiKeyEnv.get() ?? 'KOURICHAT_API_KEY'),
    displayName: String(config.displayName.get() ?? 'KouriChat 推理'),
    useResponses: config.useResponses.get() === true,
    gptUltra: config.gptUltra.get() !== false,
    ultraWire: String(config.ultraWire.get() ?? 'max'),
    models: [...new Set((config.models.get() ?? []).map(model => String(model).trim()).filter(Boolean))],
  }
}

function configSignature(settings) {
  return JSON.stringify([
    settings.baseURL,
    settings.apiKeyEnv,
    settings.displayName,
    settings.useResponses,
    settings.gptUltra,
    settings.ultraWire,
    settings.models,
  ])
}

function credentialName(settings) {
  return settings.apiKeyEnv.length === 0 ? 'KOURICHAT_API_KEY' : settings.apiKeyEnv
}

function usableKey(settings, raw) {
  const normalized = normalizeApiKey(raw)
  if (!normalized.ok) {
    throw new LlmError(
      `KouriChat API key "${credentialName(settings)}" is ${normalized.reason === 'empty' ? 'empty' : 'not a usable HTTP header value'}`,
      'INVALID_CREDENTIAL',
    )
  }
  return normalized.value
}

async function resolveKey(ctx, settings, supplied) {
  if (typeof supplied === 'string' && supplied.trim().length > 0) return usableKey(settings, supplied)
  let ref
  try {
    ref = credentialRef(credentialName(settings))
  } catch (error) {
    throw new LlmError(`KouriChat credential reference "${credentialName(settings)}" is not a POSIX identifier`, 'INVALID_CREDENTIAL', { cause: error })
  }
  const resolved = await ctx.credentials.resolve(ref)
  if (resolved === undefined) {
    throw new LlmError(`KouriChat API key "${credentialName(settings)}" is not configured`, 'MISSING_CREDENTIAL')
  }
  return usableKey(settings, resolved.value)
}

function buildProvider(settings) {
  return createProvider({
    id: PROVIDER,
    name: settings.displayName,
    baseUrl: settings.baseURL,
    models: settings.models.map(model => modelDescriptor(model, settings)),
    api: settings.useResponses ? openAIResponsesApi() : openAICompletionsApi(),
    auth: { apiKey: harnessApiKeyAuth(settings.displayName) },
  })
}

function buildProfile(settings, provider) {
  return {
    provider: PROVIDER,
    displayName: settings.displayName,
    streamIdleTimeoutMs: 300000,
    maxRequestImageBytes: 20 * 1024 * 1024,
    maxRequestImages: 50,
    imageOffloadCountQuantum: 10,
    requestImagePixelBudget: 4 * 1024 * 1024,
    requestImageMaxBytes: 1024 * 1024,
    configuredMaxTokens: new Map(),
    modelErrors: new Map(),
    piProvider: provider,
  }
}

/** Mount the provider, refresh it on volatile settings writes, and offer discovery. */
export function apply(ctx, config) {
  const read = () => readConfig(config)
  let profiles = new Map()
  let signature

  const materialize = () => {
    const settings = read()
    const provider = buildProvider(settings)
    const profile = buildProfile(settings, provider)
    profiles = new Map([[PROVIDER, profile]])
    signature = configSignature(settings)
    return settings
  }

  materialize()
  const adapter = new KourichatAdapter({
    profiles: () => profiles,
    auth: undefined,
    resolveApiKey: () => resolveKey(ctx, read(), undefined),
    onReplayDegrade: ({ provider: route, model, reason }) => {
      ctx.logger.warn(`kourichat: replay metadata degraded for ${route}/${model}: ${reason}`)
    },
  }, read)
  const registration = ctx.llm.registerAdapter([PROVIDER], adapter)

  ctx.effect(() => () => registration(), 'kourichat: provider registration')

  ctx.on('loader/volatile-update', () => {
    try {
      const settings = read()
      if (configSignature(settings) === signature) return
      materialize()
      registration.replace([PROVIDER])
    } catch (error) {
      ctx.logger.error('kourichat: could not refresh the provider configuration')
      ctx.logger.error(error)
    }
  })

  ctx.llm.registerModelDiscovery(PROVIDER, async (request) => {
    const settings = read()
    const baseURL = normalizeBaseURL(request.baseURL ?? settings.baseURL)
    const key = await resolveKey(ctx, settings, request.apiKey)
    const url = `${baseURL}/models`
    let response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${key}`,
        },
        ...request.signal === undefined ? {} : { signal: request.signal },
      })
    } catch (error) {
      if (request.signal?.aborted) throw new LlmError('KouriChat model discovery was aborted', 'ABORTED', { cause: error })
      throw new LlmError(`Could not reach ${url}`, 'DISCOVERY_FAILED', { cause: error })
    }
    if (!response.ok) {
      throw new LlmError(
        `${url} answered ${response.status}${response.status === 401 || response.status === 403 ? '; check the API key' : ''}`,
        'DISCOVERY_FAILED',
      )
    }
    let body
    try {
      body = await response.json()
    } catch (error) {
      throw new LlmError(`${url} did not answer with JSON`, 'DISCOVERY_FAILED', { cause: error })
    }
    const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body?.models) ? body.models : []
    const seen = new Set()
    const models = []
    for (const row of rows) {
      const id = typeof row === 'string' ? row : typeof row?.id === 'string' ? row.id : undefined
      if (id === undefined || id.length === 0 || seen.has(id)) continue
      seen.add(id)
      const name = typeof row?.id === 'string' && typeof row?.name === 'string' ? row.name : id
      models.push({ id, name })
    }
    return models
  })
}

export { PROVIDER, PRIMARY_BASE_URL, BACKUP_BASE_URL }
