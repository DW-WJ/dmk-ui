<script setup lang="ts">
/**
 * DFormItem —— 表单行（label + 控件 + 错误/提示文案）。
 * error 直接展示外部校验/服务端错误（红色，aria-live 播报）；
 * 必填星号带 aria-hidden，真实语义靠 label 的 for + 控件 required。
 */
import { computed, inject } from 'vue'
import { DFormKey } from './DForm.vue'

withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    /** 校验/服务端错误文案，有值即进入错误态 */
    error?: string
    /** 常驻提示（浅色小字） */
    hint?: string
    /** 关联控件 id（label for） */
    htmlFor?: string
  }>(),
  {
    label: '',
    required: false,
    error: '',
    hint: '',
    htmlFor: undefined
  }
)

const form = inject(DFormKey, null)
const labelPosition = computed(() => form?.labelPosition.value ?? 'left')
const labelWidth = computed(() => form?.labelWidth.value ?? '96px')
</script>

<template>
  <div
    class="dmk-form-item"
    :class="[`lp-${labelPosition}`, { 'is-error': !!error, 'is-required': required }]"
  >
    <label
      v-if="label"
      class="dmk-form-item__label"
      :for="htmlFor"
      :style="labelPosition !== 'top' ? { width: labelWidth, flex: 'none' } : undefined"
    >
      <span v-if="required" class="dmk-form-item__star" aria-hidden="true">*</span>
      {{ label }}
    </label>
    <!-- 无标签的行（如按钮行）：行布局下保留标签列占位，控件列才对齐 -->
    <div
      v-else-if="labelPosition !== 'top'"
      class="dmk-form-item__label"
      aria-hidden="true"
      :style="{ width: labelWidth, flex: 'none' }"
    />
    <div class="dmk-form-item__control">
      <slot />
      <p v-if="error" class="dmk-form-item__error" role="alert" aria-live="polite">{{ error }}</p>
      <p v-else-if="hint" class="dmk-form-item__hint">{{ hint }}</p>
    </div>
  </div>
</template>

<style scoped>
.dmk-form-item {
  display: flex;
  align-items: flex-start;
  gap: var(--dmk-space-md);
  font-family: var(--dmk-font-family);
}

.dmk-form-item.lp-top {
  flex-direction: column;
  gap: var(--dmk-space-xs);
}

.dmk-form-item.lp-right {
  flex-direction: row-reverse;
}

.dmk-form-item__label {
  padding-top: 8px;
  color: var(--dmk-color-text-secondary);
  font-size: var(--dmk-font-base);
  line-height: 1.5;
  text-align: left;
}

.dmk-form-item.lp-right .dmk-form-item__label {
  text-align: right;
}

.dmk-form-item.lp-top .dmk-form-item__label {
  padding-top: 0;
}

.dmk-form-item__star {
  color: var(--dmk-color-danger);
  margin-right: 2px;
}

.dmk-form-item__control {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--dmk-space-xs);
}

.dmk-form-item__error {
  margin: 0;
  color: var(--dmk-color-danger);
  font-size: var(--dmk-font-sm);
  line-height: 1.5;
}

.dmk-form-item__hint {
  margin: 0;
  color: var(--dmk-color-text-muted);
  font-size: var(--dmk-font-sm);
  line-height: 1.5;
}
</style>
