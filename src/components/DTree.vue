<script setup lang="ts">
/**
 * DTree —— 树。
 * 契约参考 Element Plus el-tree（18 props / 16 exposes / 11 events）：
 *   核心：data / nodeKey / props / showCheckbox / checkStrictly /
 *         defaultExpandAll / defaultExpandedKeys / currentNodeKey / accordion /
 *         highlightCurrent / expandOnClickNode / checkOnClickNode / lazy+load /
 *         filterNodeMethod / indent / emptyText / renderContent
 *   扩展：多选（multiple）—— EP 没有，这里按业务高频补上，语义与 show-checkbox 一致。
 *
 * 实现要点：
 *   - 树数据内核在 lib/tree.ts（纯函数），组件只管渲染与交互；
 *   - 节点用递归组件渲染（TreeNodeItem 子组件），支持懒加载；
 *   - 展开状态用 Set<key>，勾选状态由内核 computeCheckState 派生；
 *   - 键盘可达：节点可聚焦，↑↓ 移动、←→ 折叠展开、Space 勾选。
 */
import { computed, ref, watch } from 'vue'
import {
  buildTree,
  computeCheckState,
  expandPathTo,
  filterTree,
  findNodeByData,
  findNodeByKey,
  flattenTree,
  getCheckedLeafNodes,
  resolveCheckedKeys,
  walkTree,
  type TreeNode,
  type TreeNodeData,
  type TreeProps
} from '../lib/tree'
import TreeNodeItem from './TreeNodeItem.vue'

const props = withDefaults(
  defineProps<{
    data?: TreeNodeData[]
    nodeKey?: string
    props?: TreeProps
    emptyText?: string
    showCheckbox?: boolean
    checkStrictly?: boolean
    defaultExpandAll?: boolean
    defaultExpandedKeys?: (string | number)[]
    defaultCheckedKeys?: (string | number)[]
    currentNodeKey?: string | number
    highlightCurrent?: boolean
    expandOnClickNode?: boolean
    checkOnClickNode?: boolean
    checkOnClickLeaf?: boolean
    autoExpandParent?: boolean
    accordion?: boolean
    indent?: number
    icon?: string
    lazy?: boolean
    load?: (node: TreeNode, resolve: (data: TreeNodeData[]) => void) => void
    draggable?: boolean
    filterNodeMethod?: (node: TreeNode, keyword: string) => boolean
    /** 多选：点击节点即选中（可多选） */
    multiple?: boolean
    /** 筛选关键词（受控） */
    filterText?: string
  }>(),
  {
    data: () => [],
    nodeKey: 'id',
    props: () => ({}),
    emptyText: '暂无数据',
    showCheckbox: false,
    checkStrictly: false,
    defaultExpandAll: false,
    defaultExpandedKeys: () => [],
    defaultCheckedKeys: () => [],
    currentNodeKey: undefined,
    highlightCurrent: false,
    expandOnClickNode: true,
    checkOnClickNode: false,
    checkOnClickLeaf: true,
    autoExpandParent: true,
    accordion: false,
    indent: 18,
    icon: undefined,
    lazy: false,
    load: undefined,
    draggable: false,
    filterNodeMethod: undefined,
    multiple: false,
    filterText: ''
  }
)

const emit = defineEmits<{
  'node-click': [node: TreeNode, data: TreeNodeData, event: MouseEvent]
  'node-expand': [node: TreeNode, data: TreeNodeData]
  'node-collapse': [node: TreeNode, data: TreeNodeData]
  'check-change': [node: TreeNode, checked: boolean, indeterminate: boolean]
  check: [
    payload: {
      checkedNodes: TreeNode[]
      checkedKeys: (string | number)[]
      halfCheckedNodes: TreeNode[]
      halfCheckedKeys: (string | number)[]
    }
  ]
  'current-change': [node: TreeNode | null, data: TreeNodeData | null]
  'update:currentNodeKey': [key: string | number | undefined]
  'update:modelValue': [value: (string | number)[]]
}>()

/** 内部树（带 key / parent / level） */
const tree = ref<TreeNode[]>([])

/** 展开的节点 key */
const expandedKeys = ref<Set<string | number>>(new Set())
/** 勾选的节点 key */
const checkedKeys = ref<Set<string | number>>(new Set())
/** 半勾的节点 key */
const halfCheckedKeys = ref<Set<string | number>>(new Set())
/** 当前高亮节点 key */
const currentKey = ref<string | number | undefined>(undefined)
/** 多选模式下已选的节点 key */
const selectedKeys = ref<Set<string | number>>(new Set())

/** 筛选后的树（filterText 为空时是原树） */
const visibleTree = computed(() =>
  props.filterText
    ? filterTree(tree.value, props.filterText, props.filterNodeMethod)
    : tree.value
)

/** 是否存在筛选命中（用于空态文案区分） */
const isFiltered = computed(() => !!props.filterText)

/** 重建树（数据变化时） */
function rebuild() {
  tree.value = buildTree(props.data, props.props, props.nodeKey)

  // 默认展开
  const exp = new Set<string | number>()
  if (props.defaultExpandAll) {
    walkTree(tree.value, (n) => {
      if (n.children.length) exp.add(n.key)
    })
  }
  for (const k of props.defaultExpandedKeys) exp.add(k)
  expandedKeys.value = exp

  // 默认勾选
  const state = resolveCheckedKeys(tree.value, props.defaultCheckedKeys, props.checkStrictly)
  checkedKeys.value = state.checked
  halfCheckedKeys.value = state.halfChecked

  // 当前节点
  currentKey.value = props.currentNodeKey
  if (props.currentNodeKey !== undefined) {
    const node = findNodeByKey(tree.value, props.currentNodeKey)
    if (node && props.autoExpandParent) expandPathTo(node, expandedKeys.value)
  }
}

watch(() => [props.data, props.nodeKey, props.props], rebuild, { immediate: true, deep: true })

watch(
  () => props.currentNodeKey,
  (k) => {
    currentKey.value = k
  }
)

/* ---------------- 展开 / 折叠 ---------------- */

function isExpanded(node: TreeNode): boolean {
  return expandedKeys.value.has(node.key)
}

function toggleExpand(node: TreeNode, force?: boolean) {
  if (!node.children.length && !props.lazy) return
  const next = force ?? !isExpanded(node)
  const exp = new Set(expandedKeys.value)

  if (next) {
    // 手风琴：同层只能展开一个
    if (props.accordion && node.parent) {
      for (const sib of node.parent.children) exp.delete(sib.key)
    }
    exp.add(node.key)
    // 懒加载：首次展开时请求子节点
    if (props.lazy && props.load && node.children.length === 0 && !node.isLeaf) {
      props.load(node, (children) => {
        const target = findNodeByKey(tree.value, node.key)
        if (!target) return
        const built = buildTree(children, props.props, props.nodeKey, target, target.level + 1)
        target.children = built
        target.isLeaf = built.length === 0
      })
    }
  } else {
    exp.delete(node.key)
  }

  expandedKeys.value = exp
  if (next) emit('node-expand', node, node.data)
  else emit('node-collapse', node, node.data)
}

/* ---------------- 勾选 ---------------- */

/** 该节点当前是否勾选 */
function isChecked(node: TreeNode): boolean {
  return checkedKeys.value.has(node.key)
}
function applyCheck(node: TreeNode, target: boolean, silent = false) {
  const state = computeCheckState(node, target, props.checkStrictly)
  const ck = new Set(checkedKeys.value)
  const hc = new Set(halfCheckedKeys.value)
  for (const k of state.checked) ck.add(k)
  for (const k of state.halfChecked) hc.add(k)
  if (!target) {
    ck.delete(node.key)
    hc.delete(node.key)
  }
  checkedKeys.value = ck
  halfCheckedKeys.value = hc
  if (!silent) {
    emit('check-change', node, target, false)
    emitCheck()
  }
}

function emitCheck() {
  const all = flattenTree(tree.value)
  emit('check', {
    checkedNodes: all.filter((n) => checkedKeys.value.has(n.key)),
    checkedKeys: all.filter((n) => checkedKeys.value.has(n.key)).map((n) => n.key),
    halfCheckedNodes: all.filter((n) => halfCheckedKeys.value.has(n.key)),
    halfCheckedKeys: all.filter((n) => halfCheckedKeys.value.has(n.key)).map((n) => n.key)
  })
}

/* ---------------- 点击 / 当前节点 ---------------- */

function onNodeClick(node: TreeNode, event: MouseEvent) {
  const isLeaf = node.children.length === 0
  const target = event.target as HTMLElement

  // 点勾选框不触发节点点击
  if (target.closest('.dmk-tree__checkbox')) return

  // 点箭头：仅切换展开
  if (target.closest('.dmk-tree__arrow')) {
    toggleExpand(node)
    return
  }

  if (props.checkOnClickNode && props.showCheckbox && (!isLeaf || props.checkOnClickLeaf)) {
    applyCheck(node, !isChecked(node))
  }

  if (props.expandOnClickNode) {
    toggleExpand(node)
  }

  // 设置当前节点
  currentKey.value = node.key
  emit('current-change', node, node.data)
  emit('update:currentNodeKey', node.key)

  // 多选模式
  if (props.multiple) {
    const sel = new Set(selectedKeys.value)
    if (sel.has(node.key)) sel.delete(node.key)
    else sel.add(node.key)
    selectedKeys.value = sel
    emit('update:modelValue', [...sel])
  }

  emit('node-click', node, node.data, event)
}

/* ---------------- 键盘 ---------------- */

function onKeydown(node: TreeNode, event: KeyboardEvent) {
  const flat = flattenTree(visibleTree.value)
  const idx = flat.findIndex((n) => n.key === node.key)
  if (idx < 0) return

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault()
      const next = flat[idx + 1]
      if (next) focusNode(next.key)
      break
    }
    case 'ArrowUp': {
      event.preventDefault()
      const prev = flat[idx - 1]
      if (prev) focusNode(prev.key)
      break
    }
    case 'ArrowRight': {
      event.preventDefault()
      if (!isExpanded(node)) toggleExpand(node, true)
      break
    }
    case 'ArrowLeft': {
      event.preventDefault()
      if (isExpanded(node)) toggleExpand(node, false)
      else if (node.parent) focusNode(node.parent.key)
      break
    }
    case ' ':
    case 'Enter': {
      event.preventDefault()
      if (props.showCheckbox) applyCheck(node, !isChecked(node))
      break
    }
  }
}

function focusNode(key: string | number) {
  const el = document.querySelector<HTMLElement>(`.dmk-tree__node[data-key="${CSS.escape(String(key))}"]`)
  el?.focus()
}

/* ---------------- exposes（对齐 EP 16 项） ---------------- */

function filter(keyword: string) {
  const matched = filterTree(tree.value, keyword, props.filterNodeMethod)
  // 过滤后自动展开命中分支的祖先
  const exp = new Set(expandedKeys.value)
  walkTree(matched, (n) => {
    if (n.parent) exp.add(n.parent.key)
  })
  expandedKeys.value = exp
  return matched
}

function updateKeyChildren(key: string | number, data: TreeNodeData[]) {
  const node = findNodeByKey(tree.value, key)
  if (!node) return
  const built = buildTree(data, props.props, props.nodeKey, node, node.level + 1)
  node.children = built
  node.isLeaf = built.length === 0
}

function getCheckedNodes(leafOnly = false, includeHalfChecked = false) {
  const all = flattenTree(tree.value)
  const out = all.filter((n) => checkedKeys.value.has(n.key))
  if (includeHalfChecked) {
    for (const n of all) if (halfCheckedKeys.value.has(n.key)) out.push(n)
  }
  if (leafOnly) return getCheckedLeafNodes(tree.value, checkedKeys.value)
  return out
}

function setCheckedNodes(nodes: TreeNode[], leafOnly = false) {
  const keys = leafOnly ? nodes.filter((n) => n.isLeaf).map((n) => n.key) : nodes.map((n) => n.key)
  setCheckedKeys(keys, leafOnly)
}

function getCheckedKeys(leafOnly = false) {
  if (leafOnly) return getCheckedLeafNodes(tree.value, checkedKeys.value).map((n) => n.key)
  return flattenTree(tree.value)
    .filter((n) => checkedKeys.value.has(n.key))
    .map((n) => n.key)
}

function setCheckedKeys(keys: (string | number)[], leafOnly = false) {
  // leafOnly：只勾叶子节点（EP 语义）
  const target = leafOnly
    ? keys.filter((k) => {
        const n = findNodeByKey(tree.value, k)
        return n ? n.isLeaf : false
      })
    : keys
  const state = resolveCheckedKeys(tree.value, target, props.checkStrictly)
  checkedKeys.value = state.checked
  halfCheckedKeys.value = state.halfChecked
  emitCheck()
}

function setChecked(keyOrData: string | number | TreeNodeData, target: boolean, deep = true) {
  const node =
    typeof keyOrData === 'object'
      ? findNodeByData(tree.value, keyOrData)
      : findNodeByKey(tree.value, keyOrData)
  if (!node) return
  applyCheck(node, target)
  void deep
}

function getHalfCheckedNodes() {
  return flattenTree(tree.value).filter((n) => halfCheckedKeys.value.has(n.key))
}

function getHalfCheckedKeys() {
  return getHalfCheckedNodes().map((n) => n.key)
}

function getCurrentKey() {
  return currentKey.value ?? null
}

function getCurrentNode() {
  if (currentKey.value === undefined) return null
  return findNodeByKey(tree.value, currentKey.value)?.data ?? null
}

function setCurrentKey(key: string | number | null, shouldAutoExpandParent = true) {
  currentKey.value = key ?? undefined
  if (key !== null && shouldAutoExpandParent) {
    const node = findNodeByKey(tree.value, key)
    if (node) expandPathTo(node, expandedKeys.value)
  }
  const node = key === null ? null : findNodeByKey(tree.value, key)
  emit('current-change', node ?? null, node?.data ?? null)
}

function setCurrentNode(node: TreeNode | TreeNodeData | null, shouldAutoExpandParent = true) {
  const target =
    node === null ? null : 'key' in (node as TreeNode) ? findNodeByKey(tree.value, (node as TreeNode).key) : findNodeByData(tree.value, node as TreeNodeData)
  setCurrentKey(target ? target.key : null, shouldAutoExpandParent)
}

function getNode(dataOrKey: TreeNodeData | string | number): TreeNode | undefined {
  if (typeof dataOrKey === 'object') return findNodeByData(tree.value, dataOrKey)
  return findNodeByKey(tree.value, dataOrKey)
}

function remove(dataOrKey: TreeNodeData | string | number) {
  const node = getNode(dataOrKey)
  if (!node || !node.parent) return
  const siblings = node.parent.children
  const i = siblings.indexOf(node)
  if (i >= 0) siblings.splice(i, 1)
}

function append(data: TreeNodeData, parentData?: TreeNodeData | string | number) {
  const parent = parentData ? getNode(parentData) : null
  const built = buildTree([data], props.props, props.nodeKey, parent ?? null, parent ? parent.level + 1 : 0)
  if (parent) {
    parent.children.push(...built)
    parent.isLeaf = false
  } else {
    tree.value.push(...built)
  }
}

function insertBefore(data: TreeNodeData, refNode: TreeNodeData | string | number) {
  const ref = getNode(refNode)
  if (!ref || !ref.parent) return
  const built = buildTree([data], props.props, props.nodeKey, ref.parent, ref.level)
  const i = ref.parent.children.indexOf(ref)
  ref.parent.children.splice(i, 0, ...built)
}

function insertAfter(data: TreeNodeData, refNode: TreeNodeData | string | number) {
  const ref = getNode(refNode)
  if (!ref || !ref.parent) return
  const built = buildTree([data], props.props, props.nodeKey, ref.parent, ref.level)
  const i = ref.parent.children.indexOf(ref)
  ref.parent.children.splice(i + 1, 0, ...built)
}

defineExpose({
  filter,
  updateKeyChildren,
  getCheckedNodes,
  setCheckedNodes,
  getCheckedKeys,
  setCheckedKeys,
  setChecked,
  getHalfCheckedNodes,
  getHalfCheckedKeys,
  getCurrentKey,
  getCurrentNode,
  setCurrentKey,
  setCurrentNode,
  getNode,
  remove,
  append,
  insertBefore,
  insertAfter
})
</script>

<template>
  <div class="dmk-tree" role="tree" :aria-multiselectable="multiple ? 'true' : undefined">
    <p v-if="!visibleTree.length" class="dmk-tree__empty">
      {{ isFiltered ? '没有匹配的结果' : emptyText }}
    </p>
    <ul v-else class="dmk-tree__list" role="group">
      <TreeNodeItem
        v-for="node in visibleTree"
        :key="node.key"
        :node="node"
        :expanded-keys="expandedKeys"
        :checked-keys="checkedKeys"
        :half-checked-keys="halfCheckedKeys"
        :current-key="currentKey"
        :show-checkbox="showCheckbox"
        :check-strictly="checkStrictly"
        :highlight-current="highlightCurrent"
        :expand-on-click-node="expandOnClickNode"
        :indent="indent"
        :multiple="multiple"
        :selected-keys="selectedKeys"
        @toggle="toggleExpand"
        @check="applyCheck"
        @click="onNodeClick"
        @keydown="onKeydown"
      >
        <template #default="slotProps">
          <slot name="default" v-bind="slotProps">{{ slotProps.node.label }}</slot>
        </template>
      </TreeNodeItem>
    </ul>
  </div>
</template>

<style scoped>
.dmk-tree {
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
  color: var(--dmk-color-text);
}

.dmk-tree__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.dmk-tree__empty {
  margin: 0;
  padding: 12px 4px;
  color: var(--dmk-color-text-muted);
  font-size: 13px;
}
</style>
