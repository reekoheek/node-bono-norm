const Manager = require('node-norm');

module.exports = ({ manager, connections = [] } = {}) => {
  manager = manager || new Manager({ connections });

  return async (ctx, next) => {
    ctx.norm = manager;

    await next();
  };
};
