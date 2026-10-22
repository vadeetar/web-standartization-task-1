const { Order } = require("../domain/Order");

class CreateOrder {
  // orderRepository: { save(order): Promise<void> }
  // orderNotifier: { notify(email): Promise<void> }
  constructor({ orderRepository, orderNotifier }) {
    this.orderRepository = orderRepository;
    this.orderNotifier = orderNotifier;
  }

  async execute({ user, items }) {
    const order = new Order(user.id, items);
    await this.orderRepository.save(order);
    await this.orderNotifier.notify(user.email);
    return order;
  }
}

module.exports = { CreateOrder };
