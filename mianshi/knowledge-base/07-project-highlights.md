# 项目亮点与综合能力

## 支付系统：策略模式抹平多渠道差异

### 面试官想考什么

- 你是否只会“接 SDK”，还是能把支付链路抽象成可扩展的业务基础设施。
- 你是否清楚前端在支付系统里的职责边界。
- 你是否能处理多渠道差异、异步回调、订单轮询、权益刷新和异常兜底。
- 你是否能解释“为什么新渠道接入周期能缩短到约 0.5 天”。

### 正确答案主线

前端不负责最终资金安全和订单最终状态，最终状态以后端订单和支付渠道回调为准。前端主要负责套餐选择、订单创建、渠道选择、SDK 或二维码调起、订单状态轮询、结果页展示、异常提示、用户权益刷新和关键埋点。

FastMoss 支付系统接入了微信、支付宝、Stripe、PayPal、Airwallex 等渠道。不同渠道在支付形态、参数结构、回调方式、异常码、地区和币种限制上差异较大。如果业务页面直接写大量 `if / else`，后续新增渠道和排查问题都会很困难。

所以可以把支付拆成两层：

- 业务层：统一处理创建订单、发起支付、查询状态、处理结果、刷新权益、埋点上报。
- 渠道层：封装二维码、跳转收银台、SDK 初始化、参数映射、异常码映射等差异。

### 核心设计

```ts
type PaymentChannel = 'wechat' | 'alipay' | 'stripe' | 'paypal' | 'airwallex';

type PaymentStatus =
  | 'idle'
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'expired';

interface CreateOrderParams {
  productId: string;
  planId: string;
  channel: PaymentChannel;
  currency: string;
  region: string;
  returnUrl?: string;
  cancelUrl?: string;
}

interface PaymentOrder {
  orderId: string;
  channel: PaymentChannel;
  amount: number;
  currency: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  qrCodeUrl?: string;
  clientSecret?: string;
  sdkParams?: Record<string, unknown>;
}

interface PayResult {
  orderId: string;
  status: PaymentStatus;
  raw?: unknown;
}

interface PaymentStrategy {
  channel: PaymentChannel;
  createOrder(params: CreateOrderParams): Promise<PaymentOrder>;
  pay(order: PaymentOrder): Promise<PayResult>;
  queryStatus(orderId: string): Promise<PaymentStatus>;
  cancel?(orderId: string): Promise<void>;
}
```

面试表达：

> 我会把不同支付渠道都实现成 `PaymentStrategy`。业务层只依赖统一接口，不关心底层是跳转 Stripe Checkout、展示微信二维码，还是初始化 Airwallex SDK。这样新增渠道时，只需要新增一个 strategy 和少量渠道配置，公共订单页、轮询、结果页、权益刷新和埋点都可以复用。

### 策略注册表

```ts
class PaymentStrategyRegistry {
  private strategies = new Map<PaymentChannel, PaymentStrategy>();

  register(strategy: PaymentStrategy) {
    this.strategies.set(strategy.channel, strategy);
  }

  get(channel: PaymentChannel) {
    const strategy = this.strategies.get(channel);

    if (!strategy) {
      throw new Error(`Unsupported payment channel: ${channel}`);
    }

    return strategy;
  }
}

const paymentRegistry = new PaymentStrategyRegistry();
```

### 渠道示例：Stripe Checkout

```ts
class StripeStrategy implements PaymentStrategy {
  channel: PaymentChannel = 'stripe';

  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    const res = await paymentApi.createOrder({
      ...params,
      channel: this.channel,
    });

    return {
      orderId: res.orderId,
      channel: this.channel,
      amount: res.amount,
      currency: res.currency,
      status: 'pending',
      checkoutUrl: res.checkoutUrl,
    };
  }

  async pay(order: PaymentOrder): Promise<PayResult> {
    if (!order.checkoutUrl) {
      throw new Error('Stripe checkout requires checkoutUrl');
    }

    window.location.href = order.checkoutUrl;

    return {
      orderId: order.orderId,
      status: 'processing',
    };
  }

  async queryStatus(orderId: string): Promise<PaymentStatus> {
    const res = await paymentApi.queryOrderStatus(orderId);
    return normalizePaymentStatus(res.status);
  }
}
```

### 渠道示例：微信二维码支付

```ts
class WechatPayStrategy implements PaymentStrategy {
  channel: PaymentChannel = 'wechat';

  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    const res = await paymentApi.createOrder({
      ...params,
      channel: this.channel,
    });

    return {
      orderId: res.orderId,
      channel: this.channel,
      amount: res.amount,
      currency: res.currency,
      status: 'pending',
      qrCodeUrl: res.qrCodeUrl,
    };
  }

  async pay(order: PaymentOrder): Promise<PayResult> {
    if (!order.qrCodeUrl) {
      throw new Error('Wechat pay requires qrCodeUrl');
    }

    return {
      orderId: order.orderId,
      status: 'processing',
    };
  }

  async queryStatus(orderId: string): Promise<PaymentStatus> {
    const res = await paymentApi.queryOrderStatus(orderId);
    return normalizePaymentStatus(res.status);
  }
}
```

### 统一支付服务

```ts
class PaymentService {
  async createOrder(params: CreateOrderParams) {
    const strategy = paymentRegistry.get(params.channel);
    return strategy.createOrder(params);
  }

  async pay(order: PaymentOrder) {
    const strategy = paymentRegistry.get(order.channel);
    return strategy.pay(order);
  }

  async queryStatus(order: PaymentOrder) {
    const strategy = paymentRegistry.get(order.channel);
    return strategy.queryStatus(order.orderId);
  }
}

const paymentService = new PaymentService();

paymentRegistry.register(new StripeStrategy());
paymentRegistry.register(new WechatPayStrategy());
```

### 状态轮询与权益刷新

```ts
async function pollPaymentStatus(
  order: PaymentOrder,
  options: {
    interval?: number;
    timeout?: number;
    onSuccess?: () => Promise<void>;
    onFailed?: (status: PaymentStatus) => void;
  } = {},
) {
  const interval = options.interval ?? 2000;
  const timeout = options.timeout ?? 120000;
  const start = Date.now();

  return new Promise<PaymentStatus>((resolve) => {
    const timer = window.setInterval(async () => {
      const status = await paymentService.queryStatus(order);

      if (status === 'success') {
        window.clearInterval(timer);
        await options.onSuccess?.();
        resolve(status);
        return;
      }

      if (['failed', 'cancelled', 'expired'].includes(status)) {
        window.clearInterval(timer);
        options.onFailed?.(status);
        resolve(status);
        return;
      }

      if (Date.now() - start > timeout) {
        window.clearInterval(timer);
        resolve('processing');
      }
    }, interval);
  });
}
```

面试表达：

> 支付成功不能只相信前端回调，因为用户可能关闭页面、SDK 回调可能丢失、跳转返回参数也不一定可信。所以前端以服务端订单状态为准，通过轮询收敛状态。订单成功后再刷新用户信息和会员权益，避免“已支付但权益未生效”。

### 状态归一化

```ts
function normalizePaymentStatus(rawStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    CREATED: 'pending',
    PENDING: 'pending',
    PROCESSING: 'processing',
    PAID: 'success',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
  };

  return statusMap[rawStatus] ?? 'failed';
}
```

### 完整面试回答

> 我在 FastMoss 里把支付系统作为跨区域商业化能力来做，不只是简单接 SDK。前端主要负责套餐选择、订单创建、渠道选择、SDK 或二维码调起、订单状态轮询、结果页展示、异常兜底、用户权益刷新和支付埋点。最终资金安全和订单状态以后端和支付渠道回调为准。  
>  
> 当时接入了微信、支付宝、Stripe、PayPal、Airwallex 等渠道，不同渠道在支付形态、参数结构、回调方式、异常码、地区和币种限制上差异比较大。如果都写在业务页面里，会出现大量 `if / else`，后期新增渠道和排查问题都很困难。  
>  
> 所以我用策略模式做了一层支付渠道抽象。业务层只关心创建订单、发起支付、查询状态和处理结果；具体是跳转收银台、弹 SDK、展示二维码，还是打开新窗口，都放到各自的渠道策略里。公共的订单页、轮询、结果页、异常提示、权益刷新和埋点逻辑都复用。新增渠道时主要新增一个 strategy、渠道配置、参数映射和异常码映射，新渠道接入周期可以缩短到约 0.5 天。  
>  
> 另外我重点处理了支付状态一致性问题。因为不能只相信前端回调，用户可能关闭页面、网络中断、回调丢失，导致已支付但权益未生效。所以我们通过订单轮询收敛状态，支付成功后再刷新用户信息和会员权益；失败、取消、超时、订单过期等情况统一映射成业务状态，并提供重新支付或重新下单入口。

### 常见追问

**策略模式解决了什么？**

解决多渠道差异扩散的问题。把微信、支付宝、Stripe、PayPal、Airwallex 的差异封装到各自策略里，业务层只依赖统一支付接口。

**前端能不能直接判断支付成功？**

不能。前端可以做体验上的成功提示，但最终状态要以后端订单状态和支付渠道回调为准。前端收到回调后也应该查询订单状态，确认成功后再刷新权益。

**为什么新渠道能约 0.5 天接入？**

因为订单页、结果页、轮询、权益刷新、异常提示和埋点是公共链路。新增渠道时主要补渠道配置、参数映射、SDK 调起逻辑和异常码映射。

完整示例代码见：[payment-strategy.ts](../code-examples/payment-strategy.ts)

## Vibe Coding 在团队内如何落地

### 面试官想考什么

- 你是否只是个人用 AI 写代码，还是能把 AI 融入团队研发流程。
- 你是否知道 AI 代码的风险边界。
- 你是否能讲清提效、质量和治理之间的平衡。

### 正确答案主线

Vibe Coding 不是让 AI 直接替代开发，而是把 AI 放进需求拆解、代码生成、重构、测试补全、Code Review 和文档沉淀流程中。核心原则是：AI 可以提效，但最终代码质量、架构一致性和线上风险仍然由工程师负责。

### 团队落地方式

- 个人提效：用 Copilot、Claude Code、Cursor 辅助生成样板代码、TypeScript 类型、单测、工具函数、组件初稿。
- 流程提效：需求评审后让 AI 辅助拆任务、列边界条件、列风险点；提交前让 AI 做自查。
- Review 提效：让 AI 根据 diff 先扫低级问题，例如类型缺失、异常分支、SSR/CSR 边界、性能风险。
- 规范沉淀：把项目规范、组件约束、接口规范、错误处理、常用 prompt 整理成模板或知识库。
- 风险控制：AI 生成代码必须小步提交，经过 TypeScript、Lint、测试、构建和人工 Review。

### 完整面试回答

> 我理解的 Vibe Coding 不是让 AI 直接替代工程师写代码，而是把 AI 融入研发流程，提升需求拆解、代码生成、重构、测试和 Review 的效率。  
>  
> 在团队落地时，我会分三层。第一层是个人提效，用 Copilot、Claude Code、Cursor 辅助生成样板代码、类型、单测和组件初稿。第二层是流程提效，在需求评审、开发、自测、Code Review 阶段引入 AI，让它辅助列边界条件、风险点和测试点。第三层是规范沉淀，把项目规范、常用 prompt、组件约束、接口约束沉淀成模板或知识库，让 AI 输出更贴合项目。  
>  
> 同时我会控制风险：AI 生成的代码必须小步提交，经过 TypeScript、Lint、测试、构建和人工 Review。涉及登录、权限、支付、SSR、SEO 等核心链路时，AI 只作为辅助，不能直接合入。最终目标不是炫技，而是在不降低质量的前提下减少重复劳动、提升交付效率。

### 常见追问

**怎么保证 AI 代码质量？**

从输入、输出、工程校验、上线控制四层保证。输入上提供项目上下文和约束；输出上要求小步 diff；工程上必须过类型、Lint、测试和构建；上线时对核心链路做灰度、监控和回滚预案。

**踩过什么坑？**

AI 容易生成“看起来合理但不符合项目上下文”的代码，比如重复造工具函数、忽略已有封装、SSR/CSR 边界不准确、接口字段猜错。所以复杂需求要先让 AI 读代码和规范，再做小范围修改。

**如何衡量收益？**

看需求开发周期、样板代码时间、PR 低级问题数量、单测和文档覆盖、线上缺陷率。AI 提效不能以质量下降为代价。

## 从 0 到 1 设计项目架构需要考虑什么

### 面试官想考什么

- 你是否能从业务目标出发设计架构，而不是直接堆技术栈。
- 你是否能考虑长期维护、多人协作、性能、安全、质量和上线运维。
- 你是否具备前端负责人视角。

### 正确答案主线

从 0 到 1 设计项目架构，不能先直接选框架，而要先明确业务形态和约束：项目是否需要 SEO、是否是后台系统、是否多语言多地区、是否有支付和权限、是否有 AI 长任务或上传场景、团队规模和交付节奏如何。

明确业务目标后，再做技术选型、分层设计和工程体系建设。架构的价值不是炫技，而是在满足当前业务交付的同时，给后续扩展、多人协作和问题排查留下清晰边界。

### 需要考虑的事情

- 业务目标：官网、营销页、后台系统、数据平台、AI 产品、跨境 SaaS、移动端项目的侧重点不同。
- 技术选型：Next.js 适合 SSR、SEO、服务端能力；Vite + React 适合 SPA 和后台系统；TypeScript 适合多人协作。
- 目录结构：拆清楚路由层、页面层、业务模块层、组件层、请求层、状态层、工具层。
- 请求层：统一 baseURL、鉴权、错误码、超时、重试、请求取消、SSR/CSR 上下文差异。
- 状态管理：区分服务端状态、全局客户端状态和局部 UI 状态。
- 组件体系：区分基础组件、业务组件和页面模块，不要过早抽象。
- 权限安全：前端做体验和展示控制，最终权限校验必须在服务端。
- 性能体验：路由拆包、懒加载、图片优化、字体优化、长列表、图表按需加载、FCP/LCP/INP 监控。
- 质量体系：TypeScript、ESLint、Prettier、Git Hooks、Code Review、单测、E2E、CI/CD。
- 可观测性：错误监控、性能监控、接口耗时、业务埋点、灰度发布、回滚方案。

### 完整面试回答

> 从 0 到 1 设计项目架构，我会先看业务形态和约束，而不是直接选技术栈。比如项目是否需要 SEO、是否有后台复杂表单和表格、是否多语言多地区、是否涉及支付和权限、是否有 AI 长任务或上传场景、团队规模和交付节奏怎样。  
>  
> 明确业务目标后，我会做技术选型和分层设计。比如需要 SEO 和首屏性能可以选 Next.js；偏后台系统可以选 Vite + React；多人协作一定引入 TypeScript、Lint、格式化和基础 CI。架构上会拆清楚路由层、页面层、业务模块层、组件层、请求层、状态层和工具层，避免业务逻辑散落。  
>  
> 请求层会统一处理鉴权、错误码、超时、重试、SSR/CSR 上下文差异；状态管理会区分服务端状态、全局客户端状态和局部 UI 状态；组件体系会区分通用组件和业务组件；权限会区分前端展示控制和服务端最终校验。  
>  
> 同时我会提前考虑性能、监控、埋点、测试和发布流程。比如路由拆包、图片优化、懒加载、错误监控、性能指标、核心链路埋点、Code Review、CI/CD、灰度和回滚。好的架构不是一开始设计得很复杂，而是在满足当前业务交付的同时，给后续扩展、多人协作和问题排查留下清晰边界。

### 常见追问

**为什么不能先选技术栈？**

技术选型要服务业务。官网、后台、AI 工具、跨境 SaaS、移动端项目的核心矛盾不一样，先选技术容易变成工具驱动，而不是问题驱动。

**状态管理怎么选？**

接口数据优先交给 React Query / SWR 这类服务端状态库；用户信息、权限、语言、主题、支付状态等跨页面共享状态可以放 Zustand / Redux；局部交互状态用 `useState` 或 `useReducer`。

**质量体系一开始就要拉满吗？**

不一定。要分阶段治理，核心链路先加测试和 CI 阻断，非核心模块逐步补齐。项目初期过重的流程会影响交付，但完全没有质量门禁也会积累风险。

