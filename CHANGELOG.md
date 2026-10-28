# Changelog

## 0.2.0

组件数 **97 → 102**，新增 AI 组件族，并修掉两个实际使用中暴露的问题。

### 新增：AI 组件族（5 个）

此前组件库没有任何 AI 相关组件，而 AI 产品的界面难点恰恰集中在「流式 / 推理 / 模型切换 / 提示词」四件事上。

| 组件 | 作用 |
|---|---|
| `DChatMessage` | 对话气泡：`user` 右对齐主色底 / `assistant` 左对齐表面底 / `system` 居中窄条；带流式（光标）、错误（重试）、中断（停止生成）三态 |
| `DThinkingChain` | 推理过程折叠区：默认折叠显示摘要（如「已思考 3.2 秒」），点击展开每一步；**思考中强制展开**（用户在等结果，不该再点一次） |
| `DStreamText` | 流式文本渲染：`requestAnimationFrame` 驱动的打字机效果（帧率无关），`expose` 出 `stop()` / `skip()` 供外部打断或跳过 |
| `DPromptInput` | 提示词输入框：自动增高（到顶滚动）、token 计数（可传自定义计数函数）、长度上限拦截、Ctrl/⌘ + Enter 发送 |
| `DModelPicker` | 模型选择器：按厂商分组、标注能力标签与限制、↑↓ 移动 / Enter 选中 / Esc 关闭 |

### 新增：图标扩充 141 → 172

新增 **AI / 智能**、**数据 / 图表**、**编辑器 / 代码**、**反馈 / 状态** 四类。
扩展集独立成 `lib/icons-extended.ts`，合并时**同名不覆盖**（覆盖是图标库最隐蔽的 bug —— 名字还在，画出来却变了且不报错），冲突记入 `ICON_NAME_CONFLICTS` 供排查。

### 新增：内置色盘

`DColorPicker` 的 `predefine` 此前默认为空数组 —— 打开面板一片空白，只能靠拖色相条盲选。
现在内置 25 色预设（品牌 6 + 状态 4 + 中性 9 + 浅色 6），四组带中文名，悬停显示。
另加**系统取色器**（`input[type=color]`）作为自由选色入口 —— HEX 输入与色相条本就有。

### 修复：DSwitch 滑块停在轨道中间

位移写死 `translateX(22px)`，但轨道宽度随「有无文案 / sm 尺寸」变化（44 / 64 / 36 / 56px）：
无文案时位移超出轨道右缘 4px；**有文案时滑块停在轨道中间**。
改为 CSS 变量 + `calc(轨道宽 - 2×内边距 - 滑块宽)` 推导，四种尺寸组合全部自洽。

### 其它

- `exports` 补齐子路径：`./message` / `./messagebox` / `./notification` / `./directives/*` / `./components/*` / `./lib/*`
- 新增 `src/style.css` 源码模式样式入口
- 导出 `DmkColorPalettes` / `DmkDefaultPredefine` / `DmkIcons` / `DMK_ICON_NAMES`
- 新增 `scripts/verify-components.mjs` 组件逻辑守卫（33 项）

### 已知边界

- npm 包名是 **`dmk-ui-vue`**：npm 上的 `dmk-ui` 于 2022 年被他人占用（非本项目），故启用独立包名
- 源码仓库：https://github.com/DW-WJ/dmk-ui
- 在线文档：http://duanxm.online/factory/#/ui

---

## 0.1.0

- 首个正式版本：**97 个组件**，对标 Element Plus 全部 82 项
  （多出的 15 个为子组件：`DBreadcrumbItem`、`DTabPane`、`MessageItem`、`NotificationItem`、`TreeNodeItem`、`DSplitterPanel`、`DCarouselItem` 等）
- 语义令牌驱动：**5 风格 × 明暗 × 密度**正交矩阵
  - 风格：`aurora`（稳重商务）/ `neon`（高级质感）/ `flat`（简约扁平）/ `glass`（磨玻璃）/ `dense`（高密度）
  - 换肤换的不只是颜色，是「性格」：圆角 / 阴影 / 边框 / 密度 / 字重 / 动效曲线一起变
- 三层令牌架构：primitive（原始）→ semantic（语义）→ component（组件），组件只吃语义层
- 四态统一：空 / 加载 / 错误 / 边界
- 零运行时依赖（仅 `vue` peer）
- `app.use(DmkUI)` 全量安装，或按需 `import { DButton } from 'dmk-ui-vue'`

### 包名说明

包名为 **`dmk-ui-vue`**：npm 上的 `dmk-ui` 已被他人于 2022 年占用（非本项目），
为避免覆盖他人包，故启用独立包名。

### 已知边界

- ESM / CJS 双产物，`exports` 指向 `dist/index.js` / `dist/index.umd.cjs`，类型为 `dist/index.d.ts`
- 样式需单独引入：`import 'dmk-ui-vue/style.css'`
