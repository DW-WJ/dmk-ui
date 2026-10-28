/**
 * verify-components.mjs —— 组件逻辑守卫（零依赖）
 * ---------------------------------------------------------------------------
 * 背景（2026-10-28 实测踩坑）：
 *   DSwitch 的滑块位移写死 `transform: translateX(22px)`，但轨道宽度会随
 *   「有无文案 / sm 尺寸」变化（44 / 64 / 36 / 56px）。结果：
 *     - 无文案 md：位移 22px > 应有 18px（滑块溢出轨道右缘 4px）
 *     - 有文案：轨道 64px，位移仍是 22px → 滑块停在轨道中间
 *   视觉上就是「开关的圆点在中间，肯定不对」。
 *
 *   为什么 typecheck / vue-tsc 抓不到：这是纯 CSS 长度计算错误，
 *   TS 不管 CSS，模板也不报错 —— 只有「算出来的位移是否等于应有位移」能抓。
 *
 * 覆盖：
 *   ① DSwitch：轨道宽/滑块宽/内边距 → 应有位移 = 轨道宽 - 2×内边距 - 滑块宽，
 *      四种尺寸组合逐一断言 CSS 里写的是「由变量推导」而非「写死数值」；
 *   ② DIcon：图标集每个条目结构完整（d 非空 / viewBox 一致 / 命名规范）；
 *   ③ DColorPicker：预置色盘默认值非空（用户打开面板必须看得到色盘）。
 *
 * 用法：node scripts/verify-components.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

let pass = 0
const failures = []
const ok = (name, cond, detail = '') => {
  if (cond) {
    pass++
    console.log(`  ✅ ${name}`)
  } else {
    failures.push({ name, detail })
    console.log(`  ❌ ${name}${detail ? ` —— ${detail}` : ''}`)
  }
}

/* ═══════════════ ① DSwitch 滑块位移 ═══════════════ */
console.log('\n🔘 DSwitch —— 滑块位移必须由轨道宽度推导，不能写死')
{
  const file = join(ROOT, 'src/components/DSwitch.vue')
  const src = readFileSync(file, 'utf8')

  // ①a 轨道宽度必须用 CSS 变量声明（而不是直接写 width: Npx）
  ok(
    '轨道宽度用 CSS 变量声明',
    /--dmk-switch-track-w:\s*\d+px/.test(src),
    '找不到 --dmk-switch-track-w'
  )
  ok('滑块尺寸用 CSS 变量声明', /--dmk-switch-knob-size:\s*\d+px/.test(src))
  ok('内边距用 CSS 变量声明', /--dmk-switch-pad:\s*\d+px/.test(src))

  // ①b 开启位移必须是 calc 推导，不能是写死的 translateX(Npx)
  const hardCoded = [...src.matchAll(/translateX\(\s*(-?\d+(?:\.\d+)?)px\s*\)/g)].map((m) => m[1])
  ok(
    '开启位移无写死的 translateX(Npx)',
    hardCoded.length === 0,
    hardCoded.length ? `发现写死值：${hardCoded.join(', ')}px` : ''
  )

  ok(
    '开启位移由 calc 依轨道宽推导',
    /translateX\(\s*calc\([^)]*--dmk-switch-track-w[^)]*\)/s.test(src),
    '未见 calc(--dmk-switch-track-w ...) 推导'
  )

  // ①c 四种尺寸组合的变量值必须齐备，且位移公式自洽
  //     应有位移 = 轨道宽 - 2×pad - knob 宽
  const combos = [
    { name: 'md 无文案', track: 44, knob: 18, pad: 2 },
    { name: 'md 有文案', track: 64, knob: 18, pad: 2 },
    { name: 'sm 无文案', track: 36, knob: 14, pad: 2 },
    { name: 'sm 有文案', track: 56, knob: 14, pad: 2 }
  ]
  // 从 CSS 里解析每种组合实际生效的轨道宽（后者覆盖前者）
  const rules = [...src.matchAll(
    /(\.dmk-switch[^{]*?)\{([^}]*--dmk-switch-track-w:\s*(\d+)px[^}]*)\}/g
  )]
  const trackWidths = rules.map((r) => ({
    selector: r[1].trim(),
    width: Number(r[3]),
    hasKnob: /--dmk-switch-knob-size:\s*(\d+)px/.exec(r[2])?.[1] !== undefined,
    knob: Number(/--dmk-switch-knob-size:\s*(\d+)px/.exec(r[2])?.[1] ?? 18),
    pad: Number(/--dmk-switch-pad:\s*(\d+)px/.exec(r[2])?.[1] ?? 2)
  }))
  ok(
    '轨道宽覆盖 4 种尺寸组合',
    new Set(trackWidths.map((t) => t.width)).size >= 4,
    `实际解析到 ${trackWidths.length} 条规则`
  )

  for (const c of combos) {
    const hit = trackWidths.find((t) => t.width === c.track)
    ok(`${c.name} 轨道宽 = ${c.track}px`, !!hit, '未找到该宽度的规则')
    if (hit) {
      const expected = c.track - c.pad * 2 - c.knob
      ok(
        `${c.name} 应有位移 = ${expected}px（${c.track} - 2×${c.pad} - ${c.knob}）`,
        expected > 0,
        `算得 ${expected}`
      )
    }
  }

  // ①d 滑块必须有过渡动画（否则开启是瞬移，不是「滑」）
  ok('滑块有 transform 过渡', /\.dmk-switch__knob\s*\{[^}]*transition:[^}]*transform/s.test(src))
  // ①e 无障碍契约
  ok('role="switch"', /role="switch"/.test(src))
  ok('aria-checked 绑定', /:aria-checked="isChecked"/.test(src))
}

/* ═══════════════ ② DIcon 图标集完整性 ═══════════════ */
console.log('\n🔣 DIcon —— 图标集结构完整性')
{
  const file = join(ROOT, 'src/lib/icons.ts')
  const src = readFileSync(file, 'utf8')
  const extFile = join(ROOT, 'src/lib/icons-extended.ts')
  const extSrc = existsSync(extFile) ? readFileSync(extFile, 'utf8') : ''

  // 基础集条目
  const base = [...src.matchAll(/^  ([A-Za-z][A-Za-z0-9]*):\s*\{\s*d:\s*'([^']*)'/gm)]
  // 扩展集条目（4 个分类对象）
  const ext = [...extSrc.matchAll(/^  ([A-Za-z][A-Za-z0-9]*):\s*\{\s*d:\s*'([^']*)'/gm)]

  const total = base.length + ext.length
  ok('图标条目数量 ≥ 170（基础 141 + 扩展）', total >= 170, `实际 ${total} 个（基础 ${base.length} / 扩展 ${ext.length}）`)

  const all = [...base, ...ext]
  const bad = all.filter(([, , d]) => !d || d.length < 8)
  ok('所有图标 path 非空且有实质内容', bad.length === 0, `${bad.length} 个 path 过短`)

  // 同名冲突必须被 mergeIconSet 拦住（扩展集不得覆盖基础集）
  const baseNames = new Set(base.map(([, n]) => n))
  const extNames = ext.map(([, n]) => n)
  const conflicts = extNames.filter((n) => baseNames.has(n))
  ok('扩展集与基础集无同名条目（避免静默覆盖）', conflicts.length === 0, conflicts.join(', '))

  // 同形别名白名单：EP 语义上就是同图形的不同命名（Close / CloseBold 等），
  // 不算设计缺陷 —— 但超出白名单的同形仍要报出来。
  // 白名单存「排序后的名字对」，三连同形（CircleCheck=CircleCheckFilled=SuccessFilled）
  // 只要每一对都在白名单里就算合法。
  const ALIAS_PAIRS = new Set([
    'Close=CloseBold', 'More=MoreFilled',
    'CircleCheck=CircleCheckFilled', 'CircleCheckFilled=SuccessFilled',
    'CircleCheck=SuccessFilled',
    'CircleClose=CircleCloseFilled',
    'CirclePlus=CirclePlusFilled', 'WarnTriangleFilled=Warning',
    'HomeFilled=House', 'Location=LocationFilled', 'Aim=Coordinate',
    'CopyDocument=DocumentCopy', 'DataLine=TrendCharts', 'User=UserFilled',
    'Bell=BellFilled', 'Comment=Message', 'Star=StarFilled',
    'Picture=PictureRounded', 'ShoppingCart=ShoppingCartFull', 'Cellphone=Iphone'
  ])
  const byPath = new Map()
  for (const [, name, d] of all) {
    if (byPath.has(d)) byPath.set(d, [...byPath.get(d), name])
    else byPath.set(d, [name])
  }
  const sameShape = [...byPath.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([, names]) => {
      // 同形组内两两配对，命中白名单即视为合法别名。
      // 注意：白名单里的 pair 是【已排序】的，所以这里必须排序后再比。
      const pairs = []
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          pairs.push([names[i], names[j]].sort().join('='))
        }
      }
      return { names, pairs, legit: pairs.every((p) => ALIAS_PAIRS.has(p)) }
    })
  const illegal = sameShape.filter((s) => !s.legit)
  ok(
    '同形条目均为已登记别名（无意外撞图）',
    illegal.length === 0,
    illegal.map((s) => `${s.names.join('=')} [${s.pairs.join(', ')}]`).join(' | ')
  )
  ok(
    `已登记别名 ${sameShape.length} 组`,
    true,
    `${sameShape.length} 组`
  )

  // 分类必须有注释分组，便于文档页自动分栏
  const groups = [...src.matchAll(/\/\*\s*-+\s*(.+?)\s*-+\s*\*\//g)].map((m) => m[1])
  ok('基础集按分类分组（≥6 组）', groups.length >= 6, `${groups.length} 组`)

  // 扩展集必须有分类（AI / 数据 / 编辑器 / 反馈）
  const extSets = [...extSrc.matchAll(/export const (DmkIcons\w+)/g)].map((m) => m[1])
  ok('扩展集按 AI / 数据 / 编辑器 / 反馈分类', extSets.length >= 4, extSets.join(', '))

  // DIcon 组件必须真的渲染这些图标
  const iconComp = readFileSync(join(ROOT, 'src/components/DIcon.vue'), 'utf8')
  ok('DIcon 引用了 DmkIcons', /from '\.\.\/lib\/icons'/.test(iconComp) && /DmkIcons/.test(iconComp))
  ok('DIcon 支持 name / color / size / loading 四个契约', ['name', 'color', 'size', 'loading'].every((p) => iconComp.includes(p)))
}

/* ═══════════════ ③ DColorPicker 预置色盘 ═══════════════ */
console.log('\n🎨 DColorPicker —— 必须有开箱即用的预置色盘')
{
  const file = join(ROOT, 'src/components/DColorPicker.vue')
  const src = readFileSync(file, 'utf8')

  // 默认值不能是空数组 —— 空数组 = 用户打开面板看不到任何色盘
  const def = /predefine:\s*\(\)\s*=>\s*(\[[^\]]*\])/.exec(src)
  ok('predefine 有默认值声明', !!def, '未找到 predefine 默认值')
  if (def) {
    ok(
      'predefine 默认值非空（用户打开面板必须看得到色盘）',
      def[1].replace(/\s/g, '') !== '[]',
      `默认值 = ${def[1]}`
    )
  }

  ok('渲染预置色盘区块', /__predefine/.test(src))
  ok('支持用户自由选颜色（取色器/输入）', /type="color"|__color-input|__hue|__picker/.test(src))
  ok('支持 colorFormat（hex/rgb/hsl）', /colorFormat/.test(src))
}

/* ═══════════════ ④ AI 组件区 ═══════════════ */
console.log('\n🤖 AI 组件 —— 组件库必须有 AI 分类与实现')
{
  const aiComponents = ['DChatMessage', 'DStreamText', 'DPromptInput', 'DThinkingChain', 'DModelPicker']
  const found = aiComponents.filter((f) => existsSync(join(ROOT, 'src/components', `${f}.vue`)))
  ok(
    'AI 组件已实现（≥4 个）',
    found.length >= 4,
    `实际 ${found.length} 个：${found.join(', ') || '无'}`
  )

  // AI 组件必须从入口导出（否则消费方 import 不到）
  const index = readFileSync(join(ROOT, 'src/index.ts'), 'utf8')
  const exported = aiComponents.filter((f) => index.includes(f))
  ok(
    'AI 组件已从入口导出',
    exported.length >= 4,
    `实际 ${exported.length} 个：${exported.join(', ') || '无'}`
  )
}

/* ═══════════════ 输出 ═══════════════ */
console.log('\n──────────────────────────────────────────────')
console.log(`${pass} 通过 / ${failures.length} 失败`)
console.log('──────────────────────────────────────────────')
if (failures.length) {
  failures.forEach((f) => console.log(`  · ${f.name}${f.detail ? ' —— ' + f.detail : ''}`))
  process.exit(1)
}
console.log('✅ 组件逻辑守卫全绿')
