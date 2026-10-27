/**
 * 树数据内核 —— DTree / DTreeSelect / DCascader 共用的纯函数。
 *
 * 设计要点（对齐 Element Plus 的 el-tree 数据约定）：
 *   - props 可配 label / children / disabled / isLeaf / class 五个字段名，
 *     也支持函数式取值（EP 的 props 支持 string | Function）；
 *   - nodeKey 决定节点唯一标识，默认取 'id'，取不到时退化为节点在树中的路径；
 *   - 勾选联动（父子联动 / 半选）全部在这里算，组件只负责渲染。
 *
 * 纯 TS、零运行时依赖，可独立测试。
 */

/** 节点数据（业务侧传入的原始对象） */
export type TreeNodeData = Record<string, unknown>

/** props 配置：字段名可以是字符串，也可以是取值函数 */
export interface TreeProps {
  /** 标签字段名，默认 'label' */
  label?: string | ((data: TreeNodeData) => string)
  /** 子节点字段名，默认 'children' */
  children?: string | ((data: TreeNodeData) => boolean)
  /** 禁用字段名，默认 'disabled' */
  disabled?: string | ((data: TreeNodeData) => boolean)
  /** 是否叶子节点字段名，默认 'isLeaf' */
  isLeaf?: string | ((data: TreeNodeData) => boolean)
  /** 自定义类名字段名，默认 'class' */
  class?: string | ((data: TreeNodeData) => boolean)
}

/** 内部节点（带 key / parent / level / 派生状态） */
export interface TreeNode {
  /** 唯一 key */
  key: string | number
  /** 原始数据 */
  data: TreeNodeData
  /** 显示标签 */
  label: string
  /** 子节点（已建索引） */
  children: TreeNode[]
  /** 父节点（根为 null） */
  parent: TreeNode | null
  /** 层级（根为 0） */
  level: number
  /** 是否禁用 */
  disabled: boolean
  /** 是否叶子（显式 isLeaf 或无 children） */
  isLeaf: boolean
  /** 自定义类名 */
  className: string
}

/** 默认 props */
export const DEFAULT_TREE_PROPS: Required<
  Pick<TreeProps, 'label' | 'children' | 'disabled' | 'isLeaf' | 'class'>
> = {
  label: 'label',
  children: 'children',
  disabled: 'disabled',
  isLeaf: 'isLeaf',
  class: 'class'
}

/** 从字段名或函数里取值 */
function pick(data: TreeNodeData, field: string | ((d: TreeNodeData) => unknown) | undefined): unknown {
  if (typeof field === 'function') return field(data)
  if (!field) return undefined
  return data[field]
}

/**
 * 建树：把原始数据转成带 key/parent/level 的内部节点结构。
 *
 * @param data 原始数据数组
 * @param props 字段映射
 * @param nodeKey 唯一标识字段名；取不到值时退化为「路径索引」
 * @param parent 父节点（内部递归用）
 * @param level 层级（内部递归用）
 */
export function buildTree(
  data: TreeNodeData[],
  props: TreeProps = {},
  nodeKey = 'id',
  parent: TreeNode | null = null,
  level = 0
): TreeNode[] {
  const p = { ...DEFAULT_TREE_PROPS, ...props }
  const rawChildren = pick({ children: undefined }, p.children) // 占位，实际在下面按节点取
  void rawChildren
  return (data ?? []).map((item, idx) => {
    const childrenField = pick(item, p.children) as TreeNodeData[] | undefined
    const hasChildren = Array.isArray(childrenField) && childrenField.length > 0
    const explicitLeaf = pick(item, p.isLeaf)
    const labelValue = pick(item, p.label)
    const keyValue = item[nodeKey]

    // key 优先取 nodeKey 字段；取不到用「父路径-自身索引」保证唯一
    const key =
      keyValue !== undefined && keyValue !== null
        ? (keyValue as string | number)
        : parent
          ? `${parent.key}-${idx}`
          : String(idx)

    const node: TreeNode = {
      key,
      data: item,
      label: labelValue === undefined || labelValue === null ? String(key) : String(labelValue),
      children: [],
      parent,
      level,
      disabled: Boolean(pick(item, p.disabled)),
      isLeaf: explicitLeaf !== undefined ? Boolean(explicitLeaf) : !hasChildren,
      className: String(pick(item, p.class) ?? '')
    }

    if (hasChildren) {
      node.children = buildTree(childrenField, props, nodeKey, node, level + 1)
    }
    return node
  })
}

/** 深度优先遍历（先序） */
export function walkTree(nodes: TreeNode[], fn: (node: TreeNode, parent: TreeNode | null) => void) {
  for (const n of nodes) {
    fn(n, n.parent)
    if (n.children.length) walkTree(n.children, fn)
  }
}

/** 收集所有节点（扁平） */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = []
  walkTree(nodes, (n) => out.push(n))
  return out
}

/** 按 key 找节点 */
export function findNodeByKey(nodes: TreeNode[], key: string | number): TreeNode | undefined {
  return flattenTree(nodes).find((n) => n.key === key)
}

/** 按数据对象找节点（引用相等） */
export function findNodeByData(nodes: TreeNode[], data: TreeNodeData): TreeNode | undefined {
  return flattenTree(nodes).find((n) => n.data === data)
}

/** 取从根到该节点的祖先链（含自身） */
export function getNodePath(node: TreeNode): TreeNode[] {
  const path: TreeNode[] = []
  let cur: TreeNode | null = node
  while (cur) {
    path.unshift(cur)
    cur = cur.parent
  }
  return path
}

/** 节点是否为其祖先的后代 */
export function isDescendant(node: TreeNode, ancestor: TreeNode): boolean {
  let cur = node.parent
  while (cur) {
    if (cur === ancestor) return true
    cur = cur.parent
  }
  return false
}

/** 勾选状态集合 */
export interface CheckState {
  /** 完全勾选的 key */
  checked: Set<string | number>
  /** 半勾选（子有勾选但自身未全勾）的 key */
  halfChecked: Set<string | number>
}

/**
 * 计算某个节点的勾选状态（级联：子全勾 → 父全勾；子部分勾 → 父半勾）。
 *
 * @param node 目标节点
 * @param target 该节点自身是否勾选
 * @param strict check-strictly：true 时父子互不影响
 */
export function computeCheckState(
  node: TreeNode,
  target: boolean,
  strict: boolean
): CheckState {
  const checked = new Set<string | number>()
  const halfChecked = new Set<string | number>()
  if (strict) {
    if (target) checked.add(node.key)
    return { checked, halfChecked }
  }
  applyCheck(node, target, checked, halfChecked)
  return { checked, halfChecked }
}

/** 把勾选状态往子树扩散，并沿父链回传半勾 */
function applyCheck(
  node: TreeNode,
  target: boolean,
  checked: Set<string | number>,
  halfChecked: Set<string | number>
) {
  if (target) {
    checked.add(node.key)
    halfChecked.delete(node.key)
  } else {
    checked.delete(node.key)
    halfChecked.delete(node.key)
  }
  for (const child of node.children) {
    applyCheck(child, target, checked, halfChecked)
  }
  if (node.parent) {
    rollUp(node.parent, checked, halfChecked)
  }
}

/**
 * 父节点状态回传：
 *   子全勾 → 父全勾；子部分勾 → 父半勾；子全不勾 → 父不勾。
 */
function rollUp(
  parent: TreeNode | null,
  checked: Set<string | number>,
  halfChecked: Set<string | number>
) {
  if (!parent || !parent.children.length) return
  const allChecked = parent.children.every((c) => checked.has(c.key))
  const someChecked = parent.children.some((c) => checked.has(c.key) || halfChecked.has(c.key))
  if (allChecked) {
    checked.add(parent.key)
    halfChecked.delete(parent.key)
  } else if (someChecked) {
    checked.delete(parent.key)
    halfChecked.add(parent.key)
  } else {
    checked.delete(parent.key)
    halfChecked.delete(parent.key)
  }
  rollUp(parent.parent, checked, halfChecked)
}

/**
 * 一次性算出整棵树的勾选状态（给定已勾选的叶子/任意节点集合）。
 * 用于 defaultCheckedKeys / setCheckedKeys 初始化。
 */
export function resolveCheckedKeys(
  nodes: TreeNode[],
  keys: (string | number)[],
  strict: boolean
): CheckState {
  const checked = new Set<string | number>()
  const halfChecked = new Set<string | number>()
  if (strict) {
    for (const k of keys) checked.add(k)
    return { checked, halfChecked }
  }
  for (const k of keys) {
    const node = findNodeByKey(nodes, k)
    if (!node) continue
    applyCheck(node, true, checked, halfChecked)
  }
  return { checked, halfChecked }
}

/** 取勾选的叶子节点 */
export function getCheckedLeafNodes(nodes: TreeNode[], checked: Set<string | number>): TreeNode[] {
  return flattenTree(nodes).filter((n) => n.isLeaf && checked.has(n.key))
}

/**
 * 按关键词过滤树：命中节点的祖先链保留（用于树筛选）。
 * @param match 自定义匹配函数；默认按 label 包含
 */
export function filterTree(
  nodes: TreeNode[],
  keyword: string,
  match?: (node: TreeNode, keyword: string) => boolean
): TreeNode[] {
  if (!keyword) return nodes
  const out: TreeNode[] = []
  for (const n of nodes) {
    const hit = match ? match(n, keyword) : n.label.toLowerCase().includes(keyword.toLowerCase())
    const children = filterTree(n.children, keyword, match)
    if (hit || children.length) {
      // 过滤结果保留原节点的 key/label，但子节点只留命中的分支
      out.push({ ...n, children })
    }
  }
  return out
}

/** 收集所有父节点 key（用于自动展开父级） */
export function collectParentKeys(nodes: TreeNode[]): Set<string | number> {
  const set = new Set<string | number>()
  walkTree(nodes, (n) => {
    if (n.parent) set.add(n.parent.key)
  })
  return set
}

/** 展开从根到该 key 的所有祖先 */
export function expandPathTo(node: TreeNode, expanded: Set<string | number>) {
  let cur = node.parent
  while (cur) {
    expanded.add(cur.key)
    cur = cur.parent
  }
}
