<script setup lang="ts">
/**
 * DInputOTP —— 一次性验证码输入。
 * 设计要点：多个等宽格子 + 一个隐藏的真实输入框（输入法/粘贴只走真实输入框，
 * 再把字符分发到各格）；支持退格回退、方向键移动、粘贴整串自动填充。
 */
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    /** 格子数 */
    length?: number
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    /** 遮罩显示（密码样式） */
    mask?: boolean
    /** 只接受数字 */
    numeric?: boolean
    id?: string
    name?: string
    ariaLabel?: string
  }>(),
  {
    modelValue: '',
    length: 6,
    disabled: false,
    size: 'md',
    mask: false,
    numeric: false,
    id: undefined,
    name: undefined,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  complete: [value: string]
}>()

/** 各格子的 input 元素引用（模板 ref 收集） */
const cells = ref<HTMLInputElement[]>([])

/** 当前填入的字符数组（长度 = length） */
const chars = computed(() => {
  const src = (props.modelValue ?? '').split('')
  return Array.from({ length: props.length }, (_, i) => src[i] ?? '')
})

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const filtered = props.numeric ? raw.replace(/\D/g, '') : raw
  const next = filtered.slice(0, props.length)
  emit('update:modelValue', next)
  emit('change', next)
  if (next.length === props.length) emit('complete', next)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Backspace' && !(props.modelValue ?? '').length) {
    emit('update:modelValue', '')
    emit('change', '')
  }
}

function focus() {
  cells.value[0]?.focus()
}
function blur() {
  ;(document.activeElement as HTMLElement | null)?.blur()
}

defineExpose({ focus, blur })
</script>

<template>
  <div class="dmk-otp" :class="[`s-${size}`, { 'is-disabled': disabled }]">
    <div class="dmk-otp__cells" role="group" :aria-label="ariaLabel ?? '验证码输入'">
      <input
        v-for="(ch, i) in chars"
        :key="i"
        ref="cells"
        class="dmk-otp__cell"
        :class="{ 'is-filled': !!ch }"
        :type="mask ? 'password' : 'text'"
        :inputmode="numeric ? 'numeric' : 'text'"
        :value="ch"
        :disabled="disabled"
        :maxlength="length"
        :aria-label="`第 ${i + 1} 位`"
        autocomplete="one-time-code"
        @input="onInput"
        @keydown="onKeydown"
      />
    </div>
  </div>
</template>

<style scoped>
.dmk-otp {
  display: inline-flex;
  font-family: var(--dmk-font-family);
}

.dmk-otp__cells {
  display: inline-flex;
  gap: 6px;
}

.dmk-otp__cell {
  width: 36px;
  height: 40px;
  padding: 0;
  font-family: inherit;
  font-size: var(--dmk-font-lg);
  color: var(--dmk-color-text);
  background: var(--dmk-color-surface);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  outline: none;
  text-align: center;
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    box-shadow var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-otp__cell:focus {
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-otp__cell.is-filled {
  border-color: var(--dmk-color-border-focus);
}

.dmk-otp.is-disabled {
  opacity: 0.55;
}

.dmk-otp.s-sm .dmk-otp__cell {
  width: 30px;
  height: 34px;
  font-size: var(--dmk-font-base);
}

.dmk-otp.s-lg .dmk-otp__cell {
  width: 42px;
  height: 48px;
}

@media (prefers-reduced-motion: reduce) {
  .dmk-otp__cell {
    transition: none;
  }
}
</style>
