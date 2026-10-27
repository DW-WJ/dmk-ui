<script setup lang="ts">
/**
 * DTreeSelect —— 树选择器（Tree + Select 的组合）。
 * 契约参考 Element Plus el-tree-select：
 *   继承 el-tree 的全部属性（data / nodeKey / props / showCheckbox /
 *   checkStrictly / defaultExpandAll / defaultExpandedKeys / defaultCheckedKeys /
 *   currentNodeKey / highlightCurrent / expandOnClickNode / checkOnClickNode /
 *   accordion / indent / lazy / load / filterNodeMethod / draggable）
 *   + el-select 的：multiple / collapseTags / collapseTagsTooltip /
 *   maxCollapseTags / placeholder / disabled / clearable / size / filterable
 *   Exposes: treeRef / selectRef
 *
 * 实现：输入框 + 弹出面板（内嵌 DTree），选中后回填标签。
 *      多选时以标签形式回填，超过 maxCollapseTags 折叠成「+N」。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import DTree from './DTree.vue'
import type { TreeNode, TreeNodeData, TreeProps } from '../lib/tree'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | (string | number)[]
    data?: TreeNodeData[]
    nodeKey?: string
    treeProps?: TreeProps
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    multiple?: boolean
    size?: 'large' | 'default' | 'small'
    showCheckbox?: boolean
    checkStrictly?: boolean
    defaultExpandAll?: boolean
    defaultExpandedKeys?: (string | number)[]
    defaultCheckedKeys?: (string | number)[]
    currentNodeKey?: string | number
    highlightCurrent?: boolean
    expandOnClickNode?: boolean
    checkOnClickNode?: boolean
    accordion?: boolean
    indent?: number
    lazy?: boolean
    load?: (node: TreeNode, resolve: (data: TreeNodeData[]) => void) => void
    filterNodeMethod?: (node: TreeNode, keyword: string) => boolean
    filterable?: boolean
    collapseTags?: boolean
    maxCollapseTags?: number
    emptyText?: string
  }>(),
  {
    modelValue: undefined,
    data: () => [],
    nodeKey: 'id',
    treeProps: () => ({}),
    placeholder: '请选择',
    disabled: false,
    clearable: true,
    multiple: false,
    size: 'default',
    showCheckbox: false,
    checkStrictly: false,
    defaultExpandAll: false,
    defaultExpandedKeys: () => [],
    defaultCheckedKeys: () => [],
    currentNodeKey: undefined,
    highlightCurrent: false,
    expandOnClickNode: true,
    checkOnClickNode: false,
    accordion: false,
    indent: 18,
    lazy: false,
    load: undefined,
    filterNodeMethod: undefined,
    filterable: false,
    collapseTags: false,
    maxCollapseTags: 1,
    emptyText: '暂无数据'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
  'node-click': [node: TreeNode, data: TreeNodeData]
  clear: []
}>()

const visible = ref(false)
const keyword = ref('')
const rootRef = ref<HTMLElement | null>(null)
const treeRef = ref<InstanceType<typeof DTree> | null>(null)

/** 已选中的 key 集合 */
const selectedKeys = computed<Set<string | number>>(() => {
  const v = props.modelValue
  if (v === undefined || v === null || v === '') return new Set()
  if (Array.isArray(v)) return new Set(v as (string | number)[])
  return new Set([v as string | number])
})

/**
 * key → label 的缓存。
 * 面板关闭时 DTree 被 v-if 销毁，treeRef 变 null 就再也取不到 label，
 * 所以选中时把 label 记下来（key 变化时也能回显）。
 */
const labelCache = ref<Map<string | number, string>>(new Map())

/** 已选节点的 label 列表 */
const selectedLabels = computed<string[]>(() => {
  const tree = treeRef.value
  const out: string[] = []
  for (const k of selectedKeys.value) {
    // 树在面板里时优先取实时 label（数据可能变了），否则用缓存
    const node = tree?.getNode(k)
    const label = node?.label ?? labelCache.value.get(k)
    if (label) out.push(label)
  }
  return out
})

/** 记录选中节点的 label */
function rememberLabel(key: string | number, label: string) {
  const next = new Map(labelCache.value)
  next.set(key, label)
  labelCache.value = next
}

/** 折叠标签显示 */
const displayTags = computed(() => {
  if (!props.collapseTags) return selectedLabels.value
  return selectedLabels.value.slice(0, props.maxCollapseTags)
})

const foldedCount = computed(() => selectedLabels.value.length - displayTags.value.length)

function onNodeClick(node: TreeNode) {
  emit('node-click', node, node.data)
  if (props.multiple) {
    // 多选：勾选框之外，点节点即切换选中
    const next = new Set(selectedKeys.value)
    if (next.has(node.key)) next.delete(node.key)
    else {
      next.add(node.key)
      rememberLabel(node.key, node.label)
    }
    const arr = [...next]
    emit('update:modelValue', arr)
    emit('change', arr)
    return
  }
  rememberLabel(node.key, node.label)
  emit('update:modelValue', node.key)
  emit('change', node.key)
  close()
}

function onCheck(payload: {
  checkedKeys: (string | number)[]
  halfCheckedKeys: (string | number)[]
}) {
  const keys = [...payload.checkedKeys, ...payload.halfCheckedKeys]
  emit('update:modelValue', keys)
  emit('change', keys)
}

function clearValue() {
  emit('update:modelValue', props.multiple ? [] : undefined)
  emit('clear')
  emit('change', props.multiple ? [] : undefined)
}

function open() {
  if (props.disabled) return
  visible.value = true
  keyword.value = ''
}

function close() {
  visible.value = false
}

function onDocClick(e: MouseEvent) {
  if (!visible.value) return
  const target = e.target as Node
  if (rootRef.value && !rootRef.value.contains(target)) close()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
})

/** 卸载时移除全局监听 */
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
})

defineExpose({
  treeRef,
  /** 手动开关面板 */
  togglePopperVisible: (v?: boolean) => {
    if (v === undefined) (visible.value ? close() : open())
    else if (v) open()
    else close()
  }
})
</script>

<template>
  <div ref="rootRef" class="dmk-tree-select" :class="[`dmk-tree-select--${size}`, { 'is-disabled': disabled }]">
    <div class="dmk-tree-select__control" role="combobox" :aria-expanded="visible" aria-haspopup="tree">
      <div class="dmk-tree-select__tags">
        <template v-if="multiple && displayTags.length">
          <span v-for="(t, i) in displayTags" :key="i" class="dmk-tree-select__tag">
            {{ t }}
          </span>
          <span v-if="foldedCount > 0" class="dmk-tree-select__tag is-fold">+{{ foldedCount }}</span>
        </template>
        <input
          v-else
          class="dmk-tree-select__input"
          type="text"
          readonly
          :disabled="disabled"
          :placeholder="selectedLabels.length ? '' : placeholder"
          :value="selectedLabels.join('、')"
          @click="visible ? close() : open()"
        />
      </div>
      <button
        v-if="clearable && selectedLabels.length"
        type="button"
        class="dmk-tree-select__clear"
        aria-label="清空"
        @click.stop="clearValue"
      >
        ×
      </button>
      <span class="dmk-tree-select__arrow" aria-hidden="true">▾</span>
    </div>

    <div v-if="visible" class="dmk-tree-select__panel" role="tree" aria-label="树选择面板">
      <div v-if="filterable" class="dmk-tree-select__filter">
        <input
          class="dmk-tree-select__filter-input"
          type="text"
          placeholder="搜索"
          :value="keyword"
          @input="keyword = ($event.target as HTMLInputElement).value"
        />
      </div>
      <DTree
        ref="treeRef"
        :data="data"
        :node-key="nodeKey"
        :props="treeProps"
        :empty-text="emptyText"
        :show-checkbox="showCheckbox"
        :check-strictly="checkStrictly"
        :default-expand-all="defaultExpandAll"
        :default-expanded-keys="defaultExpandedKeys"
        :default-checked-keys="defaultCheckedKeys"
        :current-node-key="currentNodeKey"
        :highlight-current="highlightCurrent"
        :expand-on-click-node="expandOnClickNode"
        :check-on-click-node="checkOnClickNode"
        :accordion="accordion"
        :indent="indent"
        :lazy="lazy"
        :load="load"
        :filter-node-method="filterNodeMethod"
        :filter-text="keyword"
        @node-click="onNodeClick"
        @check="onCheck"
      />
    </div>
  </div>
</template>

<style scoped>
.dmk-tree-select {
  position: relative;
  display: inline-block;
  min-width: 240px;
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
}

.dmk-tree-select__control {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: var(--dmk-control-height);
  padding: 3px var(--dmk-control-padding-x);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  cursor: pointer;
  transition: border-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-tree-select__control:focus-within {
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-tree-select.is-disabled .dmk-tree-select__control {
  background: var(--dmk-color-surface-hover);
  cursor: not-allowed;
  opacity: 0.7;
}

.dmk-tree-select__tags {
  flex: 1 1 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.dmk-tree-select__input {
  width: 100%;
  height: 28px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dmk-color-text);
  font-family: inherit;
  font-size: inherit;
  cursor: inherit;
}

.dmk-tree-select__input::placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-tree-select__tag {
  padding: 1px 8px;
  border-radius: var(--dmk-radius-sm);
  background: var(--dmk-color-primary-subtle);
  color: var(--dmk-color-primary);
  font-size: 12px;
  line-height: 18px;
}

.dmk-tree-select__tag.is-fold {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-text-muted);
}

.dmk-tree-select__clear {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: var(--dmk-color-text-muted);
  color: var(--dmk-color-surface);
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  cursor: pointer;
}

.dmk-tree-select__arrow {
  flex: 0 0 auto;
  color: var(--dmk-color-text-muted);
  font-size: 11px;
}

.dmk-tree-select__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: var(--dmk-z-popup);
  width: max(100%, 280px);
  max-height: 320px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-tree-select__filter {
  margin-bottom: 8px;
}

.dmk-tree-select__filter-input {
  width: 100%;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  outline: none;
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text);
  font-family: inherit;
  font-size: 13px;
}

.dmk-tree-select__filter-input:focus {
  border-color: var(--dmk-color-primary);
}
</style>
