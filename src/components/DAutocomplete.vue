<script setup lang="ts">
/**
 * DAutocomplete —— 自动补全。
 * 设计要点：输入即过滤（或走远程 fetchSuggestions）；↑↓ 选择、Enter 确认、Esc 关闭；
 * 建议项用 role=option + aria-activedescendant 关联输入框。
 */
import { computed, ref, watch } from 'vue'

export interface AutocompleteOption {
  label: string
  value: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    /** 候选项：字符串数组或对象数组 */
    options?: Array<string | AutocompleteOption>
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    size?: 'sm' | 'md' | 'lg'
    status?: 'default' | 'success' | 'warning' | 'error'
    /** 远程搜索：返回候选；给了就走远程，不再本地过滤 */
    fetchSuggestions?: (query: string) => void | Promise<void>
    /** 最多显示几条建议 */
    limit?: number
    /** 聚焦时展开建议 */
    triggerOnFocus?: boolean
    id?: string
    name?: string
    ariaLabel?: string
  }>(),
  {
    modelValue: '',
    options: () => [],
    placeholder: '请输入',
    disabled: false,
    clearable: false,
    size: 'md',
    status: 'default',
    fetchSuggestions: undefined,
    limit: 10,
    triggerOnFocus: true,
    id: undefined,
    name: undefined,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  input: [value: string]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  select: [value: string]
  clear: []
  open: []
  close: []
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const visible = ref(false)
const activeIndex = ref(-1)
const inner = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    if (v !== inner.value) inner.value = v
  }
)

const normalized = computed<AutocompleteOption[]>(() =>
  props.options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o
  )
)

const isRemote = computed(() => typeof props.fetchSuggestions === 'function')

/**
 * 远程模式：候选由父组件通过 options 提供，组件不做本地过滤（EP 同思路）；
 * 本地模式：按 label 实时过滤。
 */
const suggestions = computed<AutocompleteOption[]>(() => {
  const src = normalized.value
  if (isRemote.value) return src.slice(0, props.limit)
  const q = inner.value.trim().toLowerCase()
  if (!q) return props.triggerOnFocus ? src.slice(0, props.limit) : []
  return src.filter((o) => o.label.toLowerCase().includes(q)).slice(0, props.limit)
})

const listboxId = 'dmk-autocomplete-listbox'

function openPanel() {
  if (props.disabled) return
  // 面板已展开时也要继续触发远程请求 ——
  // 否则用户聚焦后继续输入，候选不会刷新（2026-10-27 修的真 bug）
  if (!visible.value) {
    visible.value = true
    activeIndex.value = -1
    emit('open')
  }
  if (isRemote.value) void props.fetchSuggestions?.(inner.value)
}

function closePanel() {
  if (!visible.value) return
  visible.value = false
  activeIndex.value = -1
  emit('close')
}

function onInput(e: Event) {
  inner.value = (e.target as HTMLInputElement).value
  emit('update:modelValue', inner.value)
  emit('input', inner.value)
  // 远程请求统一由 openPanel 负责（避免重复触发）
  openPanel()
}

function pick(opt: AutocompleteOption) {
  if (opt.disabled) return
  inner.value = opt.value
  emit('update:modelValue', opt.value)
  emit('input', opt.value)
  emit('change', opt.value)
  emit('select', opt.value)
  closePanel()
}

function onKeydown(e: KeyboardEvent) {
  const list = suggestions.value
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!visible.value) {
      openPanel()
      return
    }
    activeIndex.value = Math.min(activeIndex.value + 1, list.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    if (visible.value && activeIndex.value >= 0 && list[activeIndex.value]) {
      e.preventDefault()
      pick(list[activeIndex.value])
    } else {
      closePanel()
      emit('change', inner.value)
    }
  } else if (e.key === 'Escape') {
    closePanel()
  }
}

function clear() {
  inner.value = ''
  emit('update:modelValue', '')
  emit('input', '')
  emit('change', '')
  emit('clear')
  inputRef.value?.focus()
}

function onDocPointerDown(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) closePanel()
}

watch(visible, (v) => {
  if (v) document.addEventListener('mousedown', onDocPointerDown, true)
  else document.removeEventListener('mousedown', onDocPointerDown, true)
})

function focus() {
  inputRef.value?.focus()
}
function blur() {
  inputRef.value?.blur()
}

defineExpose({ focus, blur })
</script>

<template>
  <div ref="rootRef" class="dmk-autocomplete" :class="[`s-${size}`, { 'is-disabled': disabled }]">
    <span class="dmk-autocomplete__field">
      <span v-if="$slots.prefix" class="dmk-autocomplete__prefix"><slot name="prefix" /></span>
      <input
        ref="inputRef"
        class="dmk-autocomplete__input"
        type="text"
        role="combobox"
        :value="inner"
        :placeholder="placeholder"
        :disabled="disabled"
        :id="id"
        :name="name"
        :aria-label="ariaLabel"
        aria-autocomplete="list"
        :aria-expanded="visible"
        :aria-controls="listboxId"
        :aria-activedescendant="
          visible && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
        "
        @input="onInput"
        @focus="(e) => { emit('focus', e); if (triggerOnFocus) openPanel() }"
        @blur="(e) => emit('blur', e)"
        @keydown="onKeydown"
      />
      <button
        v-if="clearable && inner"
        type="button"
        class="dmk-autocomplete__clear"
        :disabled="disabled"
        aria-label="清空"
        @click="clear()"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <span v-if="$slots.suffix" class="dmk-autocomplete__suffix"><slot name="suffix" /></span>
    </span>

    <Transition name="pop">
      <div v-if="visible" :id="listboxId" class="dmk-autocomplete__panel" role="listbox">
        <div v-if="!suggestions.length" class="dmk-autocomplete__empty">
          <slot name="empty">无匹配数据</slot>
        </div>
        <div
          v-for="(opt, i) in suggestions"
          :key="opt.value + i"
          :id="`${listboxId}-opt-${i}`"
          class="dmk-autocomplete__option"
          :class="{ 'is-active': i === activeIndex, 'is-disabled': opt.disabled }"
          role="option"
          :aria-selected="i === activeIndex"
          @mousedown.prevent
          @click="pick(opt)"
          @mouseenter="activeIndex = i"
        >
          <slot name="option" :option="opt">{{ opt.label }}</slot>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dmk-autocomplete {
  position: relative;
  display: inline-block;
  width: 100%;
  font-family: var(--dmk-font-family);
}

.dmk-autocomplete__field {
  display: flex;
  align-items: center;
  gap: 6px;
  height: var(--dmk-control-height);
  padding: 0 var(--dmk-space-sm);
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-autocomplete__field:focus-within {
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-autocomplete.is-disabled {
  opacity: 0.55;
}

.dmk-autocomplete__prefix,
.dmk-autocomplete__suffix {
  display: inline-flex;
  align-items: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

.dmk-autocomplete__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  background: transparent;
  border: none;
  outline: none;
}

.dmk-autocomplete__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  color: var(--dmk-color-text-muted);
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.dmk-autocomplete__clear svg {
  width: 10px;
  height: 10px;
}

.dmk-autocomplete__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: var(--dmk-z-popup);
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  box-shadow: var(--dmk-shadow-md);
}

.dmk-autocomplete__option {
  padding: 6px 10px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  border-radius: var(--dmk-radius-sm);
  cursor: pointer;
}

.dmk-autocomplete__option.is-active {
  color: var(--dmk-color-primary);
  background: var(--dmk-color-primary-subtle);
}

.dmk-autocomplete__option.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dmk-autocomplete__empty {
  padding: 10px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-faint);
  text-align: center;
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity var(--dmk-duration-fast) var(--dmk-ease),
    transform var(--dmk-duration-fast) var(--dmk-ease);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-autocomplete__field,
  .pop-enter-active,
  .pop-leave-active {
    transition: none;
  }
}
</style>
