const Bundle = require('bono/bundle');
const parse = require('co-body');

class RestBundle extends Bundle {
  constructor ({ schema }) {
    super();

    this.schema = schema;

    this.get('/', this.search.bind(this));
    this.post('/', this.create.bind(this));
  }

  getCollection (ctx) {
    return ctx.norm.factory(this.schema);
  }

  async search (ctx) {
    return await this.getCollection(ctx).all();
  }

  async create (ctx) {
    const body = await parse.json(ctx);

    const model = this.getCollection(ctx).new(body);

    await model.save();

    ctx.status = 201;
    ctx.response.set('Location', `${ctx.originalUrl}/${model.id}`);

    return model.get();
  }
}

module.exports = RestBundle;
