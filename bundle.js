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

  factory (ctx, query) {
    if ('norm' in ctx === false) {
      throw new Error('ctx.norm not found! Please use middleware: node-bono-norm/middleware');
    }

    return ctx.norm.factory(this.schema, query);
  }

  async index (ctx) {
    let query = {};
    for (let key in ctx.query) {
      if (key[0] === '!') {
        continue;
      }
      query[key] = ctx.query[key];
    }

    const entries = await this.factory(ctx, query).all();
    return { entries };
  }

  async create (ctx) {
    let entry = await ctx.parse();

    let { rows } = await this.factory(ctx).insert(entry).save();
    [ entry ] = rows;

    ctx.status = 201;
    ctx.response.set('Location', `${ctx.originalUrl}/${entry.id}`);

    return { entry };
  }

  async read (ctx) {
    const entry = await this.factory(ctx, ctx.parameters.id).single();
    if (!entry) {
      ctx.throw(404);
    }

    return { entry };
  }

  async update (ctx) {
    let { entry } = await this.read(ctx);

    entry = Object.assign(entry, await ctx.parse());

    await this.factory(ctx, ctx.parameters.id).set(entry).save();

    // TODO redundant query?
    // entry = await this.factory(ctx, ctx.parameters.id).single();

    return { entry };
  }

  async del (ctx) {
    let { entry } = await this.read(ctx);

    await this.factory(ctx, ctx.parameters.id).delete();

    return { entry };
  }
}

module.exports = RestBundle;
