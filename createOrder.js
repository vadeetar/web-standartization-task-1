const { EmptyOrderError } = require("./domain/Order");

function makeCreateOrderHandler(createOrder) {
  return async function createOrderHandler(req, res) {
    const body = JSON.parse(req.body);
    let order;
    try {
      order = await createOrder.execute({ user: req.user, items: body.items });
    } catch (error) {
      if (error instanceof EmptyOrderError) {
        return res.status(400).send("empty");
      }
      throw error;
    }
    return res.status(201).send(JSON.stringify({ total: order.total }));
  };
}

module.exports = { makeCreateOrderHandler };
