async function createOrder(req, res) {
    
  const body = JSON.parse(req.body);                    // HTTP
  if (!body.items.length) return res.status(400).send("empty"); // HTTP
  let total = 0;
  for (const i of body.items) total += i.price * i.qty; // предметная область
  if (total > 10000) total *= 0.95;                     // предметная область
  await db.query("INSERT INTO orders (user_id, total) VALUES ($1, $2)",
                 [req.user.id, total]);                 // хранилище
  await smtp.send(req.user.email, "Заказ принят");      // почта
  res.status(201).send(JSON.stringify({ total }));      // HTTP
}