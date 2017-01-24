const Manager = require('node-norm/manager');

module.exports = (options) => {
  const manager = new Manager(options);

  return async (ctx, next) => {
    ctx.norm = manager;

    await next();
  };
};
