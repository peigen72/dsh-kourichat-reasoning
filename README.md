# KouriChat Reasoning (DSH Plugin)

Connect the [KouriChat](https://api.kourichat.com) relay to the **Settings → Models** page of DeepSeek Harness. Once connected, GPT / Claude / DeepSeek / Gemini models get the same native reasoning-level menu as a DeepSeek account, directly in the composer. No hand-written `reasoningEfforts` in the configuration file.

## Features

- **One-step setup on the Models page**: a KouriChat card (with the KouriChat icon) appears at the bottom of **Settings → Models**, prefilled with the official endpoint. Switch between primary, backup, or a custom endpoint.
- **Fetch the model list**: pull the models available to the current account from `GET {baseURL}/models`, select them, and save them to the plugin configuration. You can also add any custom model ID manually (for example `gpt-5.7-preview`).
- **Native reasoning levels**: the model menu shows the raw model ID (for example `gpt-6-astra-codex`), with the real ladder: Off / Low / Medium / High / Xhigh / Max. GPT-5.6 / GPT-6 / 6.1 additionally expose **Ultra** when “GPT reasoning compatibility” is on, and Ultra becomes the default level; turning it off restores the standard ladder.
- **Two endpoints**:
  - Default: the ordinary `/v1` endpoint (`/v1/chat/completions`).
  - Optional: the OpenAI Responses reasoning endpoint (`/v1/responses`).
  - A pasted address ending in `/responses` or `/chat/completions` is normalized back to `/v1`.
- **Key safety**: the API key is written to the DSH credential store (default reference `KOURICHAT_API_KEY`), never to `cordis.patch.yml`.
- **Old-route hint**: if the profile still contains the older `kouri` route, the card tells you to prefer the “KouriChat 推理” model group; the old route has no reasoning levels.

## What Ultra sends

KouriChat’s Responses endpoint currently accepts only `none / minimal / low / medium / high / xhigh / max`; it does not accept the literal `ultra`. The Ultra level therefore maps to `max` by default (recommended). The card’s “Ultra wire value” can be changed to `xhigh`, or to the experimental `ultra` (the upstream may reject it; success is not guaranteed). This reflects the reality that Ultra is the top level, but the upstream protocol does not necessarily expose a parameter with that name.

## Compatibility with dsh-effort-slider

The third-party slider **[dsh-effort-slider](https://github.com/yuhub233/dsh-effort-slider)** (author **yuhub233**) appends its own **Ultra** stop after the model’s real levels. For GPT / Claude — and any model that already has a native Ultra — this creates a duplicate Ultra and an unlabeled “air” stop.

This plugin handles that with two layers:

1. **Minimal slider-side patch (recommended)**: a small compatibility patch for the installed `dsh-effort-slider/lib/client.js`. It changes `levelsOf(efforts, modelId)` so the synthetic Ultra is not appended when the model is GPT/Claude or already has a native Ultra. The slider’s level count then matches the native ladder exactly, with no air stop.
   - Backup: `lib/client.js.kourichat-backup` beside the patched file.
   - Reusable patch: `patches/dsh-effort-slider.patch` in this plugin.
   - A slider upgrade overwrites the patch; re-apply `patches/dsh-effort-slider.patch` or restore the backup.
2. **CSS fallback in this plugin**: even if the patch is not applied, this plugin hides the slider’s appended Ultra label and readout denominator for GPT/Claude models. In that case the far-right end of the slider still has an invisible empty stop, but there is no second Ultra label.

If `dsh-effort-slider` is not installed, neither layer performs any DOM operation or raises an error.

Slider author and repository: **yuhub233** · <https://github.com/yuhub233/dsh-effort-slider>

## Installation

Requires DSH `0.2.2-rc.1` or a version with similar interfaces. The plugin reuses the public interfaces of `@deepseek-ai/dsh-llm-pi-ai` and `@earendil-works/pi-ai`; no `npm install` and no build step are needed.

```powershell
# 1. Copy/clone the plugin folder to any local directory
git clone https://github.com/<your-username>/dsh-kourichat-reasoning.git D:\Plugins\dsh-kourichat-reasoning

# 2. Install that directory in DSH
#    (equivalent to Settings → Plugins → Install from local directory)
plugin_manager install_bundle target=D:\Plugins\dsh-kourichat-reasoning
```

You can also select the directory directly in DSH’s plugin manager. **`package.json` must be at the root of the installed directory.**

If the card does not appear on the Models page immediately after installation, restart DeepSeek Harness once (the Web client module graph is rescanned at startup).

> Updating: run `git pull` and restart DSH. Plugin settings and the API key live in the profile / credential store and are not lost on update.

## Usage

1. Open **Settings → Models** and scroll to the **KouriChat** card.
2. Keep the endpoint on “KouriChat primary”, or switch to backup / custom.
3. Enter the API key. If one is already stored, the placeholder reads “Saved (leave blank to keep it)”.
4. Choose whether to enable the **OpenAI Responses endpoint** (off by default, using the ordinary `/v1` endpoint).
5. Click **Fetch models**, select models (search, select all, clear, or add a custom ID manually), and save.
6. Return to the composer, open the model menu, choose a model under “KouriChat 推理”, then choose a reasoning level in the Effort submenu.

## Configuration

The plugin row id is `kourichat`; every field is volatile and can be written from the Models card:

```yaml
- id: kourichat
  name: '@local/dsh-kourichat'
  config:
    baseURL: https://api.kourichat.com/v1
    apiKeyEnv: KOURICHAT_API_KEY
    displayName: KouriChat 推理   # default Chinese display name
    useResponses: false          # default: ordinary /v1 endpoint
    gptUltra: true               # Ultra level for GPT-5.6/6/6.1
    ultraWire: max               # Ultra wire value: max | xhigh | ultra
    models:
      - claude-sonnet-5
      - gpt-5.6-terra
```

## Known limitations

- The model list and capabilities come from KouriChat’s `/models` and built-in family inference. The plugin does not guarantee that every model is actually usable, nor that the upstream accepts a particular reasoning level.
- Model input is currently declared as text-only; image/vision input is outside this plugin’s scope.
- The “multiple sub-agents” semantics of Ultra are up to the upstream. This plugin only maps the top level to a value the upstream accepts.

## License

MIT. `patches/dsh-effort-slider.patch` contains only the small context lines needed for compatibility; the corresponding work [dsh-effort-slider](https://github.com/yuhub233/dsh-effort-slider) is copyright **yuhub233**.

## Disclaimer

This is a third-party community plugin. It is not affiliated with or endorsed by KouriChat or DeepSeek. The relay’s terms of service, billing, and model availability are decided by the service provider; the plugin only handles client-side connection and reasoning-level mapping.
