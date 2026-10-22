const test = require("node:test");
const assert = require("node:assert/strict");
const { Order } = require("../domain/Order");
const { CreateOrder } = require("../application/CreateOrder");
const { SqlOrderRepository } = require("../infrastructure/SqlOrderRepository");
const { SmtpOrderNotifier } = require("../infrastructure/SmtpOrderNotifier");
const { makeCreateOrderHandler } = require("../createOrder");

for (const [name, items, total] of [
  ["суммирует позиции с учётом количества", [{ price: 100, qty: 2 }, { price: 50, qty: 3 }], 350],
  ["не применяет скидку на границе 10 000", [{ price: 5000, qty: 2 }], 10000],
  ["применяет скидку 5% выше 10 000", [{ price: 6000, qty: 2 }], 11400],
]) {
  test(name, () => assert.equal(new Order(7, items).total, total));
}

function setup({ dbError, smtpError } = {}) {
  const calls = [];
  const service = new CreateOrder({
    orderRepository: new SqlOrderRepository({
      async query(sql, params) {
        calls.push(["db", sql, params]);
        await Promise.resolve();
        if (dbError) throw dbError;
        calls.push(["saved"]);
      },
    }),
    orderNotifier: new SmtpOrderNotifier({
      async send(email, message) {
        calls.push(["smtp", email, message]);
        if (smtpError) throw smtpError;
      },
    }),
  });
  const res = {
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; return this; },
  };
  const req = {
    user: { id: 7, email: "customer@example.com" },
    body: JSON.stringify({ items: [{ price: 6000, qty: 2 }] }),
  };
  return { handler: makeCreateOrderHandler(service), calls, req, res };
}

test("пустой заказ: HTTP 400, без сохранения и письма", async () => {
  const { handler, calls, req, res } = setup();
  req.body = JSON.stringify({ items: [] });
  await handler(req, res);
  assert.equal(res.code, 400);
  assert.equal(res.body, "empty");
  assert.deepEqual(calls, []);
});

test("заказ сохраняется до письма и возвращает исходный HTTP-ответ", async () => {
  const { handler, calls, req, res } = setup();
  await handler(req, res);
  assert.equal(res.code, 201);
  assert.equal(res.body, JSON.stringify({ total: 11400 }));
  assert.deepEqual(calls, [
    ["db", "INSERT INTO orders (user_id, total) VALUES ($1, $2)", [7, 11400]],
    ["saved"],
    ["smtp", "customer@example.com", "Заказ принят"],
  ]);
});

test("ошибка БД передаётся вызывающему коду, письмо не отправляется", async () => {
  const error = new Error("database unavailable");
  const { handler, calls, req, res } = setup({ dbError: error });
  await assert.rejects(handler(req, res), (actual) => actual === error);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "db");
  assert.equal(res.code, undefined);
});

test("ошибка SMTP после сохранения передаётся вызывающему коду", async () => {
  const error = new Error("smtp unavailable");
  const { handler, calls, req, res } = setup({ smtpError: error });
  await assert.rejects(handler(req, res), (actual) => actual === error);
  assert.deepEqual(calls.map(([event]) => event), ["db", "saved", "smtp"]);
  assert.equal(res.code, undefined);
});
