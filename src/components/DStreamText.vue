<script setup lang="ts">
/**
 * DStreamText —— 流式输出文本渲染器。
 *
 * 场景：SSE / WebSocket 逐字推回来的内容。用户关心三件事：
 *   ① 逐字出现（打字机效果），而不是整段跳出来
 *   ② 能中断（用户等太久了要能停）
 *   ③ 内容里可能混着 Markdown 代码块，渲染时不能闪烁
 *
 * 设计要点：
 *   · 打字机：按字符切分，用 requestAnimationFrame 推进，帧率无关（不靠 setInterval）
 *   · 速度可配（charPerFrame = 每帧吐几个字），0 = 直接全量显示（历史消息用）
 *   · 中断：expose 一个 stop()，外部调用即停
 *   · Markdown：走默认插槽（业务方自己渲染），本组件只管「流式吐字」
 *
 * 用法：
 *   const stream = ref()
 *   <DStreamText ref="stream" :text="raw" :speed="2" />
 *   stream.value?.stop()
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 完整文本（流式内容源） */
    text?: string
    /** 每帧吐几个字；0 = 立即全量显示 */
    speed?: number
    /** 是否正在流式（true 时才播放打字机） */
    streaming?: boolean
    /** 内容变化时是否从头播（false = 增量续播） */
    restartOnChange?: boolean
  }>(),
  {
    text: '',
    speed: 2,
    streaming: true,
    restartOnChange: false
  }
)

const emit = defineEmits<{
  complete: []
}>()

/** 当前已吐出的字符数 */
const shownCount = ref(0)

let rafId = 0
let stopFlag = false

/** 完整长度 */
const total = computed(() => props.text.length)

/** 已显示的文本 */
const shownText = computed(() => props.text.slice(0, shownCount.value))

/** 是否播完了 */
const done = computed(() => shownCount.value >= total.value)

/** 推进一帧 */
function tick() {
  if (stopFlag) return
  if (props.speed <= 0) {
    shownCount.value = total.value
    emit('complete')
    return
  }
  shownCount.value = Math.min(total.value, shownCount.value + props.speed)
  if (done.value) {
    emit('complete')
    return
  }
  rafId = requestAnimationFrame(tick)
}

function start() {
  cancelAnimationFrame(rafId)
  stopFlag = false
  rafId = requestAnimationFrame(tick)
}

function stop() {
  stopFlag = true
  cancelAnimationFrame(rafId)
}

watch(
  () => props.text,
  (v, old) => {
    if (props.restartOnChange) {
      shownCount.value = 0
    } else if (v.length < (old?.length ?? 0)) {
      // 内容变短（重新生成）→ 归零重播
      shownCount.value = 0
    } else if (v.length < shownCount.value) {
      shownCount.value = v.length
    }
    if (props.streaming) start()
    else {
      stop()
      shownCount.value = total.value
    }
  },
  { immediate: true }
)

onBeforeUnmount(stop)

/** 暴露给父组件：随时中断 */
defineExpose({
  stop,
  /** 跳过剩余内容，直接显示全部 */
  skip() {
    stop()
    shownCount.value = total.value
    emit('complete')
  }
})
</script>

<template>
  <div class="dmk-stream">
    <!-- 默认插槽：业务方自己渲染 Markdown；不给则渲染纯文本 -->
    <slot :text="shownText" :done="done">
      <span class="dmk-stream__text">{{ shownText }}</span>
    </slot>
    <!-- 尾部光标：还在吐字时显示 -->
    <span
      v-if="streaming && !done"
      class="dmk-stream__cursor"
      aria-hidden="true"
    ></span>
    <span class="sr-only" aria-live="polite">{{ shownText }}</span>
  </div>
</template>

<style scoped>
.dmk-stream {
  display: inline;
}

.dmk-stream__text {
  white-space: pre-wrap;
  word-break: break-word;
}

.dmk-stream__cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--dmk-color-primary);
  animation: dmk-stream-blink 1s steps(2, start) infinite;
}

@keyframes dmk-stream-blink {
  to {
    visibility: hidden;
  }
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

@media (prefers-reduced-motion: reduce) {
  .dmk-stream__cursor {
    animation: none;
  }
}
</style>
