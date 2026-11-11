window.__ModuleLoader__.load({
  id: '@local/dsh-kourichat',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const {
      Button,
      Checkbox,
      Input,
      Modal,
      Switch,
    } = require('@deepseek-ai/dsh-client-ui-primitives')

    const NS = 'kourichat'
    const PROVIDER = 'kourichat'
    const PRIMARY_BASE_URL = 'https://api.kourichat.com/v1'
    const BACKUP_BASE_URL = 'https://api.kouri.chat/v1'
    const DEFAULT_API_KEY_ENV = 'KOURICHAT_API_KEY'
    const EXCLUDED_MODEL = /embedding|rerank|image|ocr|search|weblens|realtime|tts|whisper|audio|classifier|moderation|seedream|gpt-image/iu

    const zh = {
      title: 'KouriChat',
      intro: '一键接入 KouriChat 中转站。默认使用 /v1 普通端点，可切换 OpenAI Responses；推理等级在模型菜单中调整，与原生 DeepSeek 一致的用法。',
      badge: 'OpenAI Responses',
      badgeCompletions: 'v1 普通端点',
      useResponses: '使用 OpenAI Responses 端点',
      useResponsesHint: '关闭时使用 /v1 的普通 Chat Completions 端点（默认）；开启时改用 /v1/responses 推理端点。',
      endpoint: 'API 端点',
      endpointPrimary: 'KouriChat 主站',
      endpointBackup: 'KouriChat 备用站',
      endpointCustom: '自定义端点',
      endpointPlaceholder: 'https://api.kourichat.com/v1',
      endpointHint: '实际请求：{url}。',
      apiKey: 'API 密钥',
      apiKeyStored: '已保存（留空保持不变）',
      apiKeyPlaceholder: 'sk-kouri-…',
      apiKeyHint: '密钥写入 DSH 凭据库，不会存进配置文件。',
      gptUltra: 'GPT 推理等级兼容',
      gptUltraHint: '开启后为 GPT-5.6 / GPT-6 / 6.1 增加 Ultra 档并作为默认档；关闭后恢复 Off / Low / Medium / High / Xhigh / Max。',
      ultraWire: 'Ultra 发送值',
      ultraWireMax: 'Max（推荐，兼容）',
      ultraWireXhigh: 'Xhigh',
      ultraWireUltra: 'Ultra（实验，可能被上游拒绝）',
      ultraWireHint: 'KouriChat 的 Responses 接口只接受 none / minimal / low / medium / high / xhigh / max；Ultra 档默认映射为 Max。',
      models: '模型',
      modelsCount: '已启用 {count} 个模型',
      modelsEmpty: '尚未启用模型。先获取列表，或添加自定义模型。',
      modelsMore: '等 {count} 个',
      fetchModels: '获取模型列表',
      fetching: '获取中…',
      save: '保存并启用',
      saving: '保存中…',
      saved: '已保存。模型菜单会在下次打开时刷新。',
      keySaved: 'API 密钥已保存。',
      oldRoute: '检测到旧版 KouriChat 路由。请优先选择「KouriChat 推理」模型组；旧路由没有推理等级。',
      loadFailed: '无法读取插件设置：{message}',
      inactive: 'KouriChat 插件尚未激活或设置命名空间不可用。',
      pickerTitle: '选择 KouriChat 模型',
      pickerIntro: '从 {endpoint} 获取到 {count} 个模型。勾选要启用的模型。',
      pickerSearch: '搜索模型',
      pickerSelectAll: '全选对话模型',
      pickerClear: '清空',
      pickerEmpty: '没有匹配的模型。',
      customModel: '自定义模型 ID',
      customModelPlaceholder: '例如 gpt-5.7-preview 或 claude-opus-5-6',
      addCustom: '添加',
      cancel: '取消',
      applyModels: '启用 {count} 个模型',
      noSelection: '至少选择一个模型。',
      fetchFailed: '获取模型失败：{message}',
      saveFailed: '保存失败：{message}',
      invalidEndpoint: '请输入以 http:// 或 https:// 开头的端点。',
      close: '关闭',
      current: '当前',
    }

    const en = {
      title: 'KouriChat',
      intro: 'Connect the KouriChat relay in one step. The ordinary /v1 endpoint is the default; OpenAI Responses is optional. Reasoning levels are adjusted from the native model menu just like DeepSeek.',
      badge: 'OpenAI Responses',
      badgeCompletions: 'v1 chat endpoint',
      useResponses: 'Use the OpenAI Responses endpoint',
      useResponsesHint: 'Off uses the ordinary /v1 Chat Completions endpoint (default); on uses the /v1/responses reasoning endpoint.',
      endpoint: 'API endpoint',
      endpointPrimary: 'KouriChat primary',
      endpointBackup: 'KouriChat backup',
      endpointCustom: 'Custom endpoint',
      endpointPlaceholder: 'https://api.kourichat.com/v1',
      endpointHint: 'Requests go to {url}.',
      apiKey: 'API key',
      apiKeyStored: 'Saved (leave blank to keep it)',
      apiKeyPlaceholder: 'sk-kouri-…',
      apiKeyHint: 'The key is stored in the DSH credential store, never in the configuration file.',
      gptUltra: 'GPT reasoning compatibility',
      gptUltraHint: 'Adds an Ultra level and makes it the default for GPT-5.6 / GPT-6 / 6.1. Turn it off to use Off / Low / Medium / High / Xhigh / Max only.',
      ultraWire: 'Ultra wire value',
      ultraWireMax: 'Max (recommended, compatible)',
      ultraWireXhigh: 'Xhigh',
      ultraWireUltra: 'Ultra (experimental, upstream may reject)',
      ultraWireHint: 'KouriChat Responses accepts none / minimal / low / medium / high / xhigh / max; the Ultra level maps to Max by default.',
      models: 'Models',
      modelsCount: '{count} models enabled',
      modelsEmpty: 'No models enabled yet. Fetch the list or add a custom model.',
      modelsMore: 'and {count} more',
      fetchModels: 'Fetch models',
      fetching: 'Fetching…',
      save: 'Save and enable',
      saving: 'Saving…',
      saved: 'Saved. The model menu refreshes the next time it opens.',
      keySaved: 'API key saved.',
      oldRoute: 'An older KouriChat route is present. Prefer the “KouriChat 推理” model group; the old route has no reasoning levels.',
      loadFailed: 'Could not read plugin settings: {message}',
      inactive: 'The KouriChat plugin is not active or its settings namespace is unavailable.',
      pickerTitle: 'Choose KouriChat models',
      pickerIntro: '{count} models returned by {endpoint}. Select the ones to enable.',
      pickerSearch: 'Search models',
      pickerSelectAll: 'Select chat models',
      pickerClear: 'Clear',
      pickerEmpty: 'No matching models.',
      customModel: 'Custom model ID',
      customModelPlaceholder: 'e.g. gpt-5.7-preview or claude-opus-5-6',
      addCustom: 'Add',
      cancel: 'Cancel',
      applyModels: 'Enable {count} models',
      noSelection: 'Select at least one model.',
      fetchFailed: 'Could not fetch models: {message}',
      saveFailed: 'Could not save: {message}',
      invalidEndpoint: 'Enter an endpoint starting with http:// or https://.',
      close: 'Close',
      current: 'Current',
    }

    function normalizeBaseURL(input) {
      let value = String(input ?? '').trim()
      if (value.length === 0) return PRIMARY_BASE_URL
      value = value.replace(/\/+$/u, '')
      value = value.replace(/\/responses$/iu, '')
      value = value.replace(/\/chat\/completions$/iu, '')
      value = value.replace(/\/+$/u, '')
      return value.length === 0 ? PRIMARY_BASE_URL : value
    }

    function isHttpURL(value) {
      try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    }

    function isChatModel(id) {
      return typeof id === 'string' && id.length > 0 && !EXCLUDED_MODEL.test(id)
    }

    function endpointKindOf(endpoint) {
      if (endpoint === PRIMARY_BASE_URL) return 'primary'
      if (endpoint === BACKUP_BASE_URL) return 'backup'
      return 'custom'
    }

    const styles = {
      card: {
        border: '0.5px solid var(--dsw-alias-settings-card-stroke)',
        background: 'var(--dsw-alias-settings-card-fill)',
        borderRadius: 'var(--dsw-radius-xl)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        color: 'var(--dsw-alias-label-primary)',
        boxSizing: 'border-box',
      },
      header: { display: 'flex', alignItems: 'flex-start', gap: 12 },
      icon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        flex: 'none',
        objectFit: 'cover',
        background: 'var(--dsw-alias-bg-module-platform)',
      },
      headerText: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 },
      title: { margin: 0, fontSize: 14, fontWeight: 500, lineHeight: '22px' },
      intro: { margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-tertiary)' },
      badge: {
        flex: 'none',
        border: '0.5px solid var(--dsw-alias-border-l3)',
        borderRadius: 'var(--dsw-radius-xs)',
        color: 'var(--dsw-alias-label-secondary)',
        padding: '1px 6px',
        fontSize: 11,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      },
      field: { display: 'flex', flexDirection: 'column', gap: 4 },
      label: { fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' },
      hint: { margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' },
      select: {
        boxSizing: 'border-box',
        height: 36,
        width: '100%',
        border: 'none',
        borderRadius: 'var(--dsw-radius-md)',
        background: 'var(--dsw-alias-bg-module-platform)',
        color: 'var(--dsw-alias-label-primary)',
        padding: '0 12px',
        font: 'inherit',
        fontSize: 14,
        lineHeight: '22px',
      },
      inline: { display: 'flex', alignItems: 'center', gap: 8 },
      secretRow: { display: 'flex', alignItems: 'center', gap: 8 },
      secretDot: (configured) => ({
        width: 8,
        height: 8,
        borderRadius: '50%',
        flex: 'none',
        background: configured ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-error-primary)',
      }),
      switchRow: { display: 'flex', alignItems: 'flex-start', gap: 10 },
      switchText: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 },
      actions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
      status: (tone) => ({
        margin: 0,
        fontSize: 12,
        lineHeight: '18px',
        color: tone === 'error' ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-state-success-primary)',
      }),
      warning: { margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-state-warn-label)' },
      modelLine: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
      modelText: { fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' },
      pickerBody: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '58vh' },
      searchRow: { display: 'flex', width: '100%' },
      pickerActions: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
      pickerList: {
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '4px 0',
        borderTop: '0.5px solid var(--dsw-alias-border-l2)',
        borderBottom: '0.5px solid var(--dsw-alias-border-l2)',
      },
      pickerRow: { display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 },
      customRow: { display: 'flex', alignItems: 'center', gap: 8 },
      grow: { flex: 1, minWidth: 0 },
      footer: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
    }

    const inject = ['slots', 'locale', 'remote', 'remote.settings', 'remote.credentials', 'remote.llm']

    /**
     * Keep the optional dsh-effort-slider from showing a second Ultra level.
     *
     * The slider appends its own Ultra stop to the native effort ladder. For a
     * GPT or Claude model, the native ladder already owns the top level (Ultra
     * for GPT-5.6/6/6.1, Max for Claude), so the appended stop is redundant.
     * This is a visual DOM/CSS integration only: it is a no-op when the slider
     * is absent, and it never touches the slider's React state or its host.
     */
    function installSliderCompatibility() {
      if (typeof document === 'undefined' || document.body === null || document.head === null) return () => {}
      const style = document.createElement('style')
      style.dataset.plugin = '@local/dsh-kourichat/slider-compat'
      style.textContent = [
        'html[data-kouri-native-ultra] .es-tick--ultra{display:none!important}',
        'html[data-kouri-native-ultra] .es-readout__of{display:none!important}',
        'html[data-kouri-native-ultra] .es-rail__grid i:last-child{display:none!important}',
      ].join('\n')
      document.head.appendChild(style)
      let scheduled = false
      const sync = () => {
        scheduled = false
        const root = document.documentElement
        let nativeUltra = false
        for (const tick of document.querySelectorAll('.es-tick')) {
          if (tick.classList.contains('es-tick--ultra')) continue
          if ((tick.textContent || '').trim().toLowerCase() === 'ultra') {
            nativeUltra = true
            break
          }
        }
        let modelId = ''
        const labelled = document.querySelector('[data-model-id]')
        if (labelled !== null) modelId = labelled.getAttribute('data-model-id') || ''
        if (modelId.length === 0) {
          const sliderModel = document.querySelector('.es-model')
          if (sliderModel !== null) modelId = (sliderModel.textContent || '').trim()
        }
        const gptOrClaude = /^(gpt|claude)/iu.test(modelId)
        const hasSyntheticUltra = document.querySelector('.es-tick--ultra') !== null
        if ((nativeUltra || gptOrClaude) && hasSyntheticUltra) root.setAttribute('data-kouri-native-ultra', '1')
        else root.removeAttribute('data-kouri-native-ultra')
      }
      const schedule = () => {
        if (scheduled) return
        scheduled = true
        queueMicrotask(sync)
      }
      const observer = new MutationObserver(schedule)
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['data-model-id'],
      })
      sync()
      return () => {
        observer.disconnect()
        style.remove()
        document.documentElement.removeAttribute('data-kouri-native-ultra')
      }
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'kourichat: locale dictionaries')
      ctx.effect(() => installSliderCompatibility(), 'kourichat: effort-slider compatibility')
      const t = ctx.locale.bind(NS)

      function format(key, values) {
        let text = t(key)
        for (const [name, value] of Object.entries(values ?? {})) text = text.replaceAll(`{${name}}`, String(value))
        return text
      }

      function applyView(setState, view, configured) {
        const value = view?.value ?? {}
        setState(current => ({
          ...current,
          status: 'ready',
          revision: view?.revision ?? current.revision,
          endpoint: typeof value.baseURL === 'string' ? value.baseURL : PRIMARY_BASE_URL,
          apiKeyEnv: typeof value.apiKeyEnv === 'string' ? value.apiKeyEnv : DEFAULT_API_KEY_ENV,
          useResponses: value.useResponses === true,
          gptUltra: value.gptUltra !== false,
          ultraWire: typeof value.ultraWire === 'string' ? value.ultraWire : 'max',
          models: Array.isArray(value.models) ? value.models.filter(isChatModel) : [],
          keyConfigured: configured ?? current.keyConfigured,
          error: null,
        }))
      }

      function KouriCard() {
        const [state, setState] = React.useState({
          status: 'loading',
          revision: 0,
          endpoint: PRIMARY_BASE_URL,
          apiKeyEnv: DEFAULT_API_KEY_ENV,
          useResponses: false,
          gptUltra: true,
          ultraWire: 'max',
          models: [],
          keyConfigured: false,
          error: null,
        })
        const [endpointKind, setEndpointKind] = React.useState('primary')
        const [customEndpoint, setCustomEndpoint] = React.useState('')
        const [keyDraft, setKeyDraft] = React.useState('')
        const [busy, setBusy] = React.useState(null)
        const [notice, setNotice] = React.useState(null)
        const [picker, setPicker] = React.useState(null)
        const [customModel, setCustomModel] = React.useState('')
        const [oldRoute, setOldRoute] = React.useState(false)
        const alive = React.useRef(true)

        React.useEffect(() => {
          alive.current = true
          return () => {
            alive.current = false
          }
        }, [])

        const load = React.useCallback(async () => {
          setState(current => ({ ...current, status: 'loading', error: null }))
          try {
            const described = await ctx.remote.settings.describe()
            if (!alive.current) return
            if (!described.ok) {
              setState(current => ({ ...current, status: 'error', error: described.error.message }))
              return
            }
            const view = described.value.namespaces.find(entry => entry.ns === NS)
            if (view === undefined) {
              setState(current => ({ ...current, status: 'error', error: t('inactive') }))
              return
            }
            const ref = typeof view.value?.apiKeyEnv === 'string' ? view.value.apiKeyEnv : DEFAULT_API_KEY_ENV
            const credential = await ctx.remote.credentials.describe([ref])
            if (!alive.current) return
            const configured = credential.ok ? credential.value[ref]?.configured === true : false
            applyView(setState, view, configured)
            setEndpointKind(endpointKindOf(view.value?.baseURL ?? PRIMARY_BASE_URL))
            setCustomEndpoint(endpointKindOf(view.value?.baseURL ?? PRIMARY_BASE_URL) === 'custom' ? (view.value?.baseURL ?? '') : '')
            try {
              const providers = await ctx.remote.llm.listProviders()
              if (alive.current && providers.ok) setOldRoute(providers.value.some(entry => entry.id === 'kouri'))
            } catch {
              // Listing providers is only a hint; the card remains usable without it.
            }
          } catch (error) {
            if (!alive.current) return
            setState(current => ({ ...current, status: 'error', error: error instanceof Error ? error.message : String(error) }))
          }
        }, [])

        React.useEffect(() => {
          void load()
        }, [load])

        const currentEndpoint = endpointKind === 'custom' ? customEndpoint : state.endpoint

        function chooseEndpoint(kind) {
          setEndpointKind(kind)
          if (kind === 'primary') {
            setState(current => ({ ...current, endpoint: PRIMARY_BASE_URL }))
          } else if (kind === 'backup') {
            setState(current => ({ ...current, endpoint: BACKUP_BASE_URL }))
          } else {
            setCustomEndpoint(endpointKindOf(state.endpoint) === 'custom' ? state.endpoint : '')
          }
        }

        async function persist(nextModels) {
          const base = normalizeBaseURL(currentEndpoint)
          if (!isHttpURL(base)) {
            setNotice({ tone: 'error', text: t('invalidEndpoint') })
            return false
          }
          setBusy('save')
          setNotice(null)
          try {
            const response = await ctx.remote.settings.mutate(NS, [
              { op: 'set', path: ['baseURL'], value: base },
              { op: 'set', path: ['useResponses'], value: state.useResponses },
              { op: 'set', path: ['gptUltra'], value: state.gptUltra },
              { op: 'set', path: ['ultraWire'], value: state.ultraWire },
              { op: 'set', path: ['models'], value: nextModels },
            ], state.revision)
            if (!response.ok) {
              setNotice({ tone: 'error', text: format('saveFailed', { message: response.error.message }) })
              return false
            }
            let configured = state.keyConfigured
            const draft = keyDraft.trim()
            if (draft.length > 0) {
              const stored = await ctx.remote.credentials.set(state.apiKeyEnv, draft)
              if (!stored.ok) {
                applyView(setState, response.value, false)
                setNotice({ tone: 'error', text: format('saveFailed', { message: stored.error.message }) })
                return false
              }
              configured = true
              setKeyDraft('')
            }
            applyView(setState, response.value, configured)
            setEndpointKind(endpointKindOf(base))
            setNotice({ tone: 'success', text: t('saved') })
            return true
          } finally {
            setBusy(null)
          }
        }

        async function fetchModels() {
          const base = normalizeBaseURL(currentEndpoint)
          if (!isHttpURL(base)) {
            setNotice({ tone: 'error', text: t('invalidEndpoint') })
            return
          }
          setBusy('fetch')
          setNotice(null)
          try {
            const request = { baseURL: base, api: state.useResponses ? 'openai-responses' : 'openai-completions' }
            const draft = keyDraft.trim()
            if (draft.length > 0) request.apiKey = draft
            const response = await ctx.remote.llm.discoverModels(NS, request)
            if (!response.ok) {
              setNotice({ tone: 'error', text: format('fetchFailed', { message: response.error.message }) })
              return
            }
            const models = response.value.filter(model => isChatModel(model.id))
            if (models.length === 0) {
              setNotice({ tone: 'error', text: format('fetchFailed', { message: 'no chat models returned' }) })
              return
            }
            const selected = state.models.length > 0
              ? state.models.filter(id => models.some(model => model.id === id))
              : models.map(model => model.id)
            setPicker({ models, selected, query: '' })
          } finally {
            setBusy(null)
          }
        }

        function toggleModel(id) {
          setPicker(current => {
            if (current === null) return current
            const selected = current.selected.includes(id)
              ? current.selected.filter(value => value !== id)
              : [...current.selected, id]
            return { ...current, selected }
          })
        }

        function addCustom() {
          const id = customModel.trim()
          if (id.length === 0) return
          setPicker(current => {
            if (current === null) return current
            const models = current.models.some(model => model.id === id)
              ? current.models
              : [{ id, name: id }, ...current.models]
            const selected = current.selected.includes(id) ? current.selected : [...current.selected, id]
            return { ...current, models, selected }
          })
          setCustomModel('')
        }

        async function applyPicker() {
          if (picker === null) return
          if (picker.selected.length === 0) {
            setNotice({ tone: 'error', text: t('noSelection') })
            return
          }
          const saved = await persist(picker.selected)
          if (saved) setPicker(null)
        }

        if (state.status === 'loading') {
          return h('section', { style: styles.card }, h('p', { style: styles.hint }, t('fetching')))
        }
        if (state.status === 'error') {
          return h('section', { style: styles.card }, [
            h('h3', { key: 'title', style: styles.title }, t('title')),
            h('p', { key: 'error', style: styles.status('error'), role: 'alert' }, format('loadFailed', { message: state.error ?? '' })),
          ])
        }

        const modelSummary = state.models.length === 0
          ? t('modelsEmpty')
          : `${format('modelsCount', { count: state.models.length })}: ${state.models.slice(0, 5).join(', ')}${state.models.length > 5 ? ` ${format('modelsMore', { count: state.models.length - 5 })}` : ''}`

        const filtered = picker === null
          ? []
          : picker.models.filter(model => picker.query.trim().length === 0 || model.id.toLowerCase().includes(picker.query.trim().toLowerCase()))

        return h(React.Fragment, null, [
          h('section', { key: 'card', style: styles.card }, [
            h('div', { key: 'header', style: styles.header }, [
              h('img', {
                key: 'icon',
                src: '/plugins/@local/dsh-kourichat/assets/kourichat.png',
                alt: '',
                'aria-hidden': true,
                style: styles.icon,
              }),
              h('div', { key: 'text', style: styles.headerText }, [
                h('h3', { key: 'title', style: styles.title }, t('title')),
                h('p', { key: 'intro', style: styles.intro }, t('intro')),
              ]),
              h('span', { key: 'badge', style: styles.badge }, state.useResponses ? t('badge') : t('badgeCompletions')),
            ]),

            oldRoute
              ? h('p', { key: 'old', style: styles.warning }, t('oldRoute'))
              : null,

            h('div', { key: 'endpoint', style: styles.field }, [
              h('span', { key: 'label', style: styles.label }, t('endpoint')),
              h('select', {
                key: 'select',
                style: styles.select,
                value: endpointKind,
                onChange: event => chooseEndpoint(event.target.value),
              }, [
                h('option', { key: 'primary', value: 'primary' }, t('endpointPrimary')),
                h('option', { key: 'backup', value: 'backup' }, t('endpointBackup')),
                h('option', { key: 'custom', value: 'custom' }, t('endpointCustom')),
              ]),
              endpointKind === 'custom'
                ? h(Input, {
                  key: 'custom',
                  type: 'url',
                  value: customEndpoint,
                  placeholder: t('endpointPlaceholder'),
                  spellCheck: false,
                  autoComplete: 'off',
                  onChange: event => setCustomEndpoint(event.target.value),
                })
                : null,
              endpointKind === 'primary'
                ? h('p', {
                  key: 'hint',
                  style: styles.hint,
                }, format('endpointHint', { url: `${normalizeBaseURL(currentEndpoint)}${state.useResponses ? '/responses' : '/chat/completions'}` }))
                : null,
            ]),

            h('div', { key: 'responses', style: styles.switchRow }, [
              h(Switch, {
                key: 'switch',
                checked: state.useResponses,
                label: t('useResponses'),
                onChange: checked => setState(current => ({ ...current, useResponses: checked })),
              }),
              h('div', { key: 'text', style: styles.switchText }, [
                h('span', { key: 'label', style: styles.label }, t('useResponses')),
                h('p', { key: 'hint', style: styles.hint }, t('useResponsesHint')),
              ]),
            ]),

            h('div', { key: 'secret', style: styles.field }, [
              h('span', { key: 'label', style: styles.label }, t('apiKey')),
              h('div', { key: 'row', style: styles.secretRow }, [
                h('span', { key: 'dot', style: styles.secretDot(state.keyConfigured), 'aria-hidden': true }),
                h('div', { key: 'input', style: styles.grow }, h(Input, {
                  type: 'password',
                  value: keyDraft,
                  placeholder: state.keyConfigured ? t('apiKeyStored') : t('apiKeyPlaceholder'),
                  autoComplete: 'new-password',
                  spellCheck: false,
                  onChange: event => setKeyDraft(event.target.value),
                })),
              ]),
              h('p', { key: 'hint', style: styles.hint }, t('apiKeyHint')),
            ]),

            h('div', { key: 'ultra', style: styles.switchRow }, [
              h(Switch, {
                key: 'switch',
                checked: state.gptUltra,
                label: t('gptUltra'),
                onChange: checked => setState(current => ({ ...current, gptUltra: checked })),
              }),
              h('div', { key: 'text', style: styles.switchText }, [
                h('span', { key: 'label', style: styles.label }, t('gptUltra')),
                h('p', { key: 'hint', style: styles.hint }, t('gptUltraHint')),
              ]),
            ]),

            state.gptUltra
              ? h('div', { key: 'wire', style: styles.field }, [
                h('span', { key: 'label', style: styles.label }, t('ultraWire')),
                h('select', {
                  key: 'select',
                  style: styles.select,
                  value: state.ultraWire,
                  onChange: event => setState(current => ({ ...current, ultraWire: event.target.value })),
                }, [
                  h('option', { key: 'max', value: 'max' }, t('ultraWireMax')),
                  h('option', { key: 'xhigh', value: 'xhigh' }, t('ultraWireXhigh')),
                  h('option', { key: 'ultra', value: 'ultra' }, t('ultraWireUltra')),
                ]),
                h('p', { key: 'hint', style: styles.hint }, t('ultraWireHint')),
              ])
              : null,

            h('div', { key: 'models', style: styles.field }, [
              h('span', { key: 'label', style: styles.label }, t('models')),
              h('p', { key: 'summary', style: styles.modelText }, modelSummary),
            ]),

            h('div', { key: 'actions', style: styles.actions }, [
              h(Button, {
                key: 'fetch',
                variant: 'outline',
                disabled: busy !== null,
                onClick: () => void fetchModels(),
              }, busy === 'fetch' ? t('fetching') : t('fetchModels')),
              h(Button, {
                key: 'save',
                disabled: busy !== null,
                onClick: () => void persist(state.models),
              }, busy === 'save' ? t('saving') : t('save')),
            ]),

            notice === null
              ? null
              : h('p', {
                key: 'notice',
                style: styles.status(notice.tone),
                role: notice.tone === 'error' ? 'alert' : 'status',
              }, notice.text),
          ]),

          picker === null
            ? null
            : h(Modal, {
              key: 'picker',
              open: true,
              onClose: () => setPicker(null),
              title: t('pickerTitle'),
              description: format('pickerIntro', { count: picker.models.length, endpoint: normalizeBaseURL(currentEndpoint) }),
              closeLabel: t('close'),
              footer: h('div', { key: 'footer', style: styles.footer }, [
                h(Button, { key: 'cancel', variant: 'outline', onClick: () => setPicker(null) }, t('cancel')),
                h(Button, {
                  key: 'apply',
                  disabled: picker.selected.length === 0 || busy !== null,
                  onClick: () => void applyPicker(),
                }, format('applyModels', { count: picker.selected.length })),
              ]),
            }, h('div', { key: 'body', style: styles.pickerBody }, [
              h('div', { key: 'search', style: styles.searchRow }, h('div', { style: styles.grow }, h(Input, {
                type: 'search',
                style: { width: '100%' },
                value: picker.query,
                placeholder: t('pickerSearch'),
                'aria-label': t('pickerSearch'),
                onChange: event => setPicker(current => current === null ? current : ({ ...current, query: event.target.value })),
              }))),
              h('div', { key: 'actions', style: styles.pickerActions }, [
                h(Button, {
                  key: 'all',
                  variant: 'outline',
                  onClick: () => setPicker(current => current === null ? current : ({ ...current, selected: current.models.map(model => model.id) })),
                }, t('pickerSelectAll')),
                h(Button, {
                  key: 'clear',
                  variant: 'outline',
                  onClick: () => setPicker(current => current === null ? current : ({ ...current, selected: [] })),
                }, t('pickerClear')),
              ]),
              h('div', { key: 'list', style: styles.pickerList }, filtered.length === 0
                ? h('p', { key: 'empty', style: styles.hint }, t('pickerEmpty'))
                : filtered.map(model => h('div', { key: model.id, style: styles.pickerRow }, h(Checkbox, {
                  label: model.id,
                  checked: picker.selected.includes(model.id),
                  onChange: () => toggleModel(model.id),
                })))),
              h('span', { key: 'customLabel', style: styles.label }, t('customModel')),
              h('div', { key: 'custom', style: styles.customRow }, [
                h('div', { key: 'input', style: styles.grow }, h(Input, {
                  value: customModel,
                  placeholder: t('customModelPlaceholder'),
                  spellCheck: false,
                  autoComplete: 'off',
                  onChange: event => setCustomModel(event.target.value),
                  onKeyDown: event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustom()
                    }
                  },
                })),
                h(Button, { key: 'add', variant: 'outline', disabled: customModel.trim().length === 0, onClick: addCustom }, t('addCustom')),
              ]),
            ])),
        ])
      }

      ctx.slots.inject('settings.models.footer', () => ctx.slots.register({
        name: 'settings.models.footer',
        id: 'kourichat',
        order: 20,
      }, KouriCard))
    }

    return { inject, apply }
  },
})
