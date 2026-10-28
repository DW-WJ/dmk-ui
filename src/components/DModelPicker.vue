<script setup lang="ts">
/**
 * DModelPicker —— AI 模型选择器。
 *
 * 场景：输入框旁选模型（GPT-4o / Claude / DeepSeek / 本地模型…）。
 * 关键设计：
 *   · 分组展示（厂商 / 来源：官方 / 本地 / 第三方网关）
 *   · 每项可带能力标签（视觉 / 工具调用 / 长上下文 / 快速）
 *   · 紧凑模式（只显示当前选中）与展开模式（下拉列表）
 *   · 键盘可达：↑↓ 移动、Enter 选中、Esc 关闭
 *
 * 无障碍：
 *   · 触发按钮 role="combobox" + aria-expanded / aria-haspopup="listbox"
 *   · 列表 role="listbox"，选项 role="option" + aria-selected
 *   · 选中变化用 aria-live 播报
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

export interface ModelOption {
  /** 模型 id（回传给业务方） */
  value: string
  /** 展示名 */
  label: string
  /** 厂商 */
  vendor?: string
  /** 能力标签 */
  capabilities?: string[]
  /** 备注（如「本地部署」「需订阅」） */
  note?: string
  /** 是否禁用 */
  disabled?: boolean
}

export interface ModelGroup {
  /** 分组名 */
  name: string
  options: ModelOption[]
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    /** 分组后的模型列表 */
    groups?: ModelGroup[]
    /** 扁平列表（与 groups 二选一） */
    options?: ModelOption[]
    placeholder?: string
    disabled?: boolean
    /** 显示厂商名 */
    showVendor?: boolean
    ariaLabel?: string
  }>(),
  {
    modelValue: '',
    groups: () => [],
    options: () => [],
    placeholder: '选择模型',
    disabled: false,
    showVendor: true,
    ariaLabel: '模型选择'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const open = ref(false)
const activeIndex = ref(-1)
const rootRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

/** 统一成分组结构：扁平列表走「默认」组 */
const groups = computed<ModelGroup[]>(() => {
  if (props.groups.length) return props.groups
  if (props.options.length) return [{ name: '', options: props.options }]
  return []
})

/** 摊平后的可选项（键盘导航按这个顺序） */
const flat = computed(() => groups.value.flatMap((g) => g.options))

/** 当前选中项 */
const current = computed(() => flat.value.find((o) => o.value === props.modelValue))

/** 触发按钮上的文案 */
const displayText = computed(() => current.value?.label ?? props.placeholder)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    const idx = flat.value.findIndex((o) => o.value === props.modelValue)
    activeIndex.value = idx >= 0 ? idx : 0
  }
}

function select(opt: ModelOption) {
  if (opt.disabled) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      toggle()
    }
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    move(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const opt = flat.value[activeIndex.value]
    if (opt) select(opt)
  }
}

/** 键盘移动：跳过禁用项 */
function move(step: number) {
  const list = flat.value
  if (!list.length) return
  let i = activeIndex.value
  for (let n = 0; n < list.length; n++) {
    i = (i + step + list.length) % list.length
    if (!list[i].disabled) break
  }
  activeIndex.value = i
  scrollActiveIntoView()
}

function scrollActiveIntoView() {
  nextTick(() => {
    const list = listRef.value
    const el = list?.querySelector<HTMLElement>('.is-active')
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

watch(open, (v) => {
  if (v) document.addEventListener('click', onDocClick)
  else document.removeEventListener('click', onDocClick)
})

onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div
    ref="rootRef"
    class="dmk-model"
    @keydown="onKeydown"
  >
    <!-- 触发按钮 -->
    <button
      type="button"
      class="dmk-model__trigger"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-disabled="disabled"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="dmk-model__label">{{ displayText }}</span>
      <span
        v-if="showVendor && current?.vendor"
        class="dmk-model__vendor"
      >{{ current.vendor }}</span>
      <span class="dmk-model__caret" aria-hidden="true"></span>
    </button>

    <!-- 下拉列表 -->
    <div
      v-if="open"
      ref="listRef"
      class="dmk-model__panel"
      role="listbox"
      :aria-label="ariaLabel"
    >
      <div
        v-for="(g, gi) in groups"
        :key="gi"
        class="dmk-model__group"
      >
        <div
          v-if="g.name"
          class="dmk-model__group-name"
        >{{ g.name }}</div>
        <div
          v-for="opt in g.options"
          :key="opt.value"
          class="dmk-model__option"
          :class="{
            'is-selected': opt.value === modelValue,
            'is-active': flat.indexOf(opt) === activeIndex,
            'is-disabled': opt.disabled
          }"
          role="option"
          :aria-selected="opt.value === modelValue"
          :aria-disabled="opt.disabled || undefined"
          @click="select(opt)"
          @mouseenter="activeIndex = flat.indexOf(opt)"
        >
          <div class="dmk-model__opt-main">
            <span class="dmk-model__opt-label">{{ opt.label }}</span>
            <span
              v-if="showVendor && opt.vendor"
              class="dmk-model__opt-vendor"
            >{{ opt.vendor }}</span>
          </div>
          <div
            v-if="opt.note"
            class="dmk-model__opt-note"
          >{{ opt.note }}</div>
          <div
            v-if="opt.capabilities?.length"
            class="dmk-model__opt-caps"
          >
            <span
              v-for="cap in opt.capabilities"
              :key="cap"
              class="dmk-model__cap"
            >{{ cap }}</span>
          </div>
        </div>
      </div>
    </div>

    <span class="sr-only" aria-live="polite">
      {{ current ? `已选择模型 ${current.label}` : '' }}
    </span>
  </div>
</template>

<style scoped>
.dmk-model {
  position: relative;
  display: inline-block;
  font-family: var(--dmk-font-family);
}

.dmk-model__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-text-primary);
  font-size: var(--dmk-font-sm);
  font-family: inherit;
  cursor: pointer;
}

.dmk-model__trigger:hover:not(:disabled) {
  border-color: var(--dmk-color-border-strong);
}

.dmk-model__trigger:focus-visible {
  outline: 2px solid var(--dmk-color-primary);
  outline-offset: 1px;
}

.dmk-model__trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-model__label {
  font-weight: 500;
}

.dmk-model__vendor {
  font-size: 12px;
  color: var(--dmk-text-tertiary);
}

.dmk-model__caret {
  width: 0;
  height: 0;
  border-left: 4px solid currentColor;
  border-top: 3.5px solid transparent;
  border-bottom: 3.5px solid transparent;
  opacity: 0.6;
}

/* —— 面板 —— */
.dmk-model__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 20;
  min-width: 240px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
}

.dmk-model__group + .dmk-model__group {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--dmk-color-border);
}

.dmk-model__group-name {
  font-size: 11px;
  color: var(--dmk-text-tertiary);
  padding: 6px 8px 4px;
}

.dmk-model__option {
  padding: 6px 8px;
  border-radius: var(--dmk-radius-md);
  cursor: pointer;
}

.dmk-model__option.is-active {
  background: var(--dmk-color-fill);
}

.dmk-model__option.is-selected {
  background: var(--dmk-color-primary-subtle);
}

.dmk-model__option.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dmk-model__opt-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.dmk-model__opt-label {
  font-size: var(--dmk-font-sm);
  color: var(--dmk-text-primary);
  font-weight: 500;
}

.dmk-model__opt-vendor {
  font-size: 11px;
  color: var(--dmk-text-tertiary);
}

.dmk-model__opt-note {
  font-size: 11px;
  color: var(--dmk-text-tertiary);
  margin-top: 1px;
}

.dmk-model__opt-caps {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.dmk-model__cap {
  font-size: 10px;
  color: var(--dmk-text-secondary);
  background: var(--dmk-color-fill);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 16px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
