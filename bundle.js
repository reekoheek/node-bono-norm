const Bundle = require('bono/bundle');
const parse = require('co-body');

class RestBundle extends Bundle {
  constructor ({ schema }) {
    super();

    this.schema = schema;

    this.get('/', this.index.bind(this));
    this.post('/', this.create.bind(this));
  }

  getCollection (ctx) {
    return ctx.norm.factory(this.schema);
  }

  async index (ctx) {
    const entries = await this.getCollection(ctx).all();
    return { entries };
  }

  async create (ctx) {
    const body = await parse.json(ctx);

    const model = this.getCollection(ctx).new();

    model.set(body);

    await model.save();

    ctx.status = 201;
    ctx.response.set('Location', `${ctx.originalUrl}/${model.id}`);

    return model.get();
  }
}

module.exports = RestBundle;
