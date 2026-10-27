<script setup lang="ts">
/**
 * DUpload —— 文件上传。
 * 设计要点：拖拽区 + 文件列表；组件不内置网络请求，
 * 选中文件后交给父组件的 httpRequest / beforeUpload 处理（与 EP 同思路）。
 */
import { computed, ref } from 'vue'

export interface UploadFile {
  name: string
  size?: number
  status?: 'ready' | 'uploading' | 'success' | 'error'
  url?: string
  raw?: File
}

const props = withDefaults(
  defineProps<{
    /** 已上传/待上传的文件列表 */
    fileList?: UploadFile[]
    /** 列表样式 */
    listType?: 'text' | 'picture-card'
    multiple?: boolean
    accept?: string
    /** 最多几个文件 */
    limit?: number
    /** 拖拽上传 */
    drag?: boolean
    disabled?: boolean
    /** 选择文件前的钩子：返回 false 可阻止 */
    beforeUpload?: (file: File) => boolean | Promise<boolean>
    /** 父组件接管上传逻辑 */
    httpRequest?: (file: File) => void | Promise<void>
    id?: string
    ariaLabel?: string
  }>(),
  {
    fileList: () => [],
    listType: 'text',
    multiple: false,
    accept: undefined,
    limit: undefined,
    drag: false,
    disabled: false,
    beforeUpload: undefined,
    httpRequest: undefined,
    id: undefined,
    ariaLabel: undefined
  }
)

const emit = defineEmits<{
  change: [file: UploadFile, fileList: UploadFile[]]
  success: [file: UploadFile]
  error: [file: UploadFile]
  progress: [file: UploadFile, percent: number]
  exceed: [files: File[]]
  remove: [file: UploadFile]
  preview: [file: UploadFile]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const innerList = ref<UploadFile[]>([...props.fileList])

function syncList(files: UploadFile[]) {
  innerList.value = files
  emit('change', files[files.length - 1], files)
}

async function handleFiles(files: File[]) {
  if (!files.length) return
  if (props.limit !== undefined && innerList.value.length + files.length > props.limit) {
    emit('exceed', files)
    return
  }
  for (const raw of files) {
    if (props.beforeUpload) {
      const pass = await props.beforeUpload(raw)
      if (!pass) continue
    }
    const file: UploadFile = { name: raw.name, size: raw.size, status: 'ready', raw }
    syncList([...innerList.value, file])
    emit('progress', file, 0)
    if (props.httpRequest) {
      try {
        await props.httpRequest(raw)
        file.status = 'success'
        emit('success', file)
      } catch {
        file.status = 'error'
        emit('error', file)
      }
    }
  }
}

function onPick(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  void handleFiles(files)
  ;(e.target as HTMLInputElement).value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  if (props.disabled) return
  const files = Array.from(e.dataTransfer?.files ?? [])
  void handleFiles(files)
}

function removeFile(file: UploadFile) {
  const next = innerList.value.filter((f) => f !== file)
  innerList.value = next
  emit('remove', file)
}

function openPicker() {
  if (!props.disabled) inputRef.value?.click()
}

function formatSize(size?: number) {
  if (!size) return ''
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / 1024 / 1024).toFixed(1) + ' MB'
}

const hint = computed(() =>
  props.limit === undefined ? '' : `最多上传 ${props.limit} 个文件`
)

defineExpose({ openPicker, clear: () => (innerList.value = []), fileList: innerList })
</script>

<template>
  <div class="dmk-upload" :class="[`is-${listType}`, { 'is-disabled': disabled }]">
    <!-- 拖拽区 / 触发器 -->
    <div
      v-if="drag"
      class="dmk-upload__drop"
      :class="{ 'is-dragging': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="openPicker"
    >
      <slot name="drop">
        <p class="dmk-upload__drop-title">将文件拖到此处，或<em>点击上传</em></p>
        <p class="dmk-upload__drop-hint">{{ hint || '支持任意格式' }}</p>
      </slot>
    </div>

    <div v-else class="dmk-upload__trigger" @click="openPicker">
      <slot name="trigger">
        <button type="button" class="dmk-upload__btn" :disabled="disabled">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M8 11V3M4.5 6.5 8 3l3.5 3.5M2.5 11v1.5h11V11" fill="none"
              stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          选择文件
        </button>
      </slot>
    </div>

    <input
      ref="inputRef"
      class="dmk-upload__input"
      type="file"
      :multiple="multiple"
      :accept="accept"
      :disabled="disabled"
      :id="id"
      :aria-label="ariaLabel ?? '文件上传'"
      @change="onPick"
    />

    <!-- 文件列表 -->
    <ul v-if="innerList.length" class="dmk-upload__list">
      <li v-for="f in innerList" :key="f.name" class="dmk-upload__file">
        <span class="dmk-upload__name" :title="f.name">{{ f.name }}</span>
        <span v-if="formatSize(f.size)" class="dmk-upload__size">{{ formatSize(f.size) }}</span>
        <span class="dmk-upload__status" :class="`is-${f.status ?? 'ready'}`">
          {{ f.status === 'success' ? '成功' : f.status === 'error' ? '失败' : '待上传' }}
        </span>
        <button
          type="button"
          class="dmk-upload__remove"
          :disabled="disabled"
          :aria-label="`移除 ${f.name}`"
          @click="removeFile(f)"
        >
          <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
            <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" fill="none" stroke="currentColor"
              stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </button>
      </li>
    </ul>

    <p v-if="$slots.tip || hint" class="dmk-upload__tip">
      <slot name="tip">{{ hint }}</slot>
    </p>
  </div>
</template>

<style scoped>
.dmk-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--dmk-font-family);
}

.dmk-upload.is-disabled {
  opacity: 0.55;
}

.dmk-upload__input {
  display: none;
}

.dmk-upload__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  font-family: inherit;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-on-primary);
  background: var(--dmk-color-primary);
  border: 1px solid var(--dmk-color-primary);
  border-radius: var(--dmk-radius-md);
  cursor: pointer;
}

.dmk-upload__btn svg {
  width: 14px;
  height: 14px;
}

.dmk-upload__btn:hover:not(:disabled) {
  background: var(--dmk-color-primary-hover);
}

.dmk-upload__btn:disabled {
  cursor: not-allowed;
}

.dmk-upload__drop {
  padding: 24px;
  border: 1px dashed var(--dmk-color-border-strong);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-bg);
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--dmk-duration-fast) var(--dmk-ease),
    background-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-upload__drop.is-dragging {
  border-color: var(--dmk-color-primary);
  background: var(--dmk-color-primary-subtle);
}

.dmk-upload__drop-title {
  margin: 0;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-secondary);
}

.dmk-upload__drop-title em {
  font-style: normal;
  color: var(--dmk-color-primary);
}

.dmk-upload__drop-hint {
  margin: 4px 0 0;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-faint);
}

.dmk-upload__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dmk-upload__file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: var(--dmk-font-sm);
  background: var(--dmk-color-bg);
  border: 1px solid var(--dmk-color-border-subtle);
  border-radius: var(--dmk-radius-sm);
}

.dmk-upload__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dmk-color-text);
}

.dmk-upload__size {
  color: var(--dmk-color-text-faint);
  font-size: var(--dmk-font-sm);
}

.dmk-upload__status.is-success {
  color: var(--dmk-color-success);
}

.dmk-upload__status.is-error {
  color: var(--dmk-color-danger);
}

.dmk-upload__status.is-ready {
  color: var(--dmk-color-text-muted);
}

.dmk-upload__remove {
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

.dmk-upload__remove svg {
  width: 8px;
  height: 8px;
}

.dmk-upload__remove:hover {
  color: var(--dmk-color-danger);
}

.dmk-upload__tip {
  margin: 0;
  font-size: var(--dmk-font-sm);
  color: var(--dmk-color-text-faint);
}

@media (prefers-reduced-motion: reduce) {
  .dmk-upload__drop {
    transition: none;
  }
}
</style>
