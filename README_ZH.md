# KouriChat 推理等级（DSH 插件）

把 [KouriChat](https://api.kourichat.com) 中转站接进 DeepSeek Harness 的「设置 → 模型」页。接入后，GPT / Claude / DeepSeek / Gemini 等模型会像原生 DeepSeek 账号一样，在对话输入框的模型菜单里直接选择推理等级；不需要在配置文件里手写 `reasoningEfforts`。

## 功能

- **模型页一键接入**：在「设置 → 模型」底部出现 KouriChat 卡片（带 KouriChat 图标），预填官方端点，可切换主站 / 备用站 / 自定义端点。
- **获取模型列表**：从 `GET {baseURL}/models` 拉取当前账号可用的模型，勾选后写入插件配置；也可以手动添加任意自定义模型 ID（例如 `gpt-5.7-preview`）。
- **原生推理等级**：模型菜单显示原始模型 ID（如 `gpt-6-astra-codex`），元数据带真实档位：Off / Low / Medium / High / Xhigh / Max。GPT-5.6 / GPT-6 / 6.1 在「GPT 推理等级兼容」开启时额外显示 **Ultra**，并作为默认档；关闭后恢复标准档位。
- **两种端点**：
  - 默认：`/v1` 普通端点（`/v1/chat/completions`）。
  - 可选：OpenAI Responses 推理端点（`/v1/responses`）。
  - 粘贴以 `/responses` 或 `/chat/completions` 结尾的地址会自动归一化到 `/v1`。
- **密钥安全**：API Key 写入 DSH 凭据库（默认引用 `KOURICHAT_API_KEY`），不写入 `cordis.patch.yml`。
- **旧路由提示**：如果 profile 里还留着旧版 `kouri` 路由，卡片会提示优先选择「KouriChat 推理」模型组；旧路由没有推理等级。

## Ultra 的发送值

KouriChat 的 Responses 接口当前只接受 `none / minimal / low / medium / high / xhigh / max`，不接受字面量 `ultra`。因此 Ultra 档默认映射为 `max`（推荐）。卡片里的「Ultra 发送值」可以改成 `xhigh`，或改成实验性的 `ultra`（上游可能拒绝，插件不保证成功）。这符合“Ultra 是最高档，但上游协议不一定暴露同名参数”的现实。

## 与 dsh-effort-slider 的兼容

第三方滑条 **[dsh-effort-slider](https://github.com/yuhub233/dsh-effort-slider)**（作者 **yuhub233**）会在模型真实档位之后追加一个自己的 **Ultra** 档。对 GPT / Claude（以及任何已经有原生 Ultra 的模型）来说，这会产生重复 Ultra，并留下一个没有标签的“空气档位”。

本插件用两层兼容处理这个问题：

1. **滑条侧最小补丁**（推荐）：对已安装的 `dsh-effort-slider/lib/client.js` 打一个很小的兼容补丁，让 `levelsOf(efforts, modelId)` 在模型为 GPT/Claude 或已存在原生 Ultra 时不再追加合成 Ultra。这样滑条的档位数与原生档位完全一致，不会出现空气档位。
   - 备份：同目录 `lib/client.js.kourichat-backup`。
   - 可复用补丁：本插件 `patches/dsh-effort-slider.patch`。
   - 滑条升级后会覆盖补丁；重新应用 `patches/dsh-effort-slider.patch` 即可，或用备份恢复。
2. **本插件 CSS 兜底**：即使补丁没有生效，本插件也会在 GPT/Claude 模型下隐藏滑条追加的 Ultra 标签与读数分母；此时滑条最右端仍有一个不可见的空档，但不会出现第二个 Ultra 标签。

没有安装 `dsh-effort-slider` 时，两层兼容都不会产生任何 DOM 操作或错误。

滑条作者与仓库：**yuhub233** · <https://github.com/yuhub233/dsh-effort-slider>

## 安装

在 DSH 的插件管理里安装本目录，或：

```text
plugin_manager install_bundle target=D:\peigen\workspace1\kourichat-reasoning
```

安装后如果模型页没有立即出现卡片，重启一次 DeepSeek Harness（Web 客户端模块图会在启动时重新扫描）。

## 使用

1. 打开「设置 → 模型」，滚到底部的 **KouriChat** 卡片。
2. API 端点保持「KouriChat 主站」，或切换到备用 / 自定义。
3. 填入 API Key；如果已经保存过会显示「已保存（留空保持不变）」。
4. 选择是否启用 **OpenAI Responses 端点**（默认关闭，使用 `/v1` 普通端点）。
5. 点「获取模型列表」，勾选模型（可搜索、全选、清空、手动添加自定义 ID），保存。
6. 回到对话输入框，打开模型菜单，选择「KouriChat 推理」下的模型；在 Effort 子菜单里选择推理等级。

## 配置文件

插件行 id 是 `kourichat`，字段都是 volatile，可从模型页卡片写入：

```yaml
- id: kourichat
  name: '@local/dsh-kourichat'
  config:
    baseURL: https://api.kourichat.com/v1
    apiKeyEnv: KOURICHAT_API_KEY
    displayName: KouriChat 推理
    useResponses: false      # 默认 /v1 普通端点
    gptUltra: true           # GPT-5.6/6/6.1 的 Ultra 档
    ultraWire: max           # Ultra 实际发送值：max | xhigh | ultra
    models:
      - claude-sonnet-5
      - gpt-5.6-terra
```

## 已知限制

- 模型列表与能力来自 KouriChat 的 `/models` 和内置家族推断；插件不保证每个模型都实际可用，也不保证上游接受某个推理档位。
- 目前模型输入声明为纯文本；图片/视觉输入不在本插件范围内。
- Ultra 的“多子代理”语义由上游决定；本插件只负责把最高档位映射到上游接受的值。
