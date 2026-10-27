<script setup lang="ts">
/**
 * TreeNodeItem —— 树的递归节点（内部组件，由 DTree 使用）。
 *
 * 单独成组件是为了递归渲染：Vue 的 SFC 支持自引用（文件名即组件名），
 * 节点渲染自己的 children 时再次引用本组件即可。
 */
import { computed } from 'vue'
import type { TreeNode, TreeNodeData } from '../lib/tree'

const props = defineProps<{
  node: TreeNode
  expandedKeys: Set<string | number>
  checkedKeys: Set<string | number>
  halfCheckedKeys: Set<string | number>
  currentKey?: string | number
  showCheckbox: boolean
  checkStrictly: boolean
  highlightCurrent: boolean
  expandOnClickNode: boolean
  indent: number
  multiple: boolean
  selectedKeys: Set<string | number>
}>()

/**
 * 插槽类型必须显式声明。
 * 递归组件里模板的类型推断会自我引用（slotProps → 插槽 → slotProps），
 * TypeScript 无法收敛报 TS7022；defineSlots 直接给出类型，绕开推断。
 */
defineSlots<{
  /** 自定义节点内容：作用域 { node, data } */
  default(props: { node: TreeNode; data: TreeNodeData }): unknown
}>()

const emit = defineEmits<{
  toggle: [node: TreeNode, force?: boolean]
  check: [node: TreeNode, target: boolean]
  click: [node: TreeNode, event: MouseEvent]
  keydown: [node: TreeNode, event: KeyboardEvent]
}>()

const isExpanded = computed(() => props.expandedKeys.has(props.node.key))
const isChecked = computed(() => props.checkedKeys.has(props.node.key))
const isHalfChecked = computed(() => props.halfCheckedKeys.has(props.node.key))
const isCurrent = computed(() => props.currentKey !== undefined && props.currentKey === props.node.key)
const isSelected = computed(() => props.selectedKeys.has(props.node.key))
const hasChildren = computed(() => props.node.children.length > 0)

const nodeStyle = computed(() => ({ paddingLeft: `${props.indent * props.node.level}px` }))

function onArrowClick(e: MouseEvent) {
  e.stopPropagation()
  emit('toggle', props.node)
}

function onCheckboxChange(e: Event) {
  e.stopPropagation()
  const input = e.target as HTMLInputElement
  emit('check', props.node, input.checked)
}
</script>

<template>
  <li class="dmk-tree__item" role="none">
    <div
      class="dmk-tree__node"
      :class="{
        'is-current': isCurrent && highlightCurrent,
        'is-selected': isSelected,
        'is-disabled': node.disabled,
        [node.className]: !!node.className
      }"
      role="treeitem"
      :aria-expanded="hasChildren ? isExpanded : undefined"
      :aria-selected="isCurrent || isSelected"
      :aria-disabled="node.disabled ? 'true' : undefined"
      :data-key="String(node.key)"
      :tabindex="node.disabled ? -1 : 0"
      :style="nodeStyle"
      @click="emit('click', node, $event)"
      @keydown="emit('keydown', node, $event)"
    >
      <span
        class="dmk-tree__arrow"
        :class="{ 'is-expanded': isExpanded, 'is-leaf': !hasChildren }"
        @click="onArrowClick"
      >
        <span v-if="hasChildren" aria-hidden="true">▸</span>
      </span>

      <label v-if="showCheckbox" class="dmk-tree__checkbox" @click.stop>
        <input
          type="checkbox"
          :checked="isChecked"
          :indeterminate="isHalfChecked"
          :disabled="node.disabled"
          :aria-label="node.label"
          @change="onCheckboxChange"
        />
      </label>

      <span class="dmk-tree__label">
        <slot :node="node" :data="node.data">{{ node.label }}</slot>
      </span>
    </div>

    <ul v-if="hasChildren && isExpanded" class="dmk-tree__list" role="group">
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.key"
        :node="child"
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
        @toggle="(n, f) => emit('toggle', n, f)"
        @check="(n, t) => emit('check', n, t)"
        @click="(n, e) => emit('click', n, e)"
        @keydown="(n, e) => emit('keydown', n, e)"
      >
        <template #default="innerSlot">
          <slot name="default" :node="innerSlot.node" :data="innerSlot.data">{{ innerSlot.node.label }}</slot>
        </template>
      </TreeNodeItem>
    </ul>
  </li>
</template>

<style scoped>
.dmk-tree__item {
  list-style: none;
}

.dmk-tree__node {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding-right: 8px;
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
  user-select: none;
  color: var(--dmk-color-text);
  transition: background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-tree__node:hover {
  background: var(--dmk-color-surface-hover);
}

.dmk-tree__node:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-tree__node.is-current {
  background: var(--dmk-color-primary-subtle);
  color: var(--dmk-color-primary);
}

.dmk-tree__node.is-selected {
  color: var(--dmk-color-primary);
  font-weight: 500;
}

.dmk-tree__node.is-disabled {
  color: var(--dmk-color-text-muted);
  cursor: not-allowed;
}

.dmk-tree__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: var(--dmk-color-text-muted);
  font-size: 11px;
  transition: transform var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-tree__arrow.is-expanded {
  transform: rotate(90deg);
}

.dmk-tree__arrow.is-leaf {
  visibility: hidden;
}

.dmk-tree__checkbox {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

.dmk-tree__checkbox input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--dmk-color-primary);
  cursor: pointer;
}

.dmk-tree__label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--dmk-font-base);
}
</style>
