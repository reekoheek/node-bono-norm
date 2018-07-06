const Bundle = require('bono/bundle');

class NormBundle extends Bundle {
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
      throw new Error('ctx.norm not found! Please use middleware: node-bono-norm/middleware');
    }

    return ctx.norm.runSession(fn, opts);
  }

  index (ctx) {
    return this.runSession(ctx, async session => {
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

  create (ctx) {
    return this.runSession(ctx, async session => {
      let entry = await ctx.parse();
      const { rows } = await session.factory(this.schema, ctx.parameters.id).insert(entry).save();
      [ entry ] = rows;

      ctx.status = 201;
      ctx.response.set('Location', `${ctx.originalUrl}/${entry.id}`);

      return entry;
    }, { autocommit: false });
  }

  read (ctx, session) {
    const doRead = async session => {
      const entry = await session.factory(this.schema, ctx.parameters.id).single();
      if (!entry) {
        ctx.throw(404);
      }
      return entry;
    };

    if (!session) {
      return this.runSession(ctx, doRead);
    }

    return doRead(session);
  }

  update (ctx) {
    return this.runSession(ctx, async session => {
      let entry = await this.read(ctx, session);
      if (!entry) {
        ctx.throw(404);
      }

      entry = Object.assign(entry, await ctx.parse());

      await session.factory(this.schema, ctx.parameters.id).set(entry).save();

      return entry;
    }, { autocommit: false });
  }

  del (ctx) {
    return this.runSession(ctx, async session => {
      let entry = await this.read(ctx, session);
      if (!entry) {
        ctx.throw(404);
      }

      await session.factory(this.schema, ctx.parameters.id).delete();

      return entry;
    }, { autocommit: false });
  }
}

module.exports = NormBundle;
