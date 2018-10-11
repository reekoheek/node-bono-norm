const test = require('supertest');
const Bundle = require('bono');
const { Manager } = require('node-norm');
const NormBundle = require('../bundle');
const assert = require('assert');

describe.only('nested bundle', () => {
  it('show filtered', async () => {
    let data = {
      foo: [
        { id: '1', name: 'foo1' },
      ],
      bar: [
        { id: '1', foo_id: '1', name: 'foo1bar1' },
        { id: '2', foo_id: '1', name: 'foo1bar2' },
        { id: '3', foo_id: '2', name: 'foo2bar3' },
      ],
    };

    let app = createApp(data);

    let fooBundle = new NormBundle({ schema: 'foo' });
    app.bundle('/foo', fooBundle);

    let barBundle = new NormBundle({ schema: 'bar', filterBy: { fooId: 'foo_id' } });
    fooBundle.bundle('/{fooId}/bar', barBundle);

    let { body } = await test(app.callback())
      .get('/foo/1/bar')
      .expect(200);

    assert.strictEqual(body.entries.length, 2);
  });

  it('insert with predefined filter', async () => {
    let data = {
    };

    let app = createApp(data);

    let fooBundle = new NormBundle({ schema: 'foo' });
    app.bundle('/foo', fooBundle);

    let barBundle = new NormBundle({ schema: 'bar', filterBy: { fooId: 'foo_id' } });
    fooBundle.bundle('/{fooId}/bar', barBundle);

    let { body } = await test(app.callback())
      .post('/foo/1/bar')
      .send({ name: 'something' })
      .expect(201);

    assert.strictEqual(body.foo_id, '1');
  });

  it('update with predefined filter', async () => {
    let data = {
      bar: [
        { id: '1', foo_id: '1', name: 'foo1bar1' },
      ],
    };

    let app = createApp(data);

    let fooBundle = new NormBundle({ schema: 'foo' });
    app.bundle('/foo', fooBundle);

    let barBundle = new NormBundle({ schema: 'bar', filterBy: { fooId: 'foo_id' } });
    fooBundle.bundle('/{fooId}/bar', barBundle);

    let { body } = await test(app.callback())
      .put('/foo/1/bar/1')
      .send({ name: 'something' })
      .expect(200);

    assert.strictEqual(body.foo_id, '1');

    await test(app.callback())
      .put('/foo/2/bar/1')
      .send({ name: 'something' })
      .expect(404);
  });

  it('read with predefined filter', async () => {
    let data = {
      bar: [
        { id: '1', foo_id: '1', name: 'foo1bar1' },
      ],
    };

    let app = createApp(data);

    let fooBundle = new NormBundle({ schema: 'foo' });
    app.bundle('/foo', fooBundle);

    let barBundle = new NormBundle({ schema: 'bar', filterBy: { fooId: 'foo_id' } });
    fooBundle.bundle('/{fooId}/bar', barBundle);

    await test(app.callback())
      .get('/foo/2/bar/1')
      .expect(404);
  });
});

function createApp (data = {}) {
  let config = {
    connections: [
      {
        adapter: require('node-norm/adapters/memory'),
        data,
      },
    ],
  };

  let manager = new Manager(config);
  let app = new Bundle();

  app.use(require('../middleware')({ manager }));
  app.use(require('bono/middlewares/json')());

  return app;
}
