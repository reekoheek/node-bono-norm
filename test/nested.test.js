const tester = require('supertest');
const Bundle = require('bono');
const { Manager } = require('node-norm');
const NormBundle = require('../bundle');
const assert = require('assert');

describe('nested bundle', () => {
  it('show filtered', async () => {
    const data = {
      foo: [
        { id: '1', name: 'foo1' },
      ],
      bar: [
        { id: '1', foo_id: '1', name: 'foo1bar1' },
        { id: '2', foo_id: '1', name: 'foo1bar2' },
        { id: '3', foo_id: '2', name: 'foo2bar3' },
      ],
    };

    const app = createApp(data);

    const fooBundle = new NormBundle({ schema: 'foo' });
    app.bundle('/foo', fooBundle);

    const barBundle = new NormBundle({ schema: 'bar', filterBy: { fooId: 'foo_id' } });
    fooBundle.bundle('/{fooId}/bar', barBundle);

    const { body } = await tester(app.callback())
      .get('/foo/1/bar')
      .expect(200);

    assert.strictEqual(body.entries.length, 2);
  });

  it('insert with predefined filter', async () => {
    const data = {
    };

    const app = createApp(data);

    const fooBundle = new NormBundle({ schema: 'foo' });
    app.bundle('/foo', fooBundle);

    const barBundle = new NormBundle({ schema: 'bar', filterBy: { fooId: 'foo_id' } });
    fooBundle.bundle('/{fooId}/bar', barBundle);

    const { body } = await tester(app.callback())
      .post('/foo/1/bar')
      .send({ name: 'something' })
      .expect(201);

    assert.strictEqual(body.foo_id, '1');
  });

  it('update with predefined filter', async () => {
    const data = {
      bar: [
        { id: '1', foo_id: '1', name: 'foo1bar1' },
      ],
    };

    const app = createApp(data);

    const fooBundle = new NormBundle({ schema: 'foo' });
    app.bundle('/foo', fooBundle);

    const barBundle = new NormBundle({ schema: 'bar', filterBy: { fooId: 'foo_id' } });
    fooBundle.bundle('/{fooId}/bar', barBundle);

    const { body } = await tester(app.callback())
      .put('/foo/1/bar/1')
      .send({ name: 'something' })
      .expect(200);

    assert.strictEqual(body.foo_id, '1');

    await tester(app.callback())
      .put('/foo/2/bar/1')
      .send({ name: 'something' })
      .expect(404);
  });

  it('read with predefined filter', async () => {
    const data = {
      bar: [
        { id: '1', foo_id: '1', name: 'foo1bar1' },
      ],
    };

    const app = createApp(data);

    const fooBundle = new NormBundle({ schema: 'foo' });
    app.bundle('/foo', fooBundle);

    const barBundle = new NormBundle({ schema: 'bar', filterBy: { fooId: 'foo_id' } });
    fooBundle.bundle('/{fooId}/bar', barBundle);

    await tester(app.callback())
      .get('/foo/2/bar/1')
      .expect(404);
  });
});

function createApp (data = {}) {
  const config = {
    connections: [
      {
        adapter: require('node-norm/adapters/memory'),
        data,
      },
    ],
  };

  const manager = new Manager(config);
  const app = new Bundle();

  app.use(require('../middleware')({ manager }));
  app.use(require('bono/middlewares/json')());

  return app;
}
