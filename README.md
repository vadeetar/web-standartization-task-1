# web-standartization

Решение задания 1 на основе [исходного репозитория преподавателя](https://gitverse.ru/50jun/web-standartization).

Задание: выделить предметную область, абстракцию сохранения и абстракцию почтового уведомления.

Рефакторинг создания заказа с разделением ответственностей:

- `domain/Order.js` — предметная область: непустой заказ, сумма позиций и скидка 5% при сумме строго больше 10 000.
- `application/CreateOrder.js` — сценарий: создать заказ, сохранить, затем уведомить пользователя. Зависит от контрактов `save(order)` и `notify(email)`, а не от SQL или SMTP.
- `infrastructure/SqlOrderRepository.js` — сохранение через переданный клиент БД.
- `infrastructure/SmtpOrderNotifier.js` — уведомление через переданный SMTP-клиент.
- `createOrder.js` — HTTP-адаптер: чтение запроса и формирование ответа.

Контракты зависимостей заданы структурно: для замены хранилища или канала уведомлений достаточно передать объект с соответствующим методом. Наследование не требуется.

## Подключение

```js
const { CreateOrder } = require("./application/CreateOrder");
const { SqlOrderRepository } = require("./infrastructure/SqlOrderRepository");
const { SmtpOrderNotifier } = require("./infrastructure/SmtpOrderNotifier");
const { makeCreateOrderHandler } = require("./createOrder");

// db и smtp — настроенные клиентские объекты приложения.
const createOrder = makeCreateOrderHandler(new CreateOrder({
  orderRepository: new SqlOrderRepository(db),
  orderNotifier: new SmtpOrderNotifier(smtp),
}));

// Зарегистрируйте createOrder в используемом HTTP-фреймворке.
// Как и в исходном примере, req.body содержит JSON-строку,
// а req.user — объект с id и email.
```

Сохранены ответы `400 / empty` и `201 / { total }`, SQL-запрос и текст письма. Ошибки БД и SMTP передаются вызывающему коду. Как и прежде, ошибка SMTP возникает после сохранения заказа; транзакции и повторная доставка в задачу не входят.

## Проверка

Требуется Node.js 18 или новее. Внешних зависимостей нет.

```sh
node --test
```

