const tester = require('supertest');
const Bundle = require('../bundle');
const assert = require('assert');

describe('custom selector', () => {
  let data;
  let bundle;

  beforeEach(() => {
    data = {
      foo: [
        { id: '3333', foo: 'bar', count: 1 },
        { id: '9999', foo: 'baz', count: 1 },
      ],
    };

    const connection = { data, adapter: require('node-norm/adapters/memory') };
    bundle = new Bundle({ schema: 'foo', selector: 'foo' });
    bundle.use(require('../middleware')({ connections: [connection] }));
    bundle.use(require('bono/middlewares/json')());
  });

  it('GET /?', async () => {
    {
      const { body } = await tester(bundle.callback())
        .get('/bar')
        .expect(200);

      assert.strictEqual(body.id, '3333');
    }

    {
      const { body } = await tester(bundle.callback())
        .get('/baz')
        .expect(200);

      assert.strictEqual(body.id, '9999');
    }
  });

  it('PUT /?', async () => {
    const { body } = await tester(bundle.callback())
      .put('/baz')
      .send({ count: 2 })
      .expect(200);

    assert.deepStrictEqual(body, {
      id: '9999',
      foo: 'baz',
      count: 2,
    });
  });

  it('DELETE /?', async () => {
    const { body } = await tester(bundle.callback())
      .delete('/baz')
      .expect(200);

    assert.strictEqual(data.foo.length, 1);
    assert.deepStrictEqual(body, {
      id: '9999',
      foo: 'baz',
      count: 1,
    });
  });
});
