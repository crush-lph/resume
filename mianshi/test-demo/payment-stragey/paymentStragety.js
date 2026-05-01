// 策略注册类
class PaymentStrategyRegister {
  strategies = new Map();

  register(channel) {
    this.strategies.set(strategy.channel, strategy);
  }

  get() {}
}

const paymentStrategyRegister = new PaymentStrategyRegister();

export default paymentStrategyRegister;
