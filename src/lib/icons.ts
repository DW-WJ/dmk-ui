/**
 * dmk-ui 内置图标集 —— 24×24 视窗的 SVG path 数据。
 *
 * 为什么自建：Element Plus 的图标来自独立包 @element-plus/icons-vue，
 * 而 dmk-ui 承诺「零运行时依赖（仅 vue peer）」，所以这里内联一份
 * 常用图标 path，按需 tree-shaking（用到的才进包）。
 *
 * 命名沿用 EP 图标语义（Search / Close / Check …），方便迁移时直接替换。
 */
export interface IconDefinition {
  /** SVG path 的 d 属性 */
  d: string
  /** 无障碍名称（部分图标有 title） */
  title?: string
}

export const DmkIcons: Record<string, IconDefinition> = {
  /* ---------- 通用 ---------- */
  Search: { d: 'M10 2a8 8 0 1 0 4.9 14.32l5.39 5.39 1.42-1.42-5.39-5.39A8 8 0 0 0 10 2m0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12' },
  Close: { d: 'M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z' },
  Check: { d: 'M12 16.6 4.6 9.2l1.4-1.4 6 6 8-8 1.4 1.4z' },
  CloseBold: { d: 'M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z' },
  Plus: { d: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z' },
  Minus: { d: 'M5 11h14v2H5z' },
  Edit: { d: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z' },
  Delete: { d: 'M6 7h12l-1 13H7zm3-4h6l1 2h4v2H4V5h4z' },
  Refresh: { d: 'M12 4V1L8 5l4 4V6a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8' },
  RefreshRight: { d: 'M20 11h-8a4 4 0 1 0 0 8h1v-2h-1a2 2 0 1 1 0-4h8zm-2-5.6L8.4 12l9.6 6.6V16a6 6 0 1 0-2-11.2z' },
  RefreshLeft: { d: 'M4 13h8a4 4 0 1 1 0 8H3v-2h1a2 2 0 1 0 0-4H4zm16-7.6L10.4 12l9.6 6.6V16a6 6 0 1 1-2-11.2z' },
  Loading: { d: 'M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8z' },
  More: { d: 'M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4m6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4' },
  MoreFilled: { d: 'M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4m6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4' },
  Filter: { d: 'M3 4h18l-7 8v7l-4 2v-9z' },

  /* ---------- 方向 ---------- */
  ArrowLeft: { d: 'M11.7 6.7 10.3 5.3 4.6 11l5.7 5.7 1.4-1.4L7.4 12z' },
  ArrowRight: { d: 'M12.3 6.7l1.4-1.4 5.7 5.7-5.7 5.7-1.4-1.4 4.3-4.3z' },
  ArrowUp: { d: 'M6.7 11.3 5.3 12.7 11 18.4l5.7-5.7-1.4-1.4L11 15.9z' },
  ArrowDown: { d: 'M6.7 12.7 5.3 11.3 11 5.6l5.7 5.7-1.4 1.4L11 8.1z' },
  ArrowLeftBold: { d: 'M8 11.4V20h2.6v-6.6h9.4V11.4z' },
  ArrowRightBold: { d: 'M4 11.4v2h9.4V20H16V11.4z' },
  ArrowUpBold: { d: 'M11.4 16v8.6H14V9.4H4V12h6.4z' },
  ArrowDownBold: { d: 'M11.4 8v8.6H14V4.6H4V7h6.4z' },
  Top: { d: 'M11 20v-8H4l8-8 8 8h-7v8z' },
  Bottom: { d: 'M13 4v8h7l-8 8-8-8h7V4z' },
  Back: { d: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z' },
  Right: { d: 'M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z' },
  DArrowRight: { d: 'M8.7 10.3 12 6l3.3 4.3H13v4h4.3L12 18.7 6.7 14H11v-4z' },
  DArrowLeft: { d: 'M15.3 10.3 12 6 8.7 10.3H11v4H6.7L12 18.7l3.3-4.3H13v-4z' },
  Sort: { d: 'M11 3h2v14h-2zm-4 14h10l-5 6z' },
  SortUp: { d: 'M11 21h2V7h-2zM6 10l6-6 6 6z' },
  SortDown: { d: 'M11 3h2v14h-2zM6 14l6 6 6-6z' },
  Rank: { d: 'M3 5h10v2H3zm0 6h7v2H3zm0 6h10v2H3zm14-9 3 3 3-3h-2v5h-2V8z' },
  CaretTop: { d: 'M12 8 6 14h12z' },
  CaretBottom: { d: 'M12 16 6 10h12z' },
  CaretLeft: { d: 'M9 6v12l9-6z' },
  CaretRight: { d: 'M15 6v12L6 12z' },
  DCaret: { d: 'M12 9 5 16h14z' },
  Expand: { d: 'M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z' },
  Fold: { d: 'M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zm-4 5 4 4h-3v4h-2v-4H6z' },

  /* ---------- 状态 ---------- */
  CircleCheck: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1.2 14.4-4.2-4.2 1.4-1.4 2.8 2.8 6-6 1.4 1.4z' },
  CircleCheckFilled: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1.2 14.4-4.2-4.2 1.4-1.4 2.8 2.8 6-6 1.4 1.4z' },
  CircleClose: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m3.5 12.1-1.4 1.4L12 13.4l-2.1 2.1-1.4-1.4L10.6 12 8.5 9.9l1.4-1.4L12 10.6l2.1-2.1 1.4 1.4L13.4 12z' },
  CircleCloseFilled: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m3.5 12.1-1.4 1.4L12 13.4l-2.1 2.1-1.4-1.4L10.6 12 8.5 9.9l1.4-1.4L12 10.6l2.1-2.1 1.4 1.4L13.4 12z' },
  CirclePlus: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 5v4h4v2h-4v4h-2v-4H7v-2h4V7z' },
  CirclePlusFilled: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 5v4h4v2h-4v4h-2v-4H7v-2h4V7z' },
  Warning: { d: 'M12 2 1 21h22zm0 5 7.5 13h-15zM11 11h2v5h-2zm0 6h2v2h-2z' },
  WarnTriangleFilled: { d: 'M12 2 1 21h22zm0 5 7.5 13h-15zM11 11h2v5h-2zm0 6h2v2h-2z' },
  QuestionFilled: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 15h-1.5v-1.5H12zm.8-6.2h-1.6v-.9c0-1 .6-1.4 1.2-1.8.5-.3.7-.6.7-1.1 0-.7-.6-1.2-1.4-1.2s-1.5.5-1.5 1.4H8.7c0-1.9 1.5-3.2 3.4-3.2s3.3 1.2 3.3 3c0 1.1-.6 1.6-1.3 2.1-.6.4-.8.7-.8 1.2v.5z' },
  InfoFilled: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-6h2zm0-8h-2V7h2z' },
  SuccessFilled: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1.2 14.4-4.2-4.2 1.4-1.4 2.8 2.8 6-6 1.4 1.4z' },

  /* ---------- 导航 / 位置 ---------- */
  House: { d: 'M12 3 2 12h3v9h6v-6h2v6h6v-9h3z' },
  HomeFilled: { d: 'M12 3 2 12h3v9h6v-6h2v6h6v-9h3z' },
  Location: { d: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5' },
  LocationFilled: { d: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5' },
  Position: { d: 'M12 2 2 22l10-6 10 6z' },
  OfficeBuilding: { d: 'M3 21V5l8-3v19m0-14h8v14M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01M2 21h20' },
  Guide: { d: 'M12 2a3 3 0 0 0-1 5.8V17h2V7.8A3 3 0 0 0 12 2m4 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3v-2h3v-8h-3zM5 8h3v8H5z' },
  Aim: { d: 'M12 2v3a7 7 0 0 1 7 7h3a10 10 0 0 0-10-10m0 17a7 7 0 0 1-7-7H2a10 10 0 0 0 10 10m-1-8h2v-2h3v3h-3v3h-2v-3H8v-2h3z' },

  /* ---------- 文件 ---------- */
  Document: { d: 'M6 2h8l6 6v14H6zm7 1.5V9h5.5z' },
  DocumentAdd: { d: 'M6 2h8l6 6v14H6zm7 1.5V9h5.5zM12 12h2v3h3v2h-3v3h-2v-3H9v-2h3z' },
  Folder: { d: 'M3 5h6l2 2h10v12H3z' },
  FolderOpened: { d: 'M3 5h6l2 2h10v3H5.6L3 18zM3 19l2.6-8h15.2l-2.6 8z' },
  FolderAdd: { d: 'M3 5h6l2 2h10v12H3zm9 7h2v2h2v2h-2v2h-2v-2H9v-2h3z' },
  Tickets: { d: 'M3 5h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zm6 4v2h6V9z' },
  Notebook: { d: 'M5 2h14v20H5zm2 3v2h10V5zm0 4v2h10V9zm0 4v2h10v-2z' },
  Memo: { d: 'M4 3h16v18H4zm3 4v2h10V7zm0 4v2h10v-2zm0 4v2h6v-2z' },
  Collection: { d: 'M4 3h16v18H4zm3 4v3h4V7zm0 5v3h4v-3zm6-5v3h4V7zm0 5v3h4v-3z' },
  DocumentCopy: { d: 'M8 2h11v16h-2V4H8zM4 6h11v16H4zm2 3v2h7V9zm0 4v2h7v-2zm0 4v2h5v-2z' },
  CopyDocument: { d: 'M8 2h11v16h-2V4H8zM4 6h11v16H4zm2 3v2h7V9zm0 4v2h7v-2zm0 4v2h5v-2z' },
  DataBoard: { d: 'M3 3h18v18H3zm3 12h4v3H6zm7-6h5v9h-5z' },
  DataLine: { d: 'M3 3h2v16h16v2H3zm4 12 4-4 3 3 5-6 1.4 1.2-6 7.2-3-3-2.6 2.6z' },
  TrendCharts: { d: 'M3 3h2v16h16v2H3zm4 12 4-4 3 3 5-6 1.4 1.2-6 7.2-3-3-2.6 2.6z' },
  Histogram: { d: 'M3 3h2v18h16v2H3zm4 10h3v8H7zm5-4h3v12h-3zm5-6h3v18h-3z' },
  Grid: { d: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z' },
  List: { d: 'M3 5h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zM3 17h2v2H3zm4 0h14v2H7z' },

  /* ---------- 用户 / 通信 ---------- */
  User: { d: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0 10c4.4 0 8 2.2 8 5v1H4v-1c0-2.8 3.6-5 8-5' },
  UserFilled: { d: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0 10c4.4 0 8 2.2 8 5v1H4v-1c0-2.8 3.6-5 8-5' },
  Avatar: { d: 'M12 3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9m0 11c4 0 7.5 2 7.5 4.5V21h-15v-2.5C4.5 16 8 14 12 14' },
  Bell: { d: 'M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2m6-6v-5a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1z' },
  BellFilled: { d: 'M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2m6-6v-5a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1z' },
  Message: { d: 'M3 4h18v13H8l-5 4z' },
  ChatDotRound: { d: 'M12 3c-5 0-9 3.4-9 7.6 0 2.4 1.3 4.5 3.3 5.9L5 21l4.6-2.1c.8.2 1.6.3 2.4.3 5 0 9-3.4 9-7.6S17 3 12 3' },
  ChatSquare: { d: 'M3 4h18v14H8l-5 4z' },
  Setting: { d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m9 4a9 9 0 0 1-.1 1.3l2 1.6-2 3.4-2.4-1a7.6 7.6 0 0 1-2.2 1.3l-.4 2.6h-4l-.4-2.6A7.6 7.6 0 0 1 9.3 18l-2.4 1-2-3.4 2-1.6A9 9 0 0 1 3 12l2-.6V9.6L3 8l2-3.4 2.4 1a7.6 7.6 0 0 1 2.2-1.3L11.6 2h4l.4 2.3a7.6 7.6 0 0 1 2.2 1.3l2.4-1 2 3.4-2 1.6q.1.7.1 1.4' },
  Tools: { d: 'M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.8 2.8 0 0 1-4-4zM12 3a4 4 0 0 1 3.9 5l-2.6-2.6a1 1 0 0 0-1.4 0L10 7.3A4 4 0 0 1 12 3' },
  Lock: { d: 'M12 2a5 5 0 0 0-5 5v3H5v12h14V10h-2V7a5 5 0 0 0-5-5m3 8H9V7a3 3 0 0 1 6 0z' },
  Unlock: { d: 'M12 2a5 5 0 0 0-5 5v3H5v12h14V10h-2V7a5 5 0 0 0-5-5m3 8H9V7a3 3 0 0 1 5.7-1.4l-1.5 1.5A1 1 0 0 0 12 8z' },
  View: { d: 'M12 5c-5 0-9 4.5-9 7s4 7 9 7 9-4.5 9-7-4-7-9-7m0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8m0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
  Hide: { d: 'M3 3l18 18-1.4 1.4-3.3-3.3A9.6 9.6 0 0 1 12 19c-5 0-9-4.5-9-7 0-1.4 1.2-3.3 3.2-4.7L2.6 4.4zM12 5c5 0 9 4.5 9 7 0 1.3-1.1 3-3 4.4l-3-3A3.9 3.9 0 0 0 12 9a4 4 0 0 0-3.4 1.9L7 9.3A6 6 0 0 1 12 5' },
  Star: { d: 'M12 2.5 15 9l7 .9-5.1 4.9 1.3 7L12 18.4 5.8 21.8l1.3-7L2 9.9 9 9z' },
  StarFilled: { d: 'M12 2.5 15 9l7 .9-5.1 4.9 1.3 7L12 18.4 5.8 21.8l1.3-7L2 9.9 9 9z' },
  Clock: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 10.6V6h-2v7.4l5.3 3.2 1-1.7z' },
  Timer: { d: 'M15 1H9v2h6zM12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18m1 14h-2v-6h2z' },
  AlarmClock: { d: 'M12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18m1 14h-2v-6h2zM3 6l3-3 1.4 1.4L4.4 7.4zM18 6l3-3 1.4 1.4-3 3z' },

  /* ---------- 媒体 / 其它 ---------- */
  VideoPlay: { d: 'M8 5v14l11-7z' },
  VideoPause: { d: 'M6 5h4v14H6zm8 0h4v14h-4z' },
  VideoCamera: { d: 'M3 6h11v12H3zm12 4 6-4v12l-6-4z' },
  Camera: { d: 'M9 3h6l1.5 2H21v16H3V5h4.5zm3 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10' },
  Picture: { d: 'M3 4h18v16H3zm2 12 4-5 3 4 3-2 3 3zm3-5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
  PictureRounded: { d: 'M3 4h18v16H3zm2 12 4-5 3 4 3-2 3 3zm3-5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
  Monitor: { d: 'M3 4h18v12H3zm6 14h6v2H9z' },
  Headset: { d: 'M12 3a9 9 0 0 0-9 9v7h4v-8H5v-1a7 7 0 0 1 14 0v1h-2v8h4v-7a9 9 0 0 0-9-9' },
  Microphone: { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3m7 10a7 7 0 0 1-6 6.9V22h-2v-3.1A7 7 0 0 1 5 12h2a5 5 0 0 0 10 0z' },
  Mute: { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3m7 10a7 7 0 0 1-6 6.9V22h-2v-3.1A7 7 0 0 1 5 12h2a5 5 0 0 0 10 0zM3 3l18 18-1.4 1.4-3.6-3.6L11 13V5a1 1 0 0 1 1.6-.8L21 8.4V12a7 7 0 0 1-.7 3l-1.5-1.5A5 5 0 0 0 19 12h2a9 9 0 0 1-9 9v-.1z' },
  Promotion: { d: 'M4 4h9l7 8-7 8H4zm4 3v10h4l4-5-4-5z' },
  Discount: { d: 'M11.5 2 2 11.5 12.5 22 22 12.5V2zm3.6 3.6a1.5 1.5 0 1 1-2.1 2.1 1.5 1.5 0 0 1 2.1-2.1m-4.9 9.9a1.5 1.5 0 1 1-2.1 2.1 1.5 1.5 0 0 1 2.1-2.1' },
  ShoppingCart: { d: 'M2 3h3l2.6 10.4h9.7L20 6H6m2.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
  ShoppingCartFull: { d: 'M2 3h3l2.6 10.4h9.7L20 6H6m2.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
  Goods: { d: 'M4 4h16v16H4zm4 4v8h8V8z' },
  Present: { d: 'M3 6h18v4H3zm1 6h16v9H4zm7-11 4 4H9z' },
  Trophy: { d: 'M6 3h12v2h4v3a4 4 0 0 1-4 4h-.4A6 6 0 0 1 14 16.9V19h4v2H6v-2h4v-2.1A6 6 0 0 1 6.4 12H6a4 4 0 0 1-4-4V5h4zm0 4H4v1a2 2 0 0 0 1 1.7zM18 7v2.7A2 2 0 0 0 20 8V7z' },
  Flag: { d: 'M5 3v18h2v-8h11l-2-5 2-5H7v-2z' },
  Link: { d: 'M10.6 13.4a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7 1.4 1.4 1.7-1.7a2 2 0 0 1 2.8 2.9l-3 3a2 2 0 0 1-2.8 0zM13.4 10.6a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7-1.4-1.4-1.7 1.7a2 2 0 0 1-2.8-2.9l3-3a2 2 0 0 1 2.8 0z' },
  Share: { d: 'M14 4v4a7 7 0 0 1-7 7H4v-2h3a5 5 0 0 0 5-5V4zm2 0h6v6h-2V7.4l-8.3 8.3-1.4-1.4L18.6 6H16z' },
  Upload: { d: 'M12 3l5 5h-3v6h-4V8H7zm-7 14h14v3H5z' },
  Download: { d: 'M12 16 7 11h3V5h4v6h3zM5 18h14v3H5z' },
  UploadFilled: { d: 'M12 3l5 5h-3v6h-4V8H7z' },
  Printer: { d: 'M7 3h10v4H7zm-3 6h16v8h-3v4H6v-4H3V9zm5 6h8v4H9z' },
  Connection: { d: 'M10 2h4v4h-4zm-2 4h8v2H8zm2 2h4v4h-4zm-6 4h4v2H4zm12 0h4v2h-4zM8 14h8v6h-2v-4h-4v4H8z' },
  Service: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1 5h2v4h-2zm0 6h2v6h-2z' },
  Pointer: { d: 'M5 2l14 8-6 1.6L10 18z' },
  Switch: { d: 'M8 5v3H4l5 6 5-6h-4V5zm8 14v-3h4l-5-6-5 6h4v3z' },
  Operation: { d: 'M4 8h16v2H4zm0 6h16v2H4z' },
  Coordinate: { d: 'M12 2v3a7 7 0 0 1 7 7h3a10 10 0 0 0-10-10m0 17a7 7 0 0 1-7-7H2a10 10 0 0 0 10 10m-1-8h2v-2h3v3h-3v3h-2v-3H8v-2h3z' },
  Sunny: { d: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0-5h0v3h0zm0 17h0v3h0zM2 11h3v2H2zm17 0h3v2h-3zM4.2 4.2 6.3 6.3 4.9 7.7 2.8 5.6zM17.7 17.7l2.1 2.1-1.4 1.4-2.1-2.1zM19.1 4.2l1.4 1.4-2.1 2.1-1.4-1.4zM6.3 17.7l1.4 1.4-2.1 2.1-1.4-1.4z' },
  Moon: { d: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9' },
  MoonNight: { d: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9M3 5v2h2v-2zm0 6v2h2v-2zm0 6v2h2v-2z' },
  Cloudy: { d: 'M6 18a4 4 0 0 1-.4-8A6 6 0 0 1 17 8.5 4.5 4.5 0 0 1 18.5 17H6z' },
  Opportunity: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-2h2zm0-4h-2V7h2z' },
  Reading: { d: 'M3 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H3zm18 0h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7z' },
  ReadingLamp: { d: 'M3 13h9l-2 5H5zM8 3h6v3h2l3 6H3l3-6h2z' },
  Monitor_: { d: 'M3 4h18v12H3zm6 14h6v2H9z' },
  Cellphone: { d: 'M7 2h10v20H7zm2 2v16h6V4z' },
  Iphone: { d: 'M7 2h10v20H7zm2 2v16h6V4z' },
  Platform: { d: 'M2 6h20v3H2zm2 5h16v9H4zm3 2v5h10v-5z' },
  Film: { d: 'M3 4h18v16H3zm3 3v10h3V7zm5 0v10h2V7zm4 0v10h4V7z' },
  Cup: { d: 'M4 4h13v3h3v4a5 5 0 0 1-5 5h-1.6A5 5 0 0 1 8 19.7V21H5v-1.3A5 5 0 0 1 4 15zm13 5v2h1a1 1 0 0 0 1-1V9zM3 22h15v2H3z' },
  KnifeFork: { d: 'M7 2v8h2V2zm0 10v10h2V12zM16 2c-1.5 1-2 3-2 5v3h3V7c0-2-.5-4-1-5m-1 10v10h2V12z' },
  Sugar: { d: 'M7 3h10l2 4-2 4H7L5 7zm3 10h4v8h-4z' },
  Apple: { d: 'M12 6c-1-1.5-3-2-4.5-1C5 6 4 8 4 11c0 5 3.5 10 5.5 10 1 0 1.5-.7 2.5-.7s1.5.7 2.5.7c2 0 5.5-5 5.5-10 0-3-1-5-3.5-6C15 4 13 5 12 6m1-3c.8 0 1.5-.7 1.5-1.5S13.8 0 13 0s-1.5.7-1.5 1.5S12.2 3 13 3' },
  Comment: { d: 'M3 4h18v13H8l-5 4z' },
  Histogram_: { d: 'M3 3h2v18h16v2H3zm4 10h3v8H7zm5-4h3v12h-3zm5-6h3v18h-3z' }
}

/**
 * 合并扩展图标集（lib/icons-extended.ts）。
 *
 * ⚠️ 「同名不覆盖」是硬约束：覆盖是图标库最隐蔽的 bug ——
 *    用户引用的名字还在，画出来却变了，且不报错。
 *    所以这里只补 base 里没有的条目；同名的**保留基础集的定义**并记录到
 *    ICON_NAME_CONFLICTS，文档页可据此提示「该名字有多个来源」。
 */
import {
  DmkIconsAI,
  DmkIconsData,
  DmkIconsEditor,
  DmkIconsFeedback
} from './icons-extended'

/** 同名冲突记录：扩展集里与基础集重名的条目名 */
export const ICON_NAME_CONFLICTS: string[] = []

function mergeIconSet(
  base: Record<string, IconDefinition>,
  ext: Record<string, IconDefinition>
): void {
  for (const [name, def] of Object.entries(ext)) {
    if (base[name]) {
      ICON_NAME_CONFLICTS.push(name)
      continue
    }
    base[name] = def
  }
}

mergeIconSet(DmkIcons, DmkIconsAI)
mergeIconSet(DmkIcons, DmkIconsData)
mergeIconSet(DmkIcons, DmkIconsEditor)
mergeIconSet(DmkIcons, DmkIconsFeedback)

/** 图标名列表（文档站与 IDE 补全用） */
export const DMK_ICON_NAMES = Object.keys(DmkIcons)
