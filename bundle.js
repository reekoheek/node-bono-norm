const Bundle = require('bono/bundle');

class RestBundle extends Bundle {
  constructor ({ schema }) {
    super();

    this.schema = schema;

    this.get('/', this.index.bind(this));
    this.post('/', this.create.bind(this));

    this.get('/{id}', this.read.bind(this));
    this.put('/{id}', this.update.bind(this));
    this.delete('/{id}', this.del.bind(this));
  }

  runSession (ctx, fn, opts) {
    if ('norm' in ctx === false) {
      throw new Error('ctx.normSession not found! Please use middleware: node-bono-norm/middleware');
    }

    return ctx.norm.runSession(fn, opts);
  }

  async index (ctx) {
    return await this.runSession(ctx, async session => {
      let query = {};
      for (let key in ctx.query) {
        if (key[0] === '!') {
          continue;
        }
        query[key] = ctx.query[key];
      }
      const entries = await session.factory(this.schema, query).all();
      return entries;
    });
  }

  async create (ctx) {
    return await this.runSession(ctx, async session => {
      let entry = await ctx.parse();
      const { rows } = await session.factory(this.schema, ctx.parameters.id).insert(entry).save();
      [ entry ] = rows;

      ctx.status = 201;
      ctx.response.set('Location', `${ctx.originalUrl}/${entry.id}`);

      return entry;
    }, { autocommit: false });
  }

  async read (ctx) {
    return await this.runSession(ctx, async session => {
      const entry = await session.factory(this.schema, ctx.parameters.id).single();
      if (!entry) {
        ctx.throw(404);
      }
      return entry;
    });
  }

  async update (ctx) {
    return await this.runSession(ctx, async session => {
      let { entry } = await this.read(ctx);
      if (!entry) {
        ctx.throw(404);
      }

      entry = Object.assign(entry, await ctx.parse());

      await session.factory(this.schema, ctx.parameters.id).set(entry).save();

      // TODO redundant query?
      // entry = await this.factory(ctx, ctx.parameters.id).single();

      return entry;
    }, { autocommit: false });
  }

  async del (ctx) {
    return await this.runSession(ctx, async session => {
      let { entry } = await this.read(ctx);
      if (!entry) {
        ctx.throw(404);
      }

      await session.factory(this.schema, ctx.parameters.id).delete();

      return entry;
    }, { autocommit: false });
  }
}

module.exports = RestBundle;
