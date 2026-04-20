# Oumomo 项目技术亮点/难点沉淀（供简历优化 Agent 学习）

## 1. 项目速览（给 Agent 的背景）

- 项目形态：AI 视频创作与分发平台前端（Next.js App Router）
- 技术栈：Next.js 15 + React 19 + TypeScript + Tailwind + Zustand + ahooks
- 关键能力域：
  - 多场景 AI 工具编排（视频脚本、视频复刻、切片、图生视频、声音生成等）
  - 支付闭环（Airwallex/微信二维码/订单轮询）
  - 国际化与多区域能力
  - 上传链路与媒体校验（预签名上传、人脸检测、断点取消）

## 2. 可写进简历的技术亮点（按“价值-方案-结果”）

### 亮点 A：统一请求基础设施，兼容 SSR/CSR 双端语义

- 价值：降低多业务线接口接入成本，统一鉴权与语言/地区透传。
- 方案：
  - 基于 axios 封装 `utils/request.ts`，在请求拦截中统一注入 `lang/region/source`、Cookie、签名 `fm-sign`。
  - 区分客户端/服务端上下文：服务端通过 `next/headers` 转发用户环境头；客户端从 URL + Cookie 解析 locale。
  - 响应拦截统一处理“未登录+需鉴权”跳转逻辑（浏览器跳转与服务端 redirect 双分支）。
- 结果口径（可补数据）：
  - “将接口接入模板化，新增业务接口开发时长从 Xh 降至 Yh”。
  - “减少多语言/鉴权遗漏导致的问题单占比 X%”。

### 亮点 B：国际化路由与请求上下文打通

- 价值：保证页面路由语言、接口语言、用户体验语言一致。
- 方案：
  - `next-intl` 路由层统一配置（`i18n/routing.ts`）。
  - `middleware.ts` 注入 `x-url`，为 SSR 侧请求重建 locale 与跳转语义提供依据。
  - `i18n/request.ts` 动态按 locale 加载消息文件。
- 结果口径：
  - “支撑中英文双语上线，避免因 URL/Cookie 不一致导致的语言错乱问题”。

### 亮点 C：复杂异步任务编排（轮询 + 状态机）

- 价值：承载 AI 任务的不确定时延，提升任务可观测性与可恢复性。
- 方案：
  - 在 `video-script/context.tsx` 聚合初始化、参数配置、视频脚本轮询、任务状态轮询与结果拼接。
  - 使用 ahooks `useRequest` 的 `pollingInterval + cancel` 机制管理任务生命周期。
  - 通过 `generateMore`、配置变更监听与引用切换重置，保证“增量生成/重新生成”语义正确。
- 结果口径：
  - “将长任务流程可视化并可重试，降低用户中途放弃率 X%”。

### 亮点 D：高可用上传链路（前置校验 + 预签名 + 可取消）

- 价值：减少无效上传与后端失败重试成本，提升上传成功率和体验。
- 方案：
  - `components/UploadInput` 集成媒体格式/大小/时长校验。
  - 图像场景接入 `face-api.js`（`utils/detectFace.ts`）做人脸数量约束（无脸/多人脸拦截）。
  - `useUploader + utils/request.upload` 基于 `AbortController` 提供上传进度与取消能力。
  - 通过预签名接口（`postGetPresigns`）直传对象存储，减轻应用层带宽压力。
- 结果口径：
  - “无效文件拦截率提升 X%，上传失败率下降 Y%”。

### 亮点 E：支付流程工程化（多支付通道 + 轮询闭环）

- 价值：支撑商业化订阅与积分购买闭环。
- 方案：
  - Airwallex SDK 封装重试与超时等待（`hooks/useAirwallexPayment.ts`）。
  - 微信支付弹窗 `WeChatPayDialog` 通过订单轮询确认支付状态并回写用户态。
  - 支付服务层拆分接口与类型定义（`services/payment/apis.ts + interfaces.ts`）。
- 结果口径：
  - “支付成功闭环耗时降低 X%，支付异常恢复率提升 Y%”。

### 亮点 F：URL 状态即页面状态（可分享、可回放）

- 价值：筛选页/资产页支持深链接分享、刷新保态、前进后退一致。
- 方案：
  - 自研 `hooks/use-url-state` 双向同步 URL 与 React State，并处理循环更新。
  - `video-replica` 通过 `FilterContext` 将多维筛选参数结构化，支持批量更新与重置。
  - 资产页结合 URL 状态 + 防抖搜索 + 懒加载，构建“可回溯查询体验”。
- 结果口径：
  - “筛选行为可分享，提升协作与复现效率；减少状态丢失类反馈 X%”。

### 亮点 G：无限滚动鲁棒性优化

- 价值：避免大屏首屏空白、重复请求、分页错乱。
- 方案：
  - `hooks/use-infinite-list` 实现：竞态版本号、`stateRef` 防闭包、预取缓存、Observer 生命周期治理。
  - 对列表页（Assets/Projects 等）提供统一扩展能力。
- 结果口径：
  - “列表加载稳定性提升，重复请求下降 X%”。

### 亮点 H：模块化服务层与类型治理

- 价值：降低 API 变更风险，提高多人协作效率。
- 方案：
  - `services/*` 按业务域拆分，接口定义与 TS 类型共置。
  - 全项目约 72 个服务文件，形成可维护的 API 边界。
- 结果口径：
  - “接口变更影响范围可控，联调效率提升 X%”。

## 3. 关键技术难点与解决策略（简历可直接写“攻坚点”）

### SSR/CSR 请求环境不一致

- 难点：服务端无浏览器上下文，客户端又存在 locale/cookie 变化。
- 解决：请求拦截分端处理 + middleware 注入 `x-url` 恢复请求语义。

### AI 任务长链路的状态收敛

- 难点：多次轮询、跨接口状态拼接、用户重复触发。
- 解决：统一 Provider 管理状态机，显式区分“首次生成/生成更多”，并在依赖变化时重置状态。

### 上传链路稳定性与用户感知

- 难点：文件类型复杂、上传耗时长、用户取消/重复操作。
- 解决：前置校验 + 进度反馈 + 可取消 + 失败隔离，减少“黑盒等待”。

### 无限滚动竞态与闭包陷阱

- 难点：滚动触发频繁导致重复请求、页码错乱。
- 解决：版本号与 ref 管理最新状态，统一 observer 销毁/重建策略。

### 支付异步回调一致性

- 难点：支付页跳转与结果回写存在时序差。
- 解决：订单轮询 + 成功后刷新用户态，保证权益展示一致。

## 4. 给简历优化 Agent 的“项目描述模板”

### 模板 1（平台型前端）

负责 Oumomo AI 视频平台前端架构与核心模块开发，基于 Next.js 15 + React 19 构建多场景创作工作流；主导统一请求层、国际化路由、上传与支付基础设施，支撑多工具模块快速迭代与稳定上线。

### 模板 2（偏业务结果）

主导 AI 创作平台关键链路（任务生成、素材上传、支付转化）工程化改造：通过 SSR/CSR 一体化请求封装、任务轮询状态机、可取消上传与多通道支付闭环，显著提升长任务稳定性与商业化转化体验。

### 模板 3（偏性能与稳定性）

设计并落地高鲁棒性列表与筛选系统（URL 状态同步 + 无限滚动竞态治理 + 预取缓存），提升复杂数据页面在大屏与弱网场景下的稳定性和可复现性。

## 5. STAR 子弹点（可直接贴简历）

- 设计统一 Axios 基建（签名、鉴权、语言地区透传、SSR/CSR 双端兼容），将多业务接口接入流程标准化，减少重复开发与上下文错配问题。
- 搭建 AI 任务状态机（初始化/轮询/取消/增量生成），把多接口异步流程收敛到单一上下文，提升长任务可观测性与恢复能力。
- 实现媒体上传标准链路（格式时长校验、人脸检测、预签名直传、AbortController 取消），有效降低无效上传与失败重试成本。
- 落地支付闭环（Airwallex + 微信二维码 + 订单轮询），打通下单到权益生效路径，提升支付成功后的状态一致性。
- 构建 URL-Driven Filter 架构与无限滚动优化（竞态版本控制、闭包规避、预取缓存），显著改善复杂筛选页体验与稳定性。

## 6. 关键词池（ATS/Agent 抽取用）

- Next.js App Router
- React 19 / TypeScript
- next-intl
- Axios Interceptors
- SSR/CSR Isomorphic Request Layer
- Ahooks useRequest Polling
- Zustand
- URL State Synchronization
- Infinite Scroll / IntersectionObserver
- Race Condition Handling
- AbortController Upload Cancellation
- Presigned URL Upload
- Face Detection (face-api.js)
- Airwallex / WeChat Pay Integration
- Frontend Architecture / DX / Reliability

## 7. 证据索引（给 Agent 做可追溯引用）

- 请求封装与鉴权跳转：`utils/request.ts`
- i18n 路由与中间件：`i18n/routing.ts`、`i18n/request.ts`、`middleware.ts`
- 任务编排：`app/[locale]/(pure)/video-script/context.tsx`
- 上传与校验：`components/UploadInput/index.tsx`、`hooks/useUploader.ts`、`utils/detectFace.ts`
- 支付能力：`hooks/useAirwallexPayment.ts`、`components/Dialog/WeChatPayDialog/index.tsx`、`services/payment/apis.ts`
- URL 状态：`hooks/use-url-state/index.ts`、`app/[locale]/(pure)/video-replica/_context/FilterContext.tsx`
- 无限滚动：`hooks/use-infinite-list/index.ts`

## 8. 待补充业务数据（建议补充后再投）

- DAU/MAU、活跃创作者数、任务日均提交量
- 上传成功率/失败率变化
- 支付转化率、支付成功率、退款率变化
- 页面性能指标（LCP/TTFB/错误率）
- 需求交付周期、人效提升指标

## 9. 给“简历优化 Agent”的指令建议（可直接粘贴给 Agent）

请基于本文件完成三件事：

1. 生成 3 个版本的项目经历（平台型、商业化增长型、稳定性工程型），每版 4-5 条要点，遵循 STAR，优先使用量化表达。
2. 将“技术亮点”映射到 JD 高频关键词（前端架构、性能优化、支付、国际化、工程化），并给出命中率评估。
3. 输出面试问答清单：每个亮点给出 1 个深挖问题 + 1 个风险问题 + 1 个可落地回答。

约束：

- 不编造数据；无数据处用“区间估计占位符”并提示候选人补齐。
- 用“我主导/我设计/我落地”的责任口径，避免模糊表述。

