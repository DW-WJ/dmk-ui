/**
 * DContainer 家族（DContainer / DHeader / DAside / DMain / DFooter）的内部通信契约。
 *
 * 为什么用 provide/inject 而不是扫描 slot vnode：
 *   slot 里的 vNode.type.name 会随构建产物/组件重命名变化，不可靠；
 *   子件在 onMounted 时向父容器登记「我是纵向块（Header/Footer）」，
 *   父容器据此自动切到 column 方向 —— 与 Element Plus 的行为一致。
 */
import type { InjectionKey, Ref } from 'vue'

export interface ContainerRegistry {
  /** 子树里是否存在 Header / Footer（纵向块） */
  hasVerticalBlock: Ref<boolean>
}

export const CONTAINER_REGISTRY_KEY: InjectionKey<ContainerRegistry> = Symbol('dmk-container-registry')
