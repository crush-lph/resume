/**
 * 支付渠道策略模式示例
 *
 * 面试表达重点：
 * 1. 业务层只关心统一支付流程：创建订单、发起支付、查询状态、刷新权益。
 * 2. 渠道层负责封装差异：二维码、跳转收银台、SDK 初始化、异常码映射等。
 * 3. 新增渠道时只新增一个 Strategy，不改订单页、结果页、轮询和权益刷新等公共逻辑。
 */

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

  /**
   * 不同渠道返回的扩展字段：
   * - Stripe / PayPal 可能返回 checkoutUrl
   * - 微信 / 支付宝扫码可能返回 qrCodeUrl
   * - Airwallex / Stripe Payment Element 可能返回 clientSecret
   */
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

/**
 * 支付策略统一接口
 *
 * 每个支付渠道都实现这组方法，业务层不需要关心底层渠道差异。
 */
interface PaymentStrategy {
  channel: PaymentChannel;

  createOrder(params: CreateOrderParams): Promise<PaymentOrder>;

  pay(order: PaymentOrder): Promise<PayResult>;

  queryStatus(orderId: string): Promise<PaymentStatus>;

  cancel?(orderId: string): Promise<void>;
}

/**
 * 策略注册表
 *
 * 用 channel 找到对应策略，避免业务页面写大量 if / switch。
 */
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

/**
 * 微信二维码支付策略
 *
 * 常见流程：
 * 1. 后端创建订单并返回二维码地址。
 * 2. 前端展示二维码。
 * 3. 前端轮询服务端订单状态。
 */
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

    /**
     * 二维码支付通常不是在 pay() 里直接完成。
     * pay() 只负责进入 processing 状态，UI 层拿 qrCodeUrl 展示二维码并启动轮询。
     */
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

/**
 * Stripe Checkout 策略
 *
 * 常见流程：
 * 1. 后端创建 Checkout Session。
 * 2. 后端返回 checkoutUrl。
 * 3. 前端跳转到 Stripe 收银台。
 * 4. 用户支付后回到 returnUrl，结果页再查询服务端订单状态。
 */
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

/**
 * Airwallex SDK 策略
 *
 * 常见流程：
 * 1. 后端创建支付单并返回 clientSecret / SDK 参数。
 * 2. 前端加载 Airwallex SDK。
 * 3. 调用 SDK 确认支付。
 * 4. 即使 SDK 返回成功，也再次查询服务端订单状态。
 */
class AirwallexStrategy implements PaymentStrategy {
  channel: PaymentChannel = 'airwallex';

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
      clientSecret: res.clientSecret,
      sdkParams: res.sdkParams,
    };
  }

  async pay(order: PaymentOrder): Promise<PayResult> {
    if (!order.clientSecret) {
      throw new Error('Airwallex requires clientSecret');
    }

    await loadAirwallexSdk();

    const result = await airwallexClient.confirmPayment({
      clientSecret: order.clientSecret,
      ...order.sdkParams,
    });

    if (result.status === 'succeeded') {
      return {
        orderId: order.orderId,
        status: 'success',
        raw: result,
      };
    }

    return {
      orderId: order.orderId,
      status: 'processing',
      raw: result,
    };
  }

  async queryStatus(orderId: string): Promise<PaymentStatus> {
    const res = await paymentApi.queryOrderStatus(orderId);
    return normalizePaymentStatus(res.status);
  }
}

/**
 * 支付服务层
 *
 * 页面和 Hook 只调用 PaymentService，不直接操作具体策略。
 */
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

  async cancel(order: PaymentOrder) {
    const strategy = paymentRegistry.get(order.channel);

    if (strategy.cancel) {
      await strategy.cancel(order.orderId);
    }
  }
}

const paymentService = new PaymentService();

/**
 * 订单状态轮询
 *
 * 支付成功不能只相信前端回调：
 * - 用户可能关闭页面
 * - SDK 回调可能丢失
 * - 跳转返回参数可能不可信
 *
 * 所以需要以前端轮询服务端订单状态作为收敛手段。
 */
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

/**
 * 统一订单状态映射
 *
 * 不同渠道 / 后端返回的状态码可能不一致，业务层只处理统一状态。
 */
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

/**
 * 渠道注册
 *
 * 新增渠道时：
 * 1. 新增一个 Strategy。
 * 2. 注册到 paymentRegistry。
 * 3. 补充渠道配置、参数映射和异常码映射。
 */
paymentRegistry.register(new WechatPayStrategy());
paymentRegistry.register(new StripeStrategy());
paymentRegistry.register(new AirwallexStrategy());

/**
 * 业务调用示例
 */
async function startPaymentExample() {
  const order = await paymentService.createOrder({
    productId: 'fastmoss-pro',
    planId: 'monthly',
    channel: 'stripe',
    currency: 'USD',
    region: 'US',
    returnUrl: `${window.location.origin}/pay/check`,
    cancelUrl: `${window.location.origin}/pay/cancel`,
  });

  const result = await paymentService.pay(order);

  if (result.status === 'processing') {
    await pollPaymentStatus(order, {
      onSuccess: async () => {
        /**
         * 支付成功后刷新用户态和权益。
         * 面试里可以强调：前端不直接发权益，而是重新拉服务端确认后的用户信息。
         */
        await userService.refreshUserInfo();
        await userService.refreshEntitlements();
      },
    });
  }
}

/**
 * 以下是示例依赖声明，用来让这个文件表达完整。
 * 实际项目中会替换成真实的 API、SDK 和用户服务。
 */
const paymentApi = {
  async createOrder(
    params: CreateOrderParams,
  ): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    checkoutUrl?: string;
    qrCodeUrl?: string;
    clientSecret?: string;
    sdkParams?: Record<string, unknown>;
  }> {
    return {
      orderId: `order_${Date.now()}`,
      amount: 99,
      currency: params.currency,
      status: 'PENDING',
      checkoutUrl: params.channel === 'stripe' ? 'https://checkout.stripe.com/example' : undefined,
      qrCodeUrl: params.channel === 'wechat' ? 'https://example.com/wechat-qr.png' : undefined,
      clientSecret: params.channel === 'airwallex' ? 'client_secret_example' : undefined,
      sdkParams: params.channel === 'airwallex' ? { currency: params.currency } : undefined,
    };
  },

  async queryOrderStatus(_orderId: string): Promise<{ status: string }> {
    return {
      status: 'SUCCESS',
    };
  },
};

async function loadAirwallexSdk() {
  return Promise.resolve();
}

const airwallexClient = {
  async confirmPayment(
    _params: Record<string, unknown>,
  ): Promise<{ status: 'succeeded' | 'processing' | 'failed' }> {
    return {
      status: 'succeeded',
    };
  },
};

const userService = {
  async refreshUserInfo() {
    return Promise.resolve();
  },

  async refreshEntitlements() {
    return Promise.resolve();
  },
};

