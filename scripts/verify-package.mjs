/**
 * dmk-ui 发布前验证
 * ---------------------------------------------------------------------------
 * 信条：build 成功 ≠ 包能用。dmk-loading 踩过两次坑——
 *   ① dist 缺 .d.ts，消费方 import 报错；
 *   ② vite 子入口没构建，exports 指向 404。
 * 本脚本在 npm publish 前跑一遍，全绿才允许发布。
 *
 * 覆盖：
 *   ① exports 声明的每个文件都真实存在
 *   ② package.json 必填字段完整
 *   ③ 消费方实测：ESM import + CJS require 真跑一遍（真的挂载组件 + 用一个组件）
 *   ④ 类型可用性：临时 ts 文件 import 包，tsc --noEmit 必须过
 *   ⑤ tarball 体积与文件数合理
 *   ⑥ 组件数量下界（防「构建产物只出了一半」）
 *
 * 用法：node scripts/verify-package.mjs
 */
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const PKG_NAME = PKG.name

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

// ───────────────────────── ① exports 文件齐全 ─────────────────────────
console.log('\n📦 ① exports 文件存在性')
const exportFiles = []
for (const [key, val] of Object.entries(PKG.exports)) {
  const cond = typeof val === 'string' ? { types: val } : val
  for (const [kind, p] of Object.entries(cond)) {
    exportFiles.push([`${key} → ${kind}`, join(ROOT, p)])
  }
}
for (const [label, abs] of exportFiles) {
  ok(label, existsSync(abs), abs)
}

// ───────────────────────── ② package.json 字段 ─────────────────────────
console.log('\n📦 ② package.json 必填字段')
ok('name 已填', !!PKG.name)
ok('version 是合法 semver', /^\d+\.\d+\.\d+/.test(PKG.version), PKG.version)
ok('license 已填', !!PKG.license)
ok('description 已填（≥20 字）', (PKG.description ?? '').length >= 20)
ok('files 白名单含 dist/README/LICENSE', ['dist', 'README.md', 'LICENSE'].every((f) => PKG.files?.includes(f)))
ok('repository 指向 GitHub', PKG.repository?.url?.includes('github.com'), PKG.repository?.url)
ok('engines.node 已声明', !!PKG.engines?.node)
ok('sideEffects 含 css 声明', Array.isArray(PKG.sideEffects) && PKG.sideEffects.some((s) => s.includes('css')))
ok('peerDependencies.vue 已声明', !!PKG.peerDependencies?.vue)
ok('vue 为 peer（不进 dependencies）', !PKG.dependencies?.vue)

// ───────────────────────── ③ 消费方实测 ─────────────────────────
console.log('\n📦 ③ 消费方实测（ESM + CJS）')
const tmp = join(ROOT, '.tmp-verify')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

// ESM：真挂载插件 + 用一个组件
const esmProbe = `
import DmkUI, { DButton, DInput, Message } from '${PKG_NAME}'
import { createApp, h } from 'vue'
const keys = Object.keys(await import('${PKG_NAME}')).filter((k) => k !== 'default')
if (!keys.length) throw new Error('ESM 导出为空')
if (typeof DButton !== 'object' && typeof DButton !== 'function') throw new Error('DButton 导出异常')
if (typeof Message !== 'object' && typeof Message !== 'function') throw new Error('Message 导出异常')
// 真挂载到 Vue app：验证插件对象结构可用
const app = createApp({ render: () => h('div') })
app.use(DmkUI)
console.log('ESM_OK ' + keys.length)
`
writeFileSync(join(tmp, 'probe.mjs'), esmProbe)
try {
  const out = execSync(`node ${JSON.stringify(join(tmp, 'probe.mjs'))}`, { cwd: tmp, encoding: 'utf8', stdio: 'pipe' })
  ok('ESM import + app.use 可用', out.includes('ESM_OK'), out.trim().slice(0, 140))
} catch (e) {
  ok('ESM import + app.use 可用', false, (e.stderr?.toString() || e.message).slice(0, 260))
}

// CJS
const cjsProbe = `
const pkg = require('${PKG_NAME}')
const keys = Object.keys(pkg).filter((k) => k !== 'default' && k !== '__esModule')
if (!keys.length) throw new Error('CJS 导出为空')
if (!pkg.DButton) throw new Error('CJS DButton 缺失')
console.log('CJS_OK ' + keys.length)
`
writeFileSync(join(tmp, 'probe.cjs'), cjsProbe)
try {
  const out = execSync(`node ${JSON.stringify(join(tmp, 'probe.cjs'))}`, { cwd: tmp, encoding: 'utf8', stdio: 'pipe' })
  ok('CJS require 可用', out.includes('CJS_OK'), out.trim().slice(0, 140))
} catch (e) {
  ok('CJS require 可用', false, (e.stderr?.toString() || e.message).slice(0, 260))
}

// ───────────────────────── ④ 类型可用性 ─────────────────────────
console.log('\n📦 ④ 类型可用性')
const tsProbe = `
import DmkUI, { DButton, DInput } from '${PKG_NAME}'
export const probe: typeof DmkUI = DmkUI
export const btn: typeof DButton = DButton
export const inp: typeof DInput = DInput
`
writeFileSync(join(tmp, 'probe.ts'), tsProbe)
writeFileSync(
  join(tmp, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        types: []
      },
      include: ['probe.ts']
    },
    null,
    2
  )
)
try {
  execSync(`node ${JSON.stringify(join(ROOT, 'node_modules/typescript/bin/tsc'))} -p tsconfig.json`, {
    cwd: tmp,
    encoding: 'utf8',
    stdio: 'pipe'
  })
  ok('消费方类型检查通过（tsc --noEmit）', true)
} catch (e) {
  ok('消费方类型检查通过（tsc --noEmit）', false, (e.stdout?.toString() || e.stderr?.toString() || e.message).slice(0, 320))
}

// ───────────────────────── ⑤ tarball 体积 ─────────────────────────
console.log('\n📦 ⑤ tarball 体积')
try {
  const out = execSync(`npm pack --dry-run --json`, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' })
  const info = JSON.parse(out)[0]
  const kb = info.size / 1024
  ok(`tarball 体积合理（${kb.toFixed(1)} KB）`, kb < 900, `${kb.toFixed(1)} KB`)
  ok(`文件数合理（${info.entryCount} 个）`, info.entryCount > 100 && info.entryCount < 400, `${info.entryCount} 个`)
  const hasDts = info.files.some((f) => f.path.endsWith('.d.ts'))
  ok('tarball 含 .d.ts 类型文件', hasDts)
  const hasCss = info.files.some((f) => f.path.endsWith('style.css'))
  ok('tarball 含样式文件', hasCss)
} catch (e) {
  ok('npm pack --dry-run 可执行', false, (e.stderr?.toString() || e.message).slice(0, 200))
}

// ───────────────────────── ⑥ 组件数量下界 ─────────────────────────
console.log('\n📦 ⑥ 组件数量下界')
const dtsFiles = execSync(`find dist -name "*.vue.d.ts" | wc -l`, { cwd: ROOT, encoding: 'utf8' }).trim()
ok(`组件声明文件 ≥ 90 个（实 ${dtsFiles}）`, Number(dtsFiles) >= 90, `${dtsFiles} 个`)

rmSync(tmp, { recursive: true, force: true })

// ───────────────────────── 汇总 ─────────────────────────
console.log('\n──────────────────────────────────────────────')
console.log(`${pass} 通过 / ${failures.length} 失败`)
console.log('──────────────────────────────────────────────')
if (failures.length) {
  failures.forEach((f) => console.log(`  · ${f.name}${f.detail ? ` —— ${f.detail}` : ''}`))
  process.exit(1)
}
console.log(`✅ ${PKG_NAME} 可发布`)
