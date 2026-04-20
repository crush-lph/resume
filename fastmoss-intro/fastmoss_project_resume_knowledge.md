# FastMoss 前端项目技术亮点与难点沉淀（给简历优化 Agent）

## 1. 项目画像（可做简历开场）

- 项目类型：跨区域、跨语言的 TikTok 电商数据分析平台 Web 前端（Next.js App Router）。
- 技术栈：`Next.js 14 + React 18 + TypeScript + next-intl + Zustand + react-query + ahooks + antd/HeroUI + ECharts`。
- 代码规模（当前仓库快照）：
  - `app/components/hooks/service/store/utils` 共约 `2815` 个文件。
  - `app` 下 `ts/tsx` 文件约 `1585` 个。
  - `service/server` 业务模块目录 `38` 个。
  - 路由白名单/模式定义约 `133` 条（`app/router.ts`）。
  - 多语言 `11` 种（`locales/*`），英文文案键约 `4979`。

## 2. 技术亮点（简历可提炼方向）

### 亮点 A：大规模 App Router 信息架构治理

- 事实证据：
  - 路由结构拆分为 `normalLayout` 与 `pureLayout` 双形态业务域（`app/[locale]/...`）。
  - 统一路由规则与动态参数校验（`app/router.ts` + `middleware.ts`）。
- 可写成的能力标签：
  - 大型多业务域前端架构设计。
  - 动静态混合路由治理与异常路径拦截。
- 业务价值：
  - 降低路由失配导致的 404/SEO 问题，支持持续扩展新业务页。

### 亮点 B：中间件驱动的国际化 + 区域化入口控制

- 事实证据：
  - `next-intl` 中间件接入（`middlewares/intl.ts`）。
  - 语言与地区合法性策略（`middlewares/utils/regionValidator.ts`）。
  - 自定义中间件串联 cookie、重定向、移动端跳转（`middlewares/custom.ts`、`middlewares/redictor.ts`）。
- 可写成的能力标签：
  - 多语言/多地区访问策略设计。
  - PC/H5 双端路由映射与自动重定向。
- 业务价值：
  - 同一套代码支持多市场运营，降低区域策略分叉成本。

### 亮点 C：SSR/CSR 一体化请求基础设施

- 事实证据：
  - 统一 Axios 封装，按运行时自动处理 SSR/CSR 头信息、cookie、来源校验（`utils/axios.ts`）。
  - 请求签名 `fm-sign`、时间戳与随机数注入（`utils/axios.ts`、`utils/cryptParams.ts`）。
- 可写成的能力标签：
  - 全链路请求安全与环境感知封装。
  - 前后端协同签名机制落地。
- 业务价值：
  - 降低非法来源请求风险，提升接口层稳定性与可追踪性。

### 亮点 D：多地区支付编排与结果一致性处理

- 事实证据：
  - 地区化支付通道配置（`common/payment.ts`，覆盖多国家/地区通道）。
  - 支付页与结果轮询闭环（`app/[locale]/(normalLayout)/pay*/order/page.tsx`、`.../check/page.tsx`）。
  - 支付后用户态刷新与权益同步（`store/payUserInfoStore.ts`、`store/provider.tsx`）。
- 可写成的能力标签：
  - 跨支付渠道接入（PayPal/Stripe/Airwallex/本地钱包）。
  - 订单状态轮询与支付后状态收敛。
- 业务价值：
  - 支撑全球化收款路径，减少支付状态不一致带来的客诉。

### 亮点 E：权限系统与用户态同步机制

- 事实证据：
  - 鉴权码到弹窗/文案/操作映射（`hooks/use-checkPermission/use-checkPermission.tsx`）。
  - 基于 `zustand persist` 的用户信息存储与手动 rehydrate（`store/use-user-info.ts`）。
  - 页面可见性变更触发登录态校验（`store/provider.tsx`）。
- 可写成的能力标签：
  - 复杂权限矩阵前端实现。
  - 会话一致性与跨页面状态恢复。
- 业务价值：
  - 降低权限误判和登录态错乱，减少核心路径阻塞。

### 亮点 F：增长分析闭环（多平台埋点聚合）

- 事实证据：
  - 埋点聚合器统一分发至 Google/Facebook/Bing/TikTok/Reddit/LinkedIn（`utils/track/*`）。
  - 支付、注册、试用等关键事件统一上报入口（`utils/track/index.ts`）。
- 可写成的能力标签：
  - 多渠道营销归因埋点架构。
  - 转化漏斗关键事件标准化。
- 业务价值：
  - 提升投放与增长实验可观测性，支持跨平台归因分析。

### 亮点 G：性能与构建优化工程化

- 事实证据：
  - 自定义 webpack `splitChunks`，按 `antd-icons/lodash/echarts/table/commons` 分包（`next.config.mjs`）。
  - 生产环境移除 console、按需开启 source map、bundle analyzer 开关（`next.config.mjs`）。
- 可写成的能力标签：
  - 大型前端应用包体治理。
  - 生产构建稳定性与可观测优化。
- 业务价值：
  - 缩短关键页面加载链路，降低线上调试与构建维护成本。

## 3. 核心难点与解法（面试重点）

### 难点 1：多语言 + 多区域 + 多端重定向组合爆炸

- 难点本质：语言、地区、设备类型三维叠加，路由分支极多，易出现漏判和死链。
- 已采用解法：
  - 统一 matcher 与路由白名单。
  - 策略模式做地区合法性校验（RegionValidator）。
  - detail 页单独处理动态 ID 跳转。

### 难点 2：支付链路状态一致性

- 难点本质：外部支付回调、前端轮询、用户信息缓存三方异步，容易出现“已支付未生效”。
- 已采用解法：
  - 轮询订单状态 + 成功后并发刷新用户信息与权益。
  - store 层拆分主用户态与支付态，降低耦合。

### 难点 3：SSR/CSR 请求上下文差异

- 难点本质：同一接口在服务端和浏览器的 cookie/header 行为不同，且有签名校验。
- 已采用解法：
  - 统一请求拦截器注入 `region/lang/source/fm-sign`。
  - SSR 下透传 `user-agent/referer/x-forwarded-*` 并校验来源 host。

### 难点 4：业务域多、页面多导致可维护性下降

- 难点本质：页面与服务模块持续扩张后，跨域依赖和重复逻辑激增。
- 已采用解法：
  - 服务层按业务域拆分目录。
  - 通用状态、请求、任务调度、埋点抽出公共层。

### 难点 5：工程质量与交付速度平衡

- 现状信号：
  - `next.config.mjs` 开启 `typescript.ignoreBuildErrors: true`。
  - 当前测试文件很少（仅看到区域策略单测）。
- 面试建议话术：
  - 强调“先保交付，再逐步引入质量闸门”的分阶段治理方法：类型错误清零、关键链路补测、CI 阻断策略分批上线。

## 4. 可直接投喂给简历 Agent 的表达模板

### 模板 1（架构类）

- 负责 `Next.js 14` 多业务域平台前端架构，治理约 `133` 条路由规则与 `11` 语种国际化链路，通过中间件策略化校验语言/地区/设备跳转，提升全球多站点访问一致性与可维护性。

### 模板 2（基础设施类）

- 设计 SSR/CSR 一体化请求层，统一注入签名、语言、地区与来源校验，落地 `fm-sign` 安全机制并封装通用 API 调用规范，降低接口风险并提升跨端开发效率。

### 模板 3（支付增长类）

- 搭建跨区域支付编排能力（PayPal/Stripe/Airwallex/本地钱包），实现订单轮询、支付回执与用户权益同步闭环，支撑多市场商业化转化路径。

### 模板 4（增长数据类）

- 构建多平台埋点聚合层（Google/Facebook/Bing/TikTok/Reddit/LinkedIn），统一注册/试用/支付关键事件，提升投放归因和增长实验数据可用性。

### 模板 5（性能工程类）

- 基于 webpack `splitChunks` 制定分包策略（`echarts/lodash/antd-icons/table/commons`），并结合生产日志裁剪与构建分析机制优化前端包体与加载性能。

## 5. 给简历 Agent 的使用注意

- 文档中的规模数字来自代码扫描，可直接用于“复杂度证明”，不等于线上业务结果。
- 最终简历优先补充真实业务指标：如支付成功率、转化率、页面加载时长、故障率、发布频次。
- 如果目标岗位偏“架构/Tech Lead”，放大 A/B/C/G；若偏“商业化增长”，放大 D/F。
