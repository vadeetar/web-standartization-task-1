class EmptyOrderError extends Error {
  constructor() {
    super("empty");
    this.name = "EmptyOrderError";
  }
}

class Order {
  constructor(userId, items) {
    if (!items.length) throw new EmptyOrderError();
    this.userId = userId;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    this.total = subtotal > 10000 ? subtotal * 0.95 : subtotal;
  }
}

module.exports = { Order, EmptyOrderError };
