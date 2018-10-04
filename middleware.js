const { Manager } = require('node-norm');

function normMiddleware ({ manager, connections = [] } = {}) {
  manager = manager || new Manager({ connections });

  return async (ctx, next) => {
    ctx.norm = manager;

    await next();
  };
}

module.exports = normMiddleware;
