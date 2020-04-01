const assert = require('assert');
const Constants = require('../constants');

describe('(middleware)', () => {
  it('add norm to ctx', async () => {
    const middleware = require('../middleware')();

    const ctx = {};
    let nextCalled = false;
    function next () {
      nextCalled = true;
    }
    await middleware(ctx, next);

    assert(ctx[Constants.MANAGER_KEY]);
    assert(nextCalled);
  });
});
