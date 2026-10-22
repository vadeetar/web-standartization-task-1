class SqlOrderRepository {
  constructor(db) {
    this.db = db;
  }

  async save(order) {
    await this.db.query(
      "INSERT INTO orders (user_id, total) VALUES ($1, $2)",
      [order.userId, order.total],
    );
  }
}

module.exports = { SqlOrderRepository };
