/**
 * dmk-ui —— 场景化 Vue3 组件库入口。
 * 两种用法：
 *   1. 全量安装：app.use(DmkUI)（组件带 D 前缀注册）
 *   2. 按需引入：import { DButton, Message } from 'dmk-ui-vue'
 * 样式随入口自动引入；tree-shaking 依赖 sideEffects 配置（CSS 除外）。
 */
import type { App, Plugin } from 'vue'
import './styles/tokens.css'

import DAlert from './components/DAlert.vue'
import DCalendar from './components/DCalendar.vue'
import DAutocomplete from './components/DAutocomplete.vue'
import DAvatar from './components/DAvatar.vue'
import DBadge from './components/DBadge.vue'
import DBreadcrumb from './components/DBreadcrumb.vue'
import DBreadcrumbItem from './components/DBreadcrumbItem.vue'
import DButton from './components/DButton.vue'
import DCard from './components/DCard.vue'
import DCheckbox from './components/DCheckbox.vue'
import DCheckboxGroup from './components/DCheckboxGroup.vue'
import DCollapse from './components/DCollapse.vue'
import DDatePicker from './components/DDatePicker.vue'
import DDescriptions from './components/DDescriptions.vue'
import DDivider from './components/DDivider.vue'
import DDropdown from './components/DDropdown.vue'
import DDrawer from './components/DDrawer.vue'
import DEmpty from './components/DEmpty.vue'
import DMenu from './components/DMenu.vue'
import DForm from './components/DForm.vue'
import DFormItem from './components/DFormItem.vue'
import DInput from './components/DInput.vue'
import DInputNumber from './components/DInputNumber.vue'
import DInputOTP from './components/DInputOTP.vue'
import DInputTag from './components/DInputTag.vue'
import DModal from './components/DModal.vue'
import DPagination from './components/DPagination.vue'
import DProgress from './components/DProgress.vue'
import DRadio from './components/DRadio.vue'
import DResult from './components/DResult.vue'
import DRate from './components/DRate.vue'
import DRadioGroup from './components/DRadioGroup.vue'
import DSelect from './components/DSelect.vue'
import DSegmented from './components/DSegmented.vue'
import DSkeleton from './components/DSkeleton.vue'
import DSteps from './components/DSteps.vue'
import DStatistic from './components/DStatistic.vue'
import DSlider from './components/DSlider.vue'
import DSwitch from './components/DSwitch.vue'
import DTable from './components/DTable.vue'
import DTabs from './components/DTabs.vue'
import DTabPane from './components/DTabPane.vue'
import DTag from './components/DTag.vue'
import DTextarea from './components/DTextarea.vue'
import DTransfer from './components/DTransfer.vue'
import DUpload from './components/DUpload.vue'
import DTimePicker from './components/DTimePicker.vue'
import DTimeSelect from './components/DTimeSelect.vue'
import DTimeline from './components/DTimeline.vue'
import DPopover from './components/DPopover.vue'
import DPopconfirm from './components/DPopconfirm.vue'
import DTooltip from './components/DTooltip.vue'
import DText from './components/DText.vue'
import DLink from './components/DLink.vue'
import DIcon from './components/DIcon.vue'
import DBorder from './components/DBorder.vue'
import DColor from './components/DColor.vue'
import DTypography from './components/DTypography.vue'
import DRow from './components/DRow.vue'
import DCol from './components/DCol.vue'
import DContainer from './components/DContainer.vue'
import DHeader from './components/DHeader.vue'
import DAside from './components/DAside.vue'
import DMain from './components/DMain.vue'
import DFooter from './components/DFooter.vue'
import DSpace from './components/DSpace.vue'
import DScrollbar from './components/DScrollbar.vue'
import DConfigProvider from './components/DConfigProvider.vue'
import DLoading from './components/DLoading.vue'
import DTree from './components/DTree.vue'
import TreeNodeItem from './components/TreeNodeItem.vue'
import DTreeSelect from './components/DTreeSelect.vue'
import DCascader from './components/DCascader.vue'
import DColorPicker from './components/DColorPicker.vue'
import DImage from './components/DImage.vue'
import DWatermark from './components/DWatermark.vue'
import DAffix from './components/DAffix.vue'
import DAnchor from './components/DAnchor.vue'
import DAnchorLink from './components/DAnchorLink.vue'
import DBacktop from './components/DBacktop.vue'
import DPageHeader from './components/DPageHeader.vue'
import DTour from './components/DTour.vue'
import DSplitter from './components/DSplitter.vue'
import DSplitterPanel from './components/DSplitterPanel.vue'
import DMention from './components/DMention.vue'
import DCarousel from './components/DCarousel.vue'
import DCarouselItem from './components/DCarouselItem.vue'
import DInfiniteScroll from './components/DInfiniteScroll.vue'
import DDateTimePicker from './components/DDateTimePicker.vue'
import DColorPickerPanel from './components/DColorPickerPanel.vue'
import DDatePickerPanel from './components/DDatePickerPanel.vue'
import DSelectV2 from './components/DSelectV2.vue'
import DTableV2 from './components/DTableV2.vue'
import DTreeV2 from './components/DTreeV2.vue'
import { vInfiniteScroll } from './directives/infiniteScroll'
import { Notification, showNotification } from './notification'
import type { NotificationOptions, NotificationType } from './notification'
import { MessageBox, closeAllMessageBoxes } from './messagebox'
import type { MessageBoxAction, MessageBoxOptions, MessageBoxType } from './messagebox'
import { Message, showMessage } from './message'
import type { MessageOptions, MessageType } from './message'

export {
  DAlert,
  DCalendar,
  DAutocomplete,
  DAvatar,
  DBadge,
  DBreadcrumb,
  DBreadcrumbItem,
  DButton,
  DCard,
  DCheckbox,
  DCheckboxGroup,
  DCollapse,
  DDatePicker,
  DDescriptions,
  DDivider,
  DDropdown,
  DDrawer,
  DEmpty,
  DMenu,
  DForm,
  DFormItem,
  DInput,
  DInputNumber,
  DInputOTP,
  DInputTag,
  DModal,
  DPagination,
  DProgress,
  DRadio,
  DResult,
  DRate,
  DRadioGroup,
  DSelect,
  DSegmented,
  DSkeleton,
  DSteps,
  DStatistic,
  DSlider,
  DSwitch,
  DTable,
  DTabs,
  DTabPane,
  DTag,
  DTextarea,
  DPopover,
  DPopconfirm,
  DTransfer,
  DUpload,
  DTimePicker,
  DTimeSelect,
  DTimeline,
  DTooltip,
  DText,
  DLink,
  DIcon,
  DBorder,
  DColor,
  DTypography,
  DRow,
  DCol,
  DContainer,
  DHeader,
  DAside,
  DMain,
  DFooter,
  DSpace,
  DScrollbar,
  DConfigProvider,
  DLoading,
  DTree,
  TreeNodeItem,
  DTreeSelect,
  DCascader,
  DColorPicker,
  DImage,
  DWatermark,
  DAffix,
  DAnchor,
  DAnchorLink,
  DBacktop,
  DPageHeader,
  DTour,
  DSplitter,
  DSplitterPanel,
  DMention,
  DCarousel,
  DCarouselItem,
  DInfiniteScroll,
  DDateTimePicker,
  DColorPickerPanel,
  DDatePickerPanel,
  DSelectV2,
  DTableV2,
  DTreeV2,
  vInfiniteScroll,
  Notification,
  showNotification,
  MessageBox,
  closeAllMessageBoxes,
  Message,
  showMessage
}

export type { MessageOptions, MessageType }
export type { NotificationOptions, NotificationType }
export type { MessageBoxAction, MessageBoxOptions, MessageBoxType }

// 组件用到的公共类型（供业务侧复用，避免各项目重复声明导致类型不兼容）
export type { SelectOption, SelectValue } from './lib/select'

// 批 4 新组件的公共类型（业务侧可直接复用）
export type { AutocompleteOption } from './components/DAutocomplete.vue'
export type { TransferItem } from './components/DTransfer.vue'
export type { UploadFile } from './components/DUpload.vue'
export type { DescriptionItem } from './components/DDescriptions.vue'
export type { TimelineItem } from './components/DTimeline.vue'
export type { DropdownItem } from './components/DDropdown.vue'
export type { MenuItem } from './components/DMenu.vue'
export type { StepItem } from './components/DSteps.vue'

// 批 8 新组件的公共类型（业务侧可直接复用）
export type { TreeNode, TreeNodeData, TreeProps } from './lib/tree'
export type { CascaderOption } from './components/DCascader.vue'

// 批 9 新组件的公共类型
export type { TourStep, TourPlacement } from './lib/tour'
export type { AnchorItem, AnchorRegistry } from './lib/anchor'
export type { SplitterRegistry, SplitterPanelHandle } from './lib/splitter'
export type { MentionOption, MentionProps } from './lib/mention'
export type { CarouselRegistry } from './lib/carousel'
export type { InfiniteScrollOptions } from './lib/infinite-scroll'

// 批 11 虚拟化系列与面板的公共类型
export type { VirtualRange, VirtualCalcOptions, VirtualListState } from './lib/virtual-list'
export type { ColorFormat, Rgba } from './lib/color'

const components: [string, unknown][] = [
  ['DAlert', DAlert],
  ['DCalendar', DCalendar],
  ['DAutocomplete', DAutocomplete],
  ['DAvatar', DAvatar],
  ['DBadge', DBadge],
  ['DBreadcrumb', DBreadcrumb],
  ['DBreadcrumbItem', DBreadcrumbItem],
  ['DButton', DButton],
  ['DCard', DCard],
  ['DCheckbox', DCheckbox],
  ['DCheckboxGroup', DCheckboxGroup],
  ['DCollapse', DCollapse],
  ['DDatePicker', DDatePicker],
  ['DDescriptions', DDescriptions],
  ['DDivider', DDivider],
  ['DDropdown', DDropdown],
  ['DDrawer', DDrawer],
  ['DEmpty', DEmpty],
  ['DMenu', DMenu],
  ['DForm', DForm],
  ['DFormItem', DFormItem],
  ['DInput', DInput],
  ['DInputNumber', DInputNumber],
  ['DInputOTP', DInputOTP],
  ['DInputTag', DInputTag],
  ['DModal', DModal],
  ['DPagination', DPagination],
  ['DProgress', DProgress],
  ['DRadio', DRadio],
  ['DResult', DResult],
  ['DRate', DRate],
  ['DRadioGroup', DRadioGroup],
  ['DSelect', DSelect],
  ['DSegmented', DSegmented],
  ['DSkeleton', DSkeleton],
  ['DSteps', DSteps],
  ['DStatistic', DStatistic],
  ['DSlider', DSlider],
  ['DSwitch', DSwitch],
  ['DTable', DTable],
  ['DTabs', DTabs],
  ['DTabPane', DTabPane],
  ['DTag', DTag],
  ['DTextarea', DTextarea],
  ['DPopover', DPopover],
  ['DPopconfirm', DPopconfirm],
  ['DTransfer', DTransfer],
  ['DUpload', DUpload],
  ['DTimePicker', DTimePicker],
  ['DTimeSelect', DTimeSelect],
  ['DTimeline', DTimeline],
  ['DTooltip', DTooltip],
  ['DText', DText],
  ['DLink', DLink],
  ['DIcon', DIcon],
  ['DBorder', DBorder],
  ['DColor', DColor],
  ['DTypography', DTypography],
  ['DRow', DRow],
  ['DCol', DCol],
  ['DContainer', DContainer],
  ['DHeader', DHeader],
  ['DAside', DAside],
  ['DMain', DMain],
  ['DFooter', DFooter],
  ['DSpace', DSpace],
  ['DScrollbar', DScrollbar],
  ['DConfigProvider', DConfigProvider],
  ['DLoading', DLoading],
  ['DTree', DTree],
  ['DTreeSelect', DTreeSelect],
  ['DCascader', DCascader],
  ['DColorPicker', DColorPicker],
  ['DImage', DImage],
  ['DWatermark', DWatermark],
  ['DAffix', DAffix],
  ['DAnchor', DAnchor],
  ['DAnchorLink', DAnchorLink],
  ['DBacktop', DBacktop],
  ['DPageHeader', DPageHeader],
  ['DTour', DTour],
  ['DSplitter', DSplitter],
  ['DSplitterPanel', DSplitterPanel],
  ['DMention', DMention],
  ['DCarousel', DCarousel],
  ['DCarouselItem', DCarouselItem],
  ['DInfiniteScroll', DInfiniteScroll],
  ['DDateTimePicker', DDateTimePicker],
  ['DColorPickerPanel', DColorPickerPanel],
  ['DDatePickerPanel', DDatePickerPanel],
  ['DSelectV2', DSelectV2],
  ['DTableV2', DTableV2],
  ['DTreeV2', DTreeV2],
]

export const DmkUI: Plugin = {
  install(app: App) {
    for (const [name, comp] of components) {
      app.component(name, comp as never)
    }
  }
}

export default DmkUI
