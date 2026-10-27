<script setup lang="ts">
/**
 * DInputTag —— 标签输入框。
 * 设计要点：回车/逗号/分隔符提交标签，退格删末位；
 * maxTags 限制数量、maxlength 限制单标签长度；输入区随标签自动换行。
 */
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    placeholder?: string
    disabled?: boolean
    /** 单个标签最大长度 */
    maxlength?: number
    /** 最多几个标签 */
    maxTags?: number
    /** 最小长度（低于则不允许提交） */
    minlength?: number
    size?: 'sm' | 'md' | 'lg'
    status?: 'default' | 'success' | 'warning' | 'error'
    clearable?: boolean
    /** 提交分隔符（回车始终有效） */
    separator?: string
    id?: string
    name?: string
    ariaLabel?: string
  }>(),
  {
    modelValue: () => [],
    placeholder: '输入后回车',
    disabled: false,
    maxlength: undefined,
    maxTags: undefined,
    minlength: 0,
    size: 'md',
    status: 'default',
    clearable: false,
    separator: ',',
    id: undefined,
    name: undefined,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  change: [value: string[]]
  input: [value: string[]]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  'remove-tag': [tag: string, index: number]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inner = ref('')

const tags = computed(() => props.modelValue ?? [])

const atMax = computed(() =>
  props.maxTags !== undefined ? tags.value.length >= props.maxTags : false
)

function addTag(raw?: string) {
  const text = (raw ?? inner.value).trim()
  if (!text) return
  if (props.minlength > 0 && text.length < props.minlength) return
  if (props.maxlength !== undefined && text.length > props.maxlength) return
  if (atMax.value) return
  if (tags.value.includes(text)) {
    inner.value = ''
    return
  }
  const next = [...tags.value, text]
  inner.value = ''
  emit('update:modelValue', next)
  emit('input', next)
  emit('change', next)
}

function removeTag(index: number) {
  if (props.disabled) return
  const removed = tags.value[index]
  const next = tags.value.filter((_, i) => i !== index)
  emit('update:modelValue', next)
  emit('input', next)
  emit('change', next)
  emit('remove-tag', removed, index)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag()
  } else if (e.key === 'Backspace' && !inner.value && tags.value.length) {
    removeTag(tags.value.length - 1)
  }
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? ''
  if (!text) return
  const parts = text.split(props.separator).map((s) => s.trim()).filter(Boolean)
  if (parts.length > 1) {
    e.preventDefault()
    for (const p of parts) addTag(p)
  }
}

function clearAll() {
  if (props.disabled) return
  emit('update:modelValue', [])
  emit('input', [])
  emit('change', [])
}

function focus() {
  inputRef.value?.focus()
}
function blur() {
  inputRef.value?.blur()
}

defineExpose({ focus, blur, input: inputRef, addTag, removeTag })
</script>

<template>
  <div
    class="dmk-input-tag"
    :class="[`s-${size}`, `is-${status}`, { 'is-disabled': disabled }]"
    @click="focus()"
  >
    <span v-if="$slots.prefix" class="dmk-input-tag__prefix"><slot name="prefix" /></span>

    <span
      v-for="(tag, i) in tags"
      :key="tag + i"
      class="dmk-input-tag__tag"
    >
      <slot name="tag" :tag="tag" :index="i">{{ tag }}</slot>
      <button
        type="button"
        class="dmk-input-tag__close"
        :disabled="disabled"
        :aria-label="`移除 ${tag}`"
        @click.stop="removeTag(i)"
      >
        <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
          <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" fill="none" stroke="currentColor"
            stroke-width="1.4" stroke-linecap="round" />
        </svg>
      </button>
    </span>

    <input
      ref="inputRef"
      class="dmk-input-tag__input"
      type="text"
      :value="inner"
      :placeholder="tags.length ? '' : placeholder"
      :disabled="disabled || atMax"
      :id="id"
      :name="name"
      :aria-label="ariaLabel"
      @input="inner = ($event.target as HTMLInputElement).value"
      @keydown="onKeydown"
      @paste="onPaste"
      @focus="(e) => emit('focus', e)"
      @blur="(e) => emit('blur', e)"
    />

    <button
      v-if="clearable && tags.length"
      type="button"
      class="dmk-input-tag__clear"
      :disabled="disabled"
      aria-label="清空"
      @click.stop="clearAll()"
    >
      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor"
          stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>

    <span v-if="$slots.suffix" class="dmk-input-tag__suffix"><slot name="suffix" /></span>
  </div>
</template>

<style scoped>
.dmk-input-tag {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: var(--dmk-control-height);
  padding: 4px 8px;
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  font-family: var(--dmk-font-family);
  cursor: text;
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-input-tag:focus-within {
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-input-tag.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dmk-input-tag.is-error {
  border-color: var(--dmk-color-danger);
}

.dmk-input-tag.is-success {
  border-color: var(--dmk-color-success);
}

.dmk-input-tag.is-warning {
  border-color: var(--dmk-color-warning);
}

.dmk-input-tag__prefix,
.dmk-input-tag__suffix {
  display: inline-flex;
  align-items: center;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
}

.dmk-input-tag__tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  padding: 1px 4px 1px 8px;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-primary);
  background: var(--dmk-color-primary-subtle);
  border: 1px solid transparent;
  border-radius: var(--dmk-radius-sm);
}

.dmk-input-tag__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  color: inherit;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.7;
}

.dmk-input-tag__close svg {
  width: 8px;
  height: 8px;
}

.dmk-input-tag__close:hover {
  opacity: 1;
}

.dmk-input-tag__close:focus-visible {
  outline: none;
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-input-tag__input {
  flex: 1;
  min-width: 80px;
  height: 24px;
  padding: 0;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text);
  background: transparent;
  border: none;
  outline: none;
}

.dmk-input-tag__input::placeholder {
  color: var(--dmk-color-text-faint);
}

.dmk-input-tag__clear {
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

.dmk-input-tag__clear svg {
  width: 10px;
  height: 10px;
}

.dmk-input-tag__clear:hover {
  color: var(--dmk-color-text);
}

.dmk-input-tag.s-sm {
  min-height: var(--dmk-control-height-sm);
  padding: 2px 6px;
}

.dmk-input-tag.s-lg {
  min-height: var(--dmk-control-height-lg);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-input-tag {
    transition: none;
  }
}
</style>
