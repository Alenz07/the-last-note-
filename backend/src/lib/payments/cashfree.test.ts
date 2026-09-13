import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CashfreeGateway } from './cashfree';

/**
 * Locks the money-critical mapping between Cashfree's API and ours without
 * needing live keys: rupees-vs-paise, which id we store, webhook signing, and
 * which payment states count as paid.
 */
const SECRET = 'TEST_SECRET';
const gw = () => new CashfreeGateway('TEST_APP', SECRET, 'sandbox', 'The Last Note', 'https://site.test', '9999999999');
const RECEIPT = '11111111-2222-4333-8444-555555555555';

const sign = (timestamp: string, body: string) => createHmac('sha256', SECRET).update(timestamp + body).digest('base64');

type Captured = { url: string; body: Record<string, never>; headers: Record<string, string> };

function stubFetch(status: number, payload: unknown, captured?: { value?: Captured }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: { body?: string; headers?: Record<string, string> }) => {
      if (captured) {
        captured.value = {
          url,
          body: init?.body ? JSON.parse(init.body) : {},
          headers: init?.headers ?? {},
        };
      }
      return new Response(JSON.stringify(payload), { status });
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('cashfree · createOrder', () => {
  it('bills rupees (not paise), uses our own order id, and returns the session', async () => {
    const cap: { value?: Captured } = {};
    stubFetch(200, { order_id: `kadi_${RECEIPT.replace(/-/g, '')}`, payment_session_id: 'sess_abc' }, cap);

    const order = await gw().createOrder({ amountPaise: 500, receipt: RECEIPT, notes: { chain: 'confess' } });
    const body = cap.value!.body as unknown as Record<string, unknown>;

    expect(cap.value!.url).toBe('https://sandbox.cashfree.com/pg/orders');
    expect(body.order_amount).toBe(5); // ₹5, not 500
    expect(body.order_currency).toBe('INR');
    expect(body.order_id).toMatch(/^kadi_[0-9a-f]{32}$/);
    expect(cap.value!.headers['x-client-secret']).toBe(SECRET);
    expect(cap.value!.headers['x-api-version']).toBeTruthy();

    // anonymity: the only "customer" Cashfree ever sees is the order reference
    const customer = body.customer_details as Record<string, string>;
    expect(customer.customer_id).toBe(body.order_id);
    expect(customer.customer_phone).toBe('9999999999');

    const meta = body.order_meta as Record<string, string>;
    expect(meta.notify_url).toBe('https://site.test/api/webhooks/cashfree');
    expect(meta.return_url).toContain('https://site.test/pay/return');

    expect(order.orderId).toBe(body.order_id);
    expect(order.checkout.paymentSessionId).toBe('sess_abc');
    expect(order.checkout.mode).toBe('sandbox');
  });

  it('refuses to proceed without a payment session', async () => {
    stubFetch(200, { order_id: 'kadi_x' });
    await expect(gw().createOrder({ amountPaise: 500, receipt: RECEIPT })).rejects.toThrow(/payment_session_id/);
  });

  it('uses the production host in production mode', () => {
    const prod = new CashfreeGateway('A', 'B', 'production', 'X', 'https://s', '9999999999');
    expect(prod.verifyMode).toBe('lookup');
    expect(prod.name).toBe('cashfree');
  });
});

describe('cashfree · webhook signature', () => {
  const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' });
  const ts = '1757700000000';

  it('accepts base64 HMAC of timestamp + raw body', () => {
    expect(gw().verifyWebhookSignature(body, { signature: sign(ts, body), timestamp: ts })).toBe(true);
  });

  it('rejects a tampered body, a wrong timestamp, and missing headers', () => {
    const good = sign(ts, body);
    expect(gw().verifyWebhookSignature(body + ' ', { signature: good, timestamp: ts })).toBe(false);
    expect(gw().verifyWebhookSignature(body, { signature: good, timestamp: '1757700000001' })).toBe(false);
    expect(gw().verifyWebhookSignature(body, { signature: null, timestamp: ts })).toBe(false);
    expect(gw().verifyWebhookSignature(body, { signature: good, timestamp: null })).toBe(false);
  });

  it('never trusts the browser: client signatures are always rejected', () => {
    expect(gw().verifyClientSignature()).toBe(false);
  });
});

describe('cashfree · parseWebhook', () => {
  const evt = (type: string) =>
    JSON.stringify({
      type,
      data: {
        order: { order_id: 'kadi_abc' },
        payment: {
          cf_payment_id: 1453002795,
          payment_status: type === 'PAYMENT_SUCCESS_WEBHOOK' ? 'SUCCESS' : 'FAILED',
          payment_method: { upi: { channel: 'collect', upi_id: 'someone@ybl' } },
        },
      },
    });

  it('maps success, including the numeric payment id and the payer VPA', () => {
    const e = gw().parseWebhook(evt('PAYMENT_SUCCESS_WEBHOOK'))!;
    expect(e.type).toBe('captured');
    expect(e.orderId).toBe('kadi_abc');
    expect(e.paymentId).toBe('1453002795'); // string, even though Cashfree sends a number
    expect(e.payerVpa).toBe('someone@ybl');
  });

  it('maps failure and user-dropped to failed, and anything else to other', () => {
    expect(gw().parseWebhook(evt('PAYMENT_FAILED_WEBHOOK'))!.type).toBe('failed');
    expect(gw().parseWebhook(evt('PAYMENT_USER_DROPPED_WEBHOOK'))!.type).toBe('failed');
    expect(gw().parseWebhook(evt('PAYMENT_CHARGES_WEBHOOK'))!.type).toBe('other');
  });

  it('returns null on unparseable bodies', () => {
    expect(gw().parseWebhook('not json')).toBeNull();
  });
});

describe('cashfree · fetchOrderStatus', () => {
  const upi = { upi: { upi_id: 'payer@okaxis' } };

  it('reports captured when any attempt succeeded', async () => {
    stubFetch(200, [
      { cf_payment_id: 1, payment_status: 'FAILED' },
      { cf_payment_id: 2, payment_status: 'SUCCESS', payment_method: upi },
    ]);
    expect(await gw().fetchOrderStatus('kadi_abc')).toEqual({
      status: 'captured',
      paymentId: '2',
      payerVpa: 'payer@okaxis',
    });
  });

  it('reports failed only when every attempt is terminal', async () => {
    stubFetch(200, [{ cf_payment_id: 9, payment_status: 'USER_DROPPED' }]);
    expect((await gw().fetchOrderStatus('kadi_abc')).status).toBe('failed');
  });

  it('stays pending while an attempt is still open, or when nothing was attempted', async () => {
    stubFetch(200, [{ cf_payment_id: 1, payment_status: 'PENDING' }]);
    expect((await gw().fetchOrderStatus('kadi_abc')).status).toBe('pending');

    stubFetch(200, []);
    expect((await gw().fetchOrderStatus('kadi_abc')).status).toBe('pending');

    stubFetch(404, { message: 'no payments' });
    expect((await gw().fetchOrderStatus('kadi_abc')).status).toBe('pending');
  });

  it('throws on a real API error so reconciliation retries instead of marking failed', async () => {
    stubFetch(500, { message: 'boom' });
    await expect(gw().fetchOrderStatus('kadi_abc')).rejects.toThrow(/500/);
  });
});
