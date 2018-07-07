const test = require('supertest');
const Bundle = require('../bundle');
const assert = require('assert');

describe('(bundle)', () => {
  let data = {
    foo: [
      { id: '3333', foo: 'bar' },
      { id: '9999', foo: 'baz' },
    ],
  };
  let bundle;

  beforeEach(() => {
    bundle = new Bundle({ schema: 'foo' });
    bundle.use(require('../middleware')({ connections: [ { data } ] }));
    bundle.use(require('bono/middlewares/json')());
  });

  it('throw error if not using middleware', async () => {
    let bundle = new Bundle({ schema: 'foo' });
    await test(bundle.callback())
      .get('/')
      .expect(500);
  });

  describe('GET /', () => {
    it('return all rows', async () => {
      let { body } = await test(bundle.callback())
        .get('/?!limit=1')
        .expect(200);

      assert.equal(body.entries.length, 1);
      assert.equal(body.count, 2);
      assert.deepEqual(body.entries[0], { id: '3333', foo: 'bar' });
    });
  });

  it('return row', async () => {
    let { body } = await test(bundle.callback())
      .get('/3333')
      .expect(200);

    assert.deepEqual(body, { id: '3333', foo: 'bar' });
  });
});
