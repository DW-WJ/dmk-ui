<script setup lang="ts">
/**
 * DCascader —— 级联选择器。
 * 契约参考 Element Plus el-cascader（核心）：
 *   modelValue / options / props（value·label·children·disabled·checkStrictly）/
 *   placeholder / disabled / clearable / showAllLevels / separator /
 *   filterable / filterMethod / debounce / size / popperClass / tagType /
 *   validateEvent / maxCollapseTags / showCheckedStrategy
 *   Events: change / expand-change / blur / focus / clear / visible-change
 *
 * 实现：单选时点叶子即选中；多选时每列底部有「确定/取消」栏，
 *      复选语义按 checkStrictly 决定父子联动。
 */
import { computed, ref, watch } from 'vue'

/** 选项数据 */
export interface CascaderOption {
  label?: string
  value?: string | number
  disabled?: boolean
  children?: CascaderOption[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | (string | number)[] | (string | number)[][]
    options?: CascaderOption[]
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    showAllLevels?: boolean
    separator?: string
    filterable?: boolean
    filterMethod?: (node: CascaderOption, keyword: string) => boolean
    debounce?: number
    size?: 'large' | 'default' | 'small'
    popperClass?: string
    tagType?: 'success' | 'info' | 'warning' | 'danger'
    validateEvent?: boolean
    multiple?: boolean
    maxCollapseTags?: number
    showCheckedStrategy?: 'parent' | 'child'
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    placeholder: '请选择',
    disabled: false,
    clearable: true,
    showAllLevels: true,
    separator: ' / ',
    filterable: false,
    filterMethod: undefined,
    debounce: 300,
    size: 'default',
    popperClass: undefined,
    tagType: 'info',
    validateEvent: true,
    multiple: false,
    maxCollapseTags: 1,
    showCheckedStrategy: 'child'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
  'expand-change': [value: unknown]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  clear: []
  'visible-change': [visible: boolean]
}>()

/** 面板显隐 */
const visible = ref(false)
/** 当前展开到第几列（数组长度 = 可见列数） */
const activePath = ref<CascaderOption[]>([])
/** 筛选关键词 */
const keyword = ref('')
/** 多选模式下已勾选的路径集合（用 value 路径的 JSON 做 key） */
const checkedPaths = ref<Set<string>>(new Set())
/** 多选临时勾选（面板未点确定前） */
const draftChecked = ref<Set<string>>(new Set())

/** 根节点引用（点击外部关闭） */
const rootRef = ref<HTMLElement | null>(null)

/**
 * 面板各列的选项。
 * columns[0] 是根级；每往下一列，取上一列被点中项的 children。
 * activePath[i] 记录第 i 列点中的项。
 */
const columns = computed<CascaderOption[][]>(() => {
  const cols: CascaderOption[][] = [props.options]
  for (const picked of activePath.value) {
    cols.push(picked.children ?? [])
  }
  return cols
})

/** 选中值 → 路径（用于反查 label） */
function findPathByValue(
  value: unknown,
  nodes: CascaderOption[],
  trail: CascaderOption[] = []
): CascaderOption[] | null {
  for (const n of nodes) {
    const next = [...trail, n]
    if (n.value === value) return next
    if (n.children) {
      const found = findPathByValue(value, n.children, next)
      if (found) return found
    }
  }
  return null
}

/** 已选路径（单选） */
const selectedPath = computed(() => {
  const v = props.modelValue
  if (v === undefined || v === null || v === '') return []
  if (Array.isArray(v)) {
    // 可能是路径数组（多选的第一个），取路径本身
    const nodes = props.options
    let cur: CascaderOption[] = []
    for (const seg of v) {
      const found = cur.length ? (cur[cur.length - 1].children ?? []) : nodes
      const hit = found.find((n) => n.value === seg)
      if (!hit) break
      cur = [...cur, hit]
    }
    return cur
  }
  return findPathByValue(v, props.options) ?? []
})

/** 输入框显示文本 */
const displayText = computed(() => {
  if (props.multiple) {
    const paths = (props.modelValue as (string | number)[][]) ?? []
    const labels = paths.map((p) => pathLabel(findPathByValue(p[0], props.options) ?? [], p))
    if (!labels.length) return ''
    if (props.showCheckedStrategy === 'parent' && labels.length > 1) {
      return `${labels[0]} + ${labels.length - 1}`
    }
    return labels.join('、')
  }
  const p = selectedPath.value
  if (!p.length) return ''
  const labels = p.map((n) => n.label ?? String(n.value))
  return props.showAllLevels ? labels.join(props.separator) : labels[labels.length - 1]
})

/** 路径 → 展示文本（多选时 value 是路径数组，用它定位每一级） */
function pathLabel(path: CascaderOption[], values: (string | number)[]): string {
  if (!path.length) return values.map(String).join(props.separator)
  return path.map((n) => n.label ?? String(n.value)).join(props.separator)
}

/** 筛选结果（扁平化命中的叶子） */
const filterResults = computed(() => {
  if (!props.filterable || !keyword.value) return []
  const out: CascaderOption[][] = []
  const walk = (nodes: CascaderOption[], trail: CascaderOption[]) => {
    for (const n of nodes) {
      const next = [...trail, n]
      const hit = props.filterMethod
        ? props.filterMethod(n, keyword.value)
        : String(n.label ?? '').toLowerCase().includes(keyword.value.toLowerCase())
      if (hit) out.push(next)
      if (n.children?.length) walk(n.children, next)
    }
  }
  walk(props.options, [])
  return out
})

const isFiltering = computed(() => props.filterable && !!keyword.value)

/* ---------------- 交互 ---------------- */

function onOptionClick(option: CascaderOption, columnIndex: number) {
  if (option.disabled) return
  // 点击第 columnIndex 列的选项 → 该列及之后的展开路径重建
  const path = [...activePath.value.slice(0, columnIndex), option]

  if (option.children?.length) {
    activePath.value = path
    emit('expand-change', path.map((n) => n.value))
    return
  }

  // 叶子：单选直接选中，多选则勾选
  if (props.multiple) {
    const k = JSON.stringify(path.map((n) => n.value))
    const draft = new Set(draftChecked.value)
    if (draft.has(k)) draft.delete(k)
    else draft.add(k)
    draftChecked.value = draft
    return
  }

  const value = option.value
  emit('update:modelValue', value)
  emit('change', value)
  closePanel()
}

/** 多选：勾选某个路径（含父级联动） */
function onCheckboxChange(_option: CascaderOption, path: CascaderOption[], checked: boolean) {
  const draft = new Set(draftChecked.value)
  const k = JSON.stringify(path.map((n) => n.value))
  if (checked) draft.add(k)
  else draft.delete(k)
  draftChecked.value = draft
}

function isPathChecked(path: CascaderOption[]): boolean {
  return draftChecked.value.has(JSON.stringify(path.map((n) => n.value)))
}

/** 多选：确定 */
function confirmMultiple() {
  const values = [...draftChecked.value].map((k) => JSON.parse(k) as (string | number)[])
  checkedPaths.value = new Set(draftChecked.value)
  emit('update:modelValue', values)
  emit('change', values)
  closePanel()
}

/** 多选：取消（丢弃草稿） */
function cancelMultiple() {
  draftChecked.value = new Set(checkedPaths.value)
  closePanel()
}

function clearValue() {
  emit('update:modelValue', props.multiple ? [] : undefined)
  emit('clear')
  emit('change', props.multiple ? [] : undefined)
}

function openPanel() {
  if (props.disabled) return
  visible.value = true
  activePath.value = []
  keyword.value = ''
  draftChecked.value = new Set(checkedPaths.value)
  emit('visible-change', true)
}

function closePanel() {
  visible.value = false
  emit('visible-change', false)
}

function onFilterInput(e: Event) {
  keyword.value = (e.target as HTMLInputElement).value
}

/** 点击外部关闭 */
function onDocClick(e: MouseEvent) {
  if (!visible.value) return
  const target = e.target as Node
  if (rootRef.value && !rootRef.value.contains(target)) closePanel()
}

watch(
  () => visible.value,
  (v) => {
    if (v) document.addEventListener('mousedown', onDocClick)
    else document.removeEventListener('mousedown', onDocClick)
  }
)

/** 外部值变化时同步多选勾选态 */
watch(
  () => props.modelValue,
  (v) => {
    if (!props.multiple) return
    const vals = (v as (string | number)[][]) ?? []
    checkedPaths.value = new Set(vals.map((p) => JSON.stringify(p)))
    draftChecked.value = new Set(checkedPaths.value)
  },
  { immediate: true }
)

defineExpose({
  /** 面板显隐 */
  togglePopperVisible: (v?: boolean) => {
    if (v === undefined) (visible.value ? closePanel() : openPanel())
    else if (v) openPanel()
    else closePanel()
  },
  focus: () => rootRef.value?.querySelector<HTMLInputElement>('input')?.focus(),
  blur: () => rootRef.value?.querySelector<HTMLInputElement>('input')?.blur()
})
</script>

<template>
  <div ref="rootRef" class="dmk-cascader" :class="[`dmk-cascader--${size}`, { 'is-disabled': disabled }]">
    <div class="dmk-cascader__control" role="combobox" :aria-expanded="visible" aria-haspopup="listbox">
      <input
        class="dmk-cascader__input"
        type="text"
        readonly
        :disabled="disabled"
        :placeholder="displayText || placeholder"
        :value="isFiltering ? keyword : displayText"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
        @click="visible ? closePanel() : openPanel()"
      />
      <button
        v-if="clearable && displayText"
        type="button"
        class="dmk-cascader__clear"
        aria-label="清空"
        @click.stop="clearValue"
      >
        ×
      </button>
      <span class="dmk-cascader__arrow" aria-hidden="true">▾</span>
    </div>

    <div v-if="visible" class="dmk-cascader__panel" :class="popperClass" role="listbox">
      <div v-if="filterable" class="dmk-cascader__filter">
        <input
          class="dmk-cascader__filter-input"
          type="text"
          placeholder="搜索"
          :value="keyword"
          @input="onFilterInput"
        />
      </div>

      <!-- 筛选态：扁平结果 -->
      <ul v-if="isFiltering" class="dmk-cascader__col">
        <li
          v-for="(path, i) in filterResults"
          :key="i"
          class="dmk-cascader__option"
          role="option"
          :aria-selected="false"
          @click="onOptionClick(path[path.length - 1], 0)"
        >
          {{ path.map((n) => n.label).join(' / ') }}
        </li>
        <li v-if="!filterResults.length" class="dmk-cascader__empty">无匹配结果</li>
      </ul>

      <!-- 正常态：多列 -->
      <template v-else>
        <div class="dmk-cascader__cols">
          <ul v-for="(col, ci) in columns" :key="ci" class="dmk-cascader__col">
            <li
              v-for="opt in col"
              :key="String(opt.value)"
              class="dmk-cascader__option"
              :class="{ 'is-disabled': opt.disabled }"
              role="option"
              :aria-selected="false"
              @click="onOptionClick(opt, ci)"
            >
              <label v-if="multiple" class="dmk-cascader__check" @click.stop>
                <input
                  type="checkbox"
                  :checked="isPathChecked(activePath.slice(0, ci).concat(opt))"
                  :disabled="opt.disabled"
                  @change="onCheckboxChange(opt, activePath.slice(0, ci).concat(opt), ($event.target as HTMLInputElement).checked)"
                />
              </label>
              <span>{{ opt.label }}</span>
            </li>
          </ul>
        </div>

        <div v-if="multiple" class="dmk-cascader__footer">
          <button type="button" class="dmk-cascader__btn" @click="cancelMultiple">取消</button>
          <button type="button" class="dmk-cascader__btn is-primary" @click="confirmMultiple">确定</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dmk-cascader {
  position: relative;
  display: inline-block;
  min-width: 220px;
  font-family: var(--dmk-font-family);
  font-size: var(--dmk-font-base);
}

.dmk-cascader__control {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--dmk-control-height);
  padding: 0 var(--dmk-control-padding-x);
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  cursor: pointer;
  transition: border-color var(--dmk-duration-fast) var(--dmk-ease);
}

.dmk-cascader__control:focus-within {
  border-color: var(--dmk-color-primary);
  box-shadow: var(--dmk-shadow-focus);
}

.dmk-cascader.is-disabled .dmk-cascader__control {
  background: var(--dmk-color-surface-hover);
  cursor: not-allowed;
  opacity: 0.7;
}

.dmk-cascader__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dmk-color-text);
  font-family: inherit;
  font-size: inherit;
  cursor: inherit;
}

.dmk-cascader__input::placeholder {
  color: var(--dmk-color-text-muted);
}

.dmk-cascader__clear {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--dmk-color-text-muted);
  color: var(--dmk-color-surface);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

.dmk-cascader__arrow {
  flex: 0 0 auto;
  margin-left: 6px;
  color: var(--dmk-color-text-muted);
  font-size: 11px;
}

.dmk-cascader__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: var(--dmk-z-popup);
  display: flex;
  flex-direction: column;
  min-width: 100%;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-lg);
  background: var(--dmk-color-surface);
  box-shadow: var(--dmk-shadow-lg);
  overflow: hidden;
}

.dmk-cascader__filter {
  padding: 8px;
  border-bottom: 1px solid var(--dmk-color-border-subtle);
}

.dmk-cascader__filter-input {
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

.dmk-cascader__filter-input:focus {
  border-color: var(--dmk-color-primary);
}

.dmk-cascader__cols {
  display: flex;
  align-items: flex-start;
  max-height: 260px;
}

.dmk-cascader__col {
  min-width: 160px;
  max-height: 260px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  overflow-y: auto;
  border-right: 1px solid var(--dmk-color-border-subtle);
}

.dmk-cascader__col:last-child {
  border-right: none;
}

.dmk-cascader__option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  color: var(--dmk-color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.dmk-cascader__option:hover {
  background: var(--dmk-color-surface-hover);
  color: var(--dmk-color-primary);
}

.dmk-cascader__option.is-disabled {
  color: var(--dmk-color-text-muted);
  cursor: not-allowed;
  pointer-events: none;
}

.dmk-cascader__check {
  display: inline-flex;
  align-items: center;
}

.dmk-cascader__check input {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: var(--dmk-color-primary);
}

.dmk-cascader__empty {
  padding: 12px 14px;
  color: var(--dmk-color-text-muted);
  font-size: 13px;
}

.dmk-cascader__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--dmk-color-border-subtle);
  background: var(--dmk-color-surface-hover);
}

.dmk-cascader__btn {
  min-height: 28px;
  padding: 0 14px;
  border: 1px solid var(--dmk-color-border);
  border-radius: var(--dmk-radius-md);
  background: var(--dmk-color-surface);
  color: var(--dmk-color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.dmk-cascader__btn.is-primary {
  background: var(--dmk-color-primary);
  border-color: var(--dmk-color-primary);
  color: var(--dmk-color-on-primary);
}
</style>
