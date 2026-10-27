<script setup lang="ts">
/**
 * DTransfer —— 穿梭框。
 * 设计要点：左右两栏 + 中间按钮组；左栏可勾选/全选，勾选后点按钮移动到右栏；
 * 支持筛选（filterable）、字段名映射（props）、单向模式（oneWay）。
 */
import { computed, ref } from 'vue'

export interface TransferItem {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    /** 已选中的值（右边） */
    modelValue?: Array<string | number>
    /** 源数据（左边） */
    data?: TransferItem[]
    /** 字段映射（对应 EP 的 props） */
    keyName?: string
    labelName?: string
    disabledName?: string
    leftTitle?: string
    rightTitle?: string
    /** 左侧可筛选 */
    filterable?: boolean
    filterPlaceholder?: string
    disabled?: boolean
    /** 单向：只允许左 → 右 */
    oneWay?: boolean
    size?: 'sm' | 'md' | 'lg'
    ariaLabel?: string
  }>(),
  {
    modelValue: () => [],
    data: () => [],
    keyName: 'value',
    labelName: 'label',
    disabledName: 'disabled',
    leftTitle: '待选列表',
    rightTitle: '已选列表',
    filterable: false,
    filterPlaceholder: '请输入搜索',
    disabled: false,
    oneWay: false,
    size: 'md',
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: Array<string | number>]
  change: [value: Array<string | number>]
  'left-check-change': [checked: Array<string | number>]
  'right-check-change': [checked: Array<string | number>]
}>()

const leftChecked = ref<Array<string | number>>([])
const rightChecked = ref<Array<string | number>>([])
const keyword = ref('')

const keyOf = (item: Record<string, unknown>) => item[props.keyName] as string | number
const labelOf = (item: Record<string, unknown>) => String(item[props.labelName] ?? '')
const disabledOf = (item: Record<string, unknown>) => Boolean(item[props.disabledName])

const selected = computed(() => props.modelValue ?? [])

/**
 * 键比较做类型归一：modelValue 传 '2'、data 里 value 是数字 2 时，
 * 严格相等会判为不等 → 已选项不会被移出左栏（2026-10-27 修的真 bug）。
 */
const selectedKeys = computed(() => new Set(selected.value.map((v) => String(v))))
const isSelected = (it: Record<string, unknown>) => selectedKeys.value.has(String(keyOf(it)))

const leftList = computed(() => {
  const src = props.data as unknown as Record<string, unknown>[]
  const rest = src.filter((it) => !isSelected(it))
  if (!keyword.value.trim()) return rest
  const q = keyword.value.trim().toLowerCase()
  return rest.filter((it) => labelOf(it).toLowerCase().includes(q))
})

const rightList = computed(() => {
  const src = props.data as unknown as Record<string, unknown>[]
  return src.filter((it) => isSelected(it))
})

const leftAllChecked = computed(
  () => leftList.value.length > 0 && leftChecked.value.length === leftList.value.length
)

function toggleLeft(item: Record<string, unknown>) {
  if (disabledOf(item)) return
  const k = keyOf(item)
  const i = leftChecked.value.indexOf(k)
  if (i >= 0) leftChecked.value.splice(i, 1)
  else leftChecked.value.push(k)
  emit('left-check-change', [...leftChecked.value])
}

function toggleRight(item: Record<string, unknown>) {
  const k = keyOf(item)
  const i = rightChecked.value.indexOf(k)
  if (i >= 0) rightChecked.value.splice(i, 1)
  else rightChecked.value.push(k)
  emit('right-check-change', [...rightChecked.value])
}

function toggleLeftAll() {
  const selectable = leftList.value.filter((it) => !disabledOf(it)).map(keyOf)
  leftChecked.value = leftAllChecked.value ? [] : selectable
  emit('left-check-change', [...leftChecked.value])
}

function moveToRight() {
  if (!leftChecked.value.length || props.disabled) return
  const existing = new Set(selected.value.map((v) => String(v)))
  const next = [...selected.value]
  for (const v of leftChecked.value) {
    if (!existing.has(String(v))) {
      next.push(v)
      existing.add(String(v))
    }
  }
  emit('update:modelValue', next)
  emit('change', next)
  leftChecked.value = []
}

function moveToLeft() {
  if (!rightChecked.value.length || props.disabled || props.oneWay) return
  const removing = new Set(rightChecked.value.map((v) => String(v)))
  const next = selected.value.filter((v) => !removing.has(String(v)))
  emit('update:modelValue', next)
  emit('change', next)
  rightChecked.value = []
}

defineExpose({
  moveToRight,
  moveToLeft,
  clearLeftChecked: () => (leftChecked.value = []),
  clearRightChecked: () => (rightChecked.value = [])
})
</script>

<template>
  <div class="dmk-transfer" :class="[`s-${size}`, { 'is-disabled': disabled }]">
    <!-- 左栏 -->
    <section class="dmk-transfer__panel" :aria-label="leftTitle">
      <header class="dmk-transfer__header">
        <slot name="left-header" :count="selected.length">
          <span class="dmk-transfer__title">{{ leftTitle }}</span>
          <span class="dmk-transfer__count">{{ selected.length }}</span>
        </slot>
      </header>
      <div v-if="filterable" class="dmk-transfer__filter">
        <input
          v-model="keyword"
          class="dmk-transfer__filter-input"
          type="text"
          :placeholder="filterPlaceholder"
          :aria-label="filterPlaceholder"
        />
      </div>
      <div class="dmk-transfer__list" role="listbox" :aria-label="leftTitle" :aria-multiselectable="true">
        <label class="dmk-transfer__item">
          <input
            type="checkbox"
            class="dmk-transfer__check"
            :checked="leftAllChecked"
            :disabled="disabled"
            @change="toggleLeftAll"
          />
          <span class="dmk-transfer__label">全选</span>
        </label>
        <label
          v-for="item in leftList"
          :key="String(keyOf(item))"
          class="dmk-transfer__item"
          :class="{ 'is-disabled': disabledOf(item) }"
        >
          <input
            type="checkbox"
            class="dmk-transfer__check"
            :checked="leftChecked.includes(keyOf(item))"
            :disabled="disabled || disabledOf(item)"
            @change="toggleLeft(item)"
          />
          <span class="dmk-transfer__label">
            <slot name="item" :item="item">{{ labelOf(item) }}</slot>
          </span>
        </label>
        <p v-if="!leftList.length" class="dmk-transfer__empty">无数据</p>
      </div>
    </section>

    <!-- 中间按钮 -->
    <div class="dmk-transfer__actions">
      <button
        type="button"
        class="dmk-transfer__btn"
        :disabled="disabled || !leftChecked.length"
        aria-label="移到右边"
        @click="moveToRight"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        class="dmk-transfer__btn"
        :disabled="disabled || oneWay || !rightChecked.length"
        aria-label="移到左边"
        @click="moveToLeft"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M13 8H4M7.5 4l-4 4 4 4" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <!-- 右栏 -->
    <section class="dmk-transfer__panel" :aria-label="rightTitle">
      <header class="dmk-transfer__header">
        <slot name="right-header" :count="selected.length">
          <span class="dmk-transfer__title">{{ rightTitle }}</span>
          <span class="dmk-transfer__count">{{ selected.length }}</span>
        </slot>
      </header>
      <div class="dmk-transfer__list" role="listbox" :aria-label="rightTitle" :aria-multiselectable="true">
        <label
          v-for="item in rightList"
          :key="String(keyOf(item))"
          class="dmk-transfer__item"
        >
          <input
            type="checkbox"
            class="dmk-transfer__check"
            :checked="rightChecked.includes(keyOf(item))"
            :disabled="disabled"
            @change="toggleRight(item)"
          />
          <span class="dmk-transfer__label">
            <slot name="item" :item="item">{{ labelOf(item) }}</slot>
          </span>
        </label>
        <p v-if="!rightList.length" class="dmk-transfer__empty">未选择</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dmk-transfer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: start;
  font-family: var(--dmk-font-family);
}

.dmk-transfer.is-disabled {
  opacity: 0.6;
}

.dmk-transfer__panel {
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  overflow: hidden;
}

.dmk-transfer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: var(--dmk-color-bg);
  border-bottom: 1px solid var(--dmk-color-border-subtle);
}

.dmk-transfer__title {
  font-size: var(--dmk-font-sm);
  font-weight: 600;
  color: var(--dmk-color-text);
}

.dmk-transfer__count {
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-muted);
}

.dmk-transfer__filter {
  padding: 6px 8px;
  border-bottom: 1px solid var(--dmk-color-border-subtle);
}

.dmk-transfer__filter-input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  background: var(--dmk-color-bg);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-sm);
  outline: none;
}

.dmk-transfer__filter-input:focus {
  border-color: var(--dmk-color-primary);
}

.dmk-transfer__list {
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
}

.dmk-transfer__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  cursor: pointer;
}

.dmk-transfer__item:hover {
  background: var(--dmk-color-surface-hover);
}

.dmk-transfer__item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dmk-transfer__check {
  width: 14px;
  height: 14px;
  accent-color: var(--dmk-color-primary);
  cursor: inherit;
}

.dmk-transfer__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmk-transfer__empty {
  margin: 0;
  padding: 16px 12px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-faint);
  text-align: center;
}

.dmk-transfer__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 44px;
}

.dmk-transfer__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--dmk-color-primary);
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  cursor: pointer;
  transition:
    background-color var(--dmk-duration-fast) var(--dmk-ease),
    border-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-transfer__btn svg {
  width: 15px;
  height: 15px;
}

.dmk-transfer__btn:hover:not(:disabled) {
  background: var(--dmk-color-primary-subtle);
  border-color: var(--dmk-color-primary);
}

.dmk-transfer__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dmk-transfer__btn:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-transfer__btn {
    transition: none;
  }
}
</style>
