const assert = require('assert');

describe('(middleware)', () => {
  it('add norm to ctx', async () => {
    let middleware = require('../middleware')();

    let ctx = {};
    let nextCalled = false;
    function next () {
      nextCalled = true;
    }
    await middleware(ctx, next);

    assert(ctx.norm);
    assert(nextCalled);
  });
});
