/**
 * 极简 ESM resolve 钩子 —— 让 Node 能直接跑 src/ 下的 .ts 源码
 * ---------------------------------------------------------------------------
 * 为什么需要它：
 *   src/lib/*.ts 之间是「无扩展名相对导入」（`from './icons-extended'`），
 *   这是 Vite / tsconfig bundler 模式的写法，但 Node 原生 ESM 不做扩展名补全，
 *   直接跑会 ERR_MODULE_NOT_FOUND。这个钩子只做一件事：
 *   把无扩展名的相对说明符按 .ts → .mts → .js → .mjs 顺序补全。
 *
 * 依赖：零。Node ≥ 20.6（module.register）+ ≥ 22.6（类型剥离）。
 */

import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** 补全顺序：源码优先，产物兜底 */
const EXTS = ['.ts', '.mts', '.js', '.mjs']

export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../')
  if (!isRelative || path.extname(specifier)) {
    return nextResolve(specifier, context)
  }

  const base = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : process.cwd()
  for (const ext of EXTS) {
    const candidate = path.resolve(base, specifier + ext)
    if (existsSync(candidate)) {
      return nextResolve(pathToFileURL(candidate).href, context)
    }
  }

  // 找不到就交回默认逻辑，让 Node 报它自己的错（比静默失败好排查）
  return nextResolve(specifier, context)
}
