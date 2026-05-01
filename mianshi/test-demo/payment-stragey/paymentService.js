class PaymentService {
  createOrder(channel) {
    const strategy = paymentStrategyRegister.get(channel);
    return strategy.createOrder();
  }

  pay(channel) {
    const strategy = paymentStrategyRegister.get(channel);
    return strategy.pay();
  }

  queryStatus(channel) {
    const strategy = paymentStrategyRegister.get(channel);
    return strategy.queryStatus();
  }

  cancel(channel) {
    const strategy = paymentStrategyRegister.get(channel);
    return strategy.cancel();
  }
}

export default PaymentService;
