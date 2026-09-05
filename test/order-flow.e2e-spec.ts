import 'tsconfig-paths/register';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Order Flow (e2e)', () => {
  let app: INestApplication<App>;
  let httpServer: App;
  let categoryId: number;
  let dishIds: number[];
  const runId = Date.now();

  const unique = (name: string) =>
    `${name}-${runId}-${Math.floor(Math.random() * 1000000)}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    httpServer = app.getHttpServer();
    await seedBaseData();
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedBaseData() {
    const category = await createCategory();
    categoryId = category.body.id;

    const firstDish = await createDish({ name: unique('Test dish 1'), price: 10000 });
    const secondDish = await createDish({ name: unique('Test dish 2'), price: 20000 });
    const thirdDish = await createDish({ name: unique('Test dish 3'), price: 30000 });

    dishIds = [firstDish.body.id, secondDish.body.id, thirdDish.body.id];
  }

  async function createCategory(body: Record<string, unknown> = {}) {
    return request(httpServer)
      .post('/categories')
      .send({
        name: unique('Test category'),
        ...body,
      })
      .expect(201);
  }

  async function createDish(body: Record<string, unknown> = {}) {
    return request(httpServer)
      .post('/dishes')
      .send({
        name: unique('Test dish'),
        price: 10000,
        available: '1',
        categoryId,
        ...body,
      })
      .expect(201);
  }

  async function createTable(body: Record<string, unknown> = {}) {
    return request(httpServer)
      .post('/tables')
      .send({
        name: unique('Table'),
        capacity: 4,
        ...body,
      })
      .expect(201);
  }

  async function createOrder(tableId: number, body: Record<string, unknown> = {}) {
    return request(httpServer)
      .post('/orders')
      .send({
        tableId,
        ...body,
      })
      .expect(201);
  }

  async function createOrderItem(
    orderId: number,
    dishId = dishIds[0],
    body: Record<string, unknown> = {},
  ) {
    return request(httpServer)
      .post('/order-items')
      .send({
        orderId,
        dishId,
        quantity: 1,
        note: 'Test note',
        ...body,
      })
      .expect(201);
  }

  async function createOrderWithItem() {
    const table = await createTable();
    const order = await createOrder(table.body.id);
    const orderItem = await createOrderItem(order.body.id);

    return {
      table: table.body,
      order: order.body,
      orderItem: orderItem.body,
    };
  }

  function confirmOrderItem(id: number) {
    return request(httpServer).patch(`/order-items/${id}/confirm`).send();
  }

  function cookingOrderItem(id: number) {
    return request(httpServer).patch(`/order-items/${id}/cooking`).send();
  }

  function readyOrderItem(id: number) {
    return request(httpServer).patch(`/order-items/${id}/ready`).send();
  }

  function servedOrderItem(id: number) {
    return request(httpServer).patch(`/order-items/${id}/served`).send();
  }

  function cancelOrderItem(id: number) {
    return request(httpServer).patch(`/order-items/${id}/cancel`).send();
  }

  function cancelOrder(id: number) {
    return request(httpServer).patch(`/orders/${id}/cancel`).send();
  }

  function payOrder(id: number, body: Record<string, unknown> = {}) {
    return request(httpServer).patch(`/orders/${id}/pay`).send(body);
  }

  function getOrderItemTotal(orderId: number) {
    return request(httpServer).get(`/order-items/order/${orderId}/total`).send();
  }

  async function getOrder(id: number) {
    return request(httpServer).get(`/orders/${id}`).expect(200);
  }

  async function getTable(id: number) {
    return request(httpServer).get(`/tables/${id}`).expect(200);
  }

  async function makeConfirmedOrder() {
    const data = await createOrderWithItem();
    await confirmOrderItem(data.orderItem.id).expect(200);
    return data;
  }

  async function makeCookingOrder() {
    const data = await makeConfirmedOrder();
    await cookingOrderItem(data.orderItem.id).expect(200);
    return data;
  }

  async function makeReadyOrder() {
    const data = await makeCookingOrder();
    await readyOrderItem(data.orderItem.id).expect(200);
    return data;
  }

  async function makeServedOrder() {
    const data = await makeReadyOrder();
    await servedOrderItem(data.orderItem.id).expect(200);
    return data;
  }

  describe('Table and order rules', () => {
    it('creates an order and changes table status to OCCUPIED', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      const updatedTable = await getTable(table.body.id);

      expect(order.body.status).toBe('PENDING');
      expect(updatedTable.body.status).toBe('OCCUPIED');
    });

    it('does not allow creating a second order on an OCCUPIED table', async () => {
      const table = await createTable();
      await createOrder(table.body.id);

      await request(httpServer)
        .post('/orders')
        .send({ tableId: table.body.id })
        .expect(400);
    });

    it('releases the table when an order is cancelled', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);

      await cancelOrder(order.body.id).expect(200);
      const updatedTable = await getTable(table.body.id);

      expect(updatedTable.body.status).toBe('AVAILABLE');
    });

    it('does not allow updating table status directly', async () => {
      const table = await createTable();

      await request(httpServer)
        .patch(`/tables/${table.body.id}`)
        .send({ status: 'OCCUPIED' })
        .expect(400);
    });
  });

  describe('Order item creation rules', () => {
    it('creates an order item and copies the current dish price', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      const orderItem = await createOrderItem(order.body.id, dishIds[0], {
        quantity: 2,
      });

      expect(orderItem.body.price).toBe(10000);
      expect(orderItem.body.quantity).toBe(2);
      expect(orderItem.body.status).toBe('PENDING');
    });

    it('does not require client to send price when creating an order item', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);

      await request(httpServer)
        .post('/order-items')
        .send({
          orderId: order.body.id,
          dishId: dishIds[0],
          quantity: 1,
        })
        .expect(201);
    });

    it('does not allow adding an unavailable dish to an order', async () => {
      const unavailableDish = await createDish({
        name: unique('Unavailable dish'),
        available: '2',
      });
      const table = await createTable();
      const order = await createOrder(table.body.id);

      await request(httpServer)
        .post('/order-items')
        .send({
          orderId: order.body.id,
          dishId: unavailableDish.body.id,
          quantity: 1,
        })
        .expect(404);
    });

    it('does not allow quantity less than 1', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);

      await request(httpServer)
        .post('/order-items')
        .send({
          orderId: order.body.id,
          dishId: dishIds[0],
          quantity: 0,
        })
        .expect(400);
    });

    it('does not allow adding item to PAID order', async () => {
      const data = await makeConfirmedOrder();
      await payOrder(data.order.id).expect(200);

      await request(httpServer)
        .post('/order-items')
        .send({
          orderId: data.order.id,
          dishId: dishIds[1],
          quantity: 1,
        })
        .expect(400);
    });

    it('does not allow adding item to CANCELLED order', async () => {
      const data = await createOrderWithItem();
      await cancelOrder(data.order.id).expect(200);

      await request(httpServer)
        .post('/order-items')
        .send({
          orderId: data.order.id,
          dishId: dishIds[1],
          quantity: 1,
        })
        .expect(400);
    });

    it('gets total amount from active order items', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      await createOrderItem(order.body.id, dishIds[0], {
        quantity: 2,
      });
      await createOrderItem(order.body.id, dishIds[1], {
        quantity: 3,
      });

      const response = await getOrderItemTotal(order.body.id).expect(200);

      expect(response.body.orderId).toBe(order.body.id);
      expect(response.body.total).toBe(80000);
    });

    it('excludes cancelled items when getting total amount', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      const cancelledItem = await createOrderItem(order.body.id, dishIds[0], {
        quantity: 10,
      });
      await createOrderItem(order.body.id, dishIds[1], {
        quantity: 2,
      });

      await cancelOrderItem(cancelledItem.body.id).expect(200);

      const response = await getOrderItemTotal(order.body.id).expect(200);

      expect(response.body.orderId).toBe(order.body.id);
      expect(response.body.total).toBe(40000);
    });
  });

  describe('Order item status flow', () => {
    it('allows PENDING -> CONFIRMED', async () => {
      const data = await createOrderWithItem();
      const response = await confirmOrderItem(data.orderItem.id).expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    });

    it('does not allow COOKING when item is not CONFIRMED', async () => {
      const data = await createOrderWithItem();

      await cookingOrderItem(data.orderItem.id).expect(400);
    });

    it('allows CONFIRMED -> COOKING and changes order to PREPARING', async () => {
      const data = await makeConfirmedOrder();
      const response = await cookingOrderItem(data.orderItem.id).expect(200);
      const order = await getOrder(data.order.id);

      expect(response.body.status).toBe('COOKING');
      expect(order.body.status).toBe('PREPARING');
    });

    it('does not allow READY when item is not COOKING', async () => {
      const data = await makeConfirmedOrder();

      await readyOrderItem(data.orderItem.id).expect(400);
    });

    it('allows COOKING -> READY', async () => {
      const data = await makeCookingOrder();
      const response = await readyOrderItem(data.orderItem.id).expect(200);

      expect(response.body.status).toBe('READY');
    });

    it('does not allow SERVED when item is not READY', async () => {
      const data = await makeCookingOrder();

      await servedOrderItem(data.orderItem.id).expect(400);
    });

    it('allows READY -> SERVED and changes order to SERVED', async () => {
      const data = await makeReadyOrder();
      const response = await servedOrderItem(data.orderItem.id).expect(200);
      const order = await getOrder(data.order.id);

      expect(response.body.status).toBe('SERVED');
      expect(order.body.status).toBe('SERVED');
    });

    it('does not allow cancelling an item after it is CONFIRMED', async () => {
      const data = await makeConfirmedOrder();

      await cancelOrderItem(data.orderItem.id).expect(400);
    });

    it('allows cancelling a PENDING item', async () => {
      const data = await createOrderWithItem();
      const response = await cancelOrderItem(data.orderItem.id).expect(200);

      expect(response.body.status).toBe('CANCELLED');
    });
  });

  describe('Order aggregate status rules', () => {
    it('only confirms order after all active items are CONFIRMED', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      const firstItem = await createOrderItem(order.body.id, dishIds[0]);
      const secondItem = await createOrderItem(order.body.id, dishIds[1]);

      await confirmOrderItem(firstItem.body.id).expect(200);
      const pendingOrder = await getOrder(order.body.id);
      expect(pendingOrder.body.status).toBe('PENDING');

      await confirmOrderItem(secondItem.body.id).expect(200);
      const confirmedOrder = await getOrder(order.body.id);
      expect(confirmedOrder.body.status).toBe('CONFIRMED');
    });

    it('ignores CANCELLED items when checking all confirmed', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      const cancelledItem = await createOrderItem(order.body.id, dishIds[0]);
      const confirmedItem = await createOrderItem(order.body.id, dishIds[1]);

      await cancelOrderItem(cancelledItem.body.id).expect(200);
      await confirmOrderItem(confirmedItem.body.id).expect(200);

      const updatedOrder = await getOrder(order.body.id);
      expect(updatedOrder.body.status).toBe('CONFIRMED');
    });

    it('ignores CANCELLED items when checking all served', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      const cancelledItem = await createOrderItem(order.body.id, dishIds[0]);
      const servedItem = await createOrderItem(order.body.id, dishIds[1]);

      await cancelOrderItem(cancelledItem.body.id).expect(200);
      await confirmOrderItem(servedItem.body.id).expect(200);
      await cookingOrderItem(servedItem.body.id).expect(200);
      await readyOrderItem(servedItem.body.id).expect(200);
      await servedOrderItem(servedItem.body.id).expect(200);

      const updatedOrder = await getOrder(order.body.id);
      expect(updatedOrder.body.status).toBe('SERVED');
    });
  });

  describe('Payment rules', () => {
    it('does not allow paying a PENDING order', async () => {
      const data = await createOrderWithItem();

      await payOrder(data.order.id).expect(400);
    });

    it('allows paying a CONFIRMED order', async () => {
      const data = await makeConfirmedOrder();
      const payment = await payOrder(data.order.id, { method: 'CASH' }).expect(200);
      const order = await getOrder(data.order.id);
      const table = await getTable(data.table.id);

      expect(payment.body.method).toBe('CASH');
      expect(order.body.status).toBe('PAID');
      expect(table.body.status).toBe('AVAILABLE');
    });

    it('allows paying a PREPARING order', async () => {
      const data = await makeCookingOrder();

      await payOrder(data.order.id, { method: 'BANKING' }).expect(200);
    });

    it('allows paying a SERVED order', async () => {
      const data = await makeServedOrder();

      await payOrder(data.order.id, { method: 'MOMO' }).expect(200);
    });

    it('does not allow paying the same order twice', async () => {
      const data = await makeConfirmedOrder();
      await payOrder(data.order.id).expect(200);

      await payOrder(data.order.id).expect(400);
    });

    it('calculates payment amount from active order items', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      const firstItem = await createOrderItem(order.body.id, dishIds[0], {
        quantity: 2,
      });
      const secondItem = await createOrderItem(order.body.id, dishIds[1], {
        quantity: 3,
      });

      await confirmOrderItem(firstItem.body.id).expect(200);
      await confirmOrderItem(secondItem.body.id).expect(200);

      const payment = await payOrder(order.body.id).expect(200);

      expect(payment.body.amount).toBe(80000);
    });

    it('excludes CANCELLED items from payment amount', async () => {
      const table = await createTable();
      const order = await createOrder(table.body.id);
      const cancelledItem = await createOrderItem(order.body.id, dishIds[0], {
        quantity: 10,
      });
      const confirmedItem = await createOrderItem(order.body.id, dishIds[1], {
        quantity: 2,
      });

      await cancelOrderItem(cancelledItem.body.id).expect(200);
      await confirmOrderItem(confirmedItem.body.id).expect(200);

      const payment = await payOrder(order.body.id).expect(200);

      expect(payment.body.amount).toBe(40000);
    });

    it('does not allow creating payment directly', async () => {
      const data = await makeConfirmedOrder();

      await request(httpServer)
        .post('/payments')
        .send({
          orderId: data.order.id,
          amount: 1,
          method: 'CASH',
        })
        .expect(400);
    });

    it('does not allow updating payment directly', async () => {
      const data = await makeConfirmedOrder();
      const payment = await payOrder(data.order.id).expect(200);

      await request(httpServer)
        .patch(`/payments/${payment.body.id}`)
        .send({ amount: 1 })
        .expect(400);
    });
  });
});
