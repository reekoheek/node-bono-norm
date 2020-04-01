const { Manager } = require('node-norm');
const Constants = require('./constants');

function normMiddleware ({ manager, connections = [] } = {}) {
  manager = manager || new Manager({ connections });

  return async (ctx, next) => {
    ctx[Constants.MANAGER_KEY] = manager;

    await next();
  };
}

module.exports = normMiddleware;
