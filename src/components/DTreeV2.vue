<script setup lang="ts">
/**
 * DTreeV2 —— 虚拟化树（大数据量场景）。
 * 契约参考 Element Plus el-tree-v2：
 *   data / props / height / itemHeight / nodeKey / showCheckbox / checkStrictly /
 *   defaultExpandAll / defaultExpandedKeys / currentNodeKey / highlightCurrent /
 *   expandOnClickNode / indent / emptyText
 *   Events: node-click / node-expand / node-collapse / check-change / check /
 *           current-change / update:modelValue / update:currentNodeKey
 *   Slots: default（作用域 { node, data }）
 *   Exposes: getCheckedKeys / setCheckedKeys / getCurrentKey / setCurrentKey /
 *            getNode / filter / scrollTo
 *
 * 实现：先把树按展开状态【扁平化成可见节点列表】，再用 lib/virtual-list.ts
 *      对这个列表做定高虚拟滚动 —— 1 万个节点也只挂载几十个 DOM。
 */
import { computed, ref, watch } from 'vue'
import { buildTree, computeCheckState, findNodeByKey, type TreeNode, type TreeNodeData, type TreeProps } from '../lib/tree'
import { calcVirtualRange } from '../lib/virtual-list'

const props = withDefaults(
  defineProps<{
    /** 树数据 */
    data?: TreeNodeData[]
    /** 字段映射 */
    props?: Partial<TreeProps>
    /** 容器高度 */
    height?: number
    /** 单项高度 */
    itemHeight?: number
    /** 节点唯一标识字段 */
    nodeKey?: string
    /** 是否显示勾选框 */
    showCheckbox?: boolean
    /** 父子勾选互不影响 */
    checkStrictly?: boolean
    /** 默认全展开 */
    defaultExpandAll?: boolean
    /** 默认展开的 key */
    defaultExpandedKeys?: (string | number)[]
    /** 当前高亮节点 */
    currentNodeKey?: string | number
    /** 点节点即展开/折叠 */
    expandOnClickNode?: boolean
    /** 层级缩进 px */
    indent?: number
    /** 空数据文案 */
    emptyText?: string
    /** 绑定值（勾选的 key 数组） */
    modelValue?: (string | number)[]
  }>(),
  {
    data: () => [],
    props: () => ({}),
    height: 400,
    itemHeight: 28,
    nodeKey: 'id',
    showCheckbox: false,
    checkStrictly: false,
    defaultExpandAll: false,
    defaultExpandedKeys: () => [],
    currentNodeKey: undefined,
    expandOnClickNode: true,
    indent: 18,
    emptyText: '暂无数据',
    modelValue: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  'update:currentNodeKey': [value: string | number]
  'node-click': [node: TreeNode, data: TreeNodeData]
  'node-expand': [node: TreeNode, data: TreeNodeData]
  'node-collapse': [node: TreeNode, data: TreeNodeData]
  'check-change': [node: TreeNode, checked: boolean, indeterminate: boolean]
  'check': [payload: { checkedNodes: TreeNode[]; checkedKeys: (string | number)[]; halfCheckedKeys: (string | number)[] }]
  'current-change': [node: TreeNode | null, data: TreeNodeData | null]
}>()

/** 构建后的树 */
const tree = computed<TreeNode[]>(() => buildTree(props.data, props.props, props.nodeKey))

/** 已展开的节点 key */
const expanded = ref<Set<string | number>>(new Set())

/** 已勾选的 key */
const checkedKeys = ref<Set<string | number>>(new Set(props.modelValue ?? []))

/** 半勾选的 key */
const halfCheckedKeys = ref<Set<string | number>>(new Set())

/** 当前节点 */
const currentKey = ref<string | number | undefined>(props.currentNodeKey)

/** 滚动容器 */
const listRef = ref<HTMLElement | null>(null)
/** 滚动偏移 */
const scrollTop = ref(0)

/** 初始化展开状态 */
function initExpanded() {
  if (props.defaultExpandAll) {
    const all = new Set<string | number>()
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.children.length) {
          all.add(n.key)
          walk(n.children)
        }
      }
    }
    walk(tree.value)
    expanded.value = all
    return
  }
  expanded.value = new Set(props.defaultExpandedKeys)
}

watch(
  () => props.data,
  () => {
    initExpanded()
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (v) => {
    if (v) checkedKeys.value = new Set(v)
  }
)

watch(
  () => props.currentNodeKey,
  (v) => {
    currentKey.value = v
  }
)

/**
 * 可见节点列表：按树的先序遍历，只输出「自身已展开」的节点。
 * 这是虚拟化的关键 —— 折叠的子树完全不进入列表。
 */
const visibleNodes = computed<TreeNode[]>(() => {
  const out: TreeNode[] = []
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      out.push(n)
      if (n.children.length && expanded.value.has(n.key)) walk(n.children)
    }
  }
  walk(tree.value)
  return out
})

/** 虚拟区间 */
const range = computed(() =>
  calcVirtualRange({
    count: visibleNodes.value.length,
    itemSize: props.itemHeight,
    viewportSize: props.height,
    scrollTop: scrollTop.value,
    overscan: 4
  })
)

/** 需要渲染的节点 */
const renderedNodes = computed(() => visibleNodes.value.slice(range.value.start, range.value.end))

/** 节点缩进 */
function nodeIndent(node: TreeNode): number {
  return node.level * props.indent
}

/** 是否展开 */
function isExpanded(node: TreeNode): boolean {
  return expanded.value.has(node.key)
}

/** 是否勾选 */
function isChecked(node: TreeNode): boolean {
  return checkedKeys.value.has(node.key)
}

/** 是否半勾选 */
function isHalfChecked(node: TreeNode): boolean {
  return halfCheckedKeys.value.has(node.key)
}

/** 是否当前节点 */
function isCurrent(node: TreeNode): boolean {
  return currentKey.value === node.key
}

/** 展开/折叠 */
function toggleExpand(node: TreeNode) {
  if (!node.children.length) return
  const next = new Set(expanded.value)
  if (next.has(node.key)) {
    next.delete(node.key)
    emit('node-collapse', node, node.data)
  } else {
    next.add(node.key)
    emit('node-expand', node, node.data)
  }
  expanded.value = next
}

/** 点击节点 */
function onNodeClick(node: TreeNode) {
  currentKey.value = node.key
  emit('update:currentNodeKey', node.key)
  emit('node-click', node, node.data)
  emit('current-change', node, node.data)
  if (props.expandOnClickNode) toggleExpand(node)
}

/** 勾选变化（联动父子） */
function onCheckChange(node: TreeNode, checked: boolean) {
  const state = computeCheckState(node, checked, props.checkStrictly)
  checkedKeys.value = state.checked
  halfCheckedKeys.value = state.halfChecked
  emit('update:modelValue', [...state.checked])
  emit('check-change', node, checked, state.halfChecked.has(node.key))
  emit('check', {
    checkedNodes: [...state.checked].map((k) => findNodeByKey(tree.value, k)).filter((n): n is TreeNode => !!n),
    checkedKeys: [...state.checked],
    halfCheckedKeys: [...state.halfChecked]
  })
}

/** 滚动 */
function onScroll(e: Event) {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}

defineExpose({
  /** 取勾选的 key */
  getCheckedKeys: () => [...checkedKeys.value],
  /** 设置勾选的 key */
  setCheckedKeys: (keys: (string | number)[]) => {
    checkedKeys.value = new Set(keys)
    emit('update:modelValue', keys)
  },
  /** 取当前节点 key */
  getCurrentKey: () => currentKey.value,
  /** 设置当前节点 */
  setCurrentKey: (key: string | number) => {
    currentKey.value = key
    emit('update:currentNodeKey', key)
  },
  /** 按 key 取节点 */
  getNode: (key: string | number) => findNodeByKey(tree.value, key),
  /** 滚动到指定节点 */
  scrollTo: (key: string | number) => {
    const idx = visibleNodes.value.findIndex((n) => n.key === key)
    if (idx < 0 || !listRef.value) return
    const top = idx * props.itemHeight
    const el = listRef.value
    if (top < el.scrollTop) el.scrollTop = top
    else if (top + props.itemHeight > el.scrollTop + el.clientHeight) {
      el.scrollTop = top + props.itemHeight - el.clientHeight
    }
  }
})
</script>

<template>
  <div class="dmk-tree-v2">
    <div
      ref="listRef"
      class="dmk-tree-v2__list"
      :style="{ height: `${height}px` }"
      role="tree"
      @scroll="onScroll"
    >
      <div v-if="!visibleNodes.length" class="dmk-tree-v2__empty">{{ emptyText }}</div>

      <!-- 虚拟滚动：外层撑总高，内层只渲染可视区的节点 -->
      <div v-else class="dmk-tree-v2__phantom" :style="{ height: `${range.totalSize}px` }">
        <div
          v-for="(node, i) in renderedNodes"
          :key="String(node.key)"
          class="dmk-tree-v2__node"
          :class="{
            'is-current': isCurrent(node),
            'is-checked': isChecked(node),
            'is-half': isHalfChecked(node)
          }"
          :style="{
            height: `${itemHeight}px`,
            transform: `translateY(${(range.start + i) * itemHeight}px)`
          }"
          role="treeitem"
          :aria-expanded="node.children.length ? isExpanded(node) : undefined"
          :aria-selected="isCurrent(node)"
          @click="onNodeClick(node)"
        >
          <span class="dmk-tree-v2__indent" :style="{ width: `${nodeIndent(node)}px` }" />

          <!-- 展开箭头 -->
          <span
            class="dmk-tree-v2__arrow"
            :class="{ 'is-leaf': !node.children.length, 'is-open': isExpanded(node) }"
            @click.stop="toggleExpand(node)"
          >
            ▸
          </span>

          <!-- 勾选框 -->
          <input
            v-if="showCheckbox"
            type="checkbox"
            class="dmk-tree-v2__check"
            :checked="isChecked(node)"
            :indeterminate.prop="isHalfChecked(node)"
            @click.stop
            @change="onCheckChange(node, ($event.target as HTMLInputElement).checked)"
          />

          <span class="dmk-tree-v2__label">
            <slot name="default" :node="node" :data="node.data">{{ node.label }}</slot>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmk-tree-v2 {
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  font-family: var(--dmk-font-family);
  color: var(--dmk-color-text);
}

.dmk-tree-v2__list {
  position: relative;
  overflow-y: auto;
  box-sizing: border-box;
}

.dmk-tree-v2__phantom {
  position: relative;
}

.dmk-tree-v2__node {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  padding: 0 8px;
  font-size: 13px;
  cursor: pointer;
}

.dmk-tree-v2__node:hover {
  background: var(--dmk-color-fill);
}

.dmk-tree-v2__node.is-current {
  background: var(--dmk-color-primary-subtle);
  color: var(--dmk-color-primary);
}

.dmk-tree-v2__indent {
  flex-shrink: 0;
}

.dmk-tree-v2__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
  color: var(--dmk-color-text-muted);
  font-size: 10px;
  transition: transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-tree-v2__arrow.is-open {
  transform: rotate(90deg);
}

.dmk-tree-v2__arrow.is-leaf {
  visibility: hidden;
}

.dmk-tree-v2__check {
  flex-shrink: 0;
  margin: 0 4px 0 2px;
}

.dmk-tree-v2__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmk-tree-v2__empty {
  padding: 40px;
  color: var(--dmk-color-text-muted);
  font-size: 13px;
  text-align: center;
}
</style>
