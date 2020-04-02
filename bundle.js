const Bundle = require('bono/bundle');
const Constants = require('./constants');

class NormBundle extends Bundle {
  constructor ({ schema, filterBy, selector = 'id', hiddenFields = [] }) {
    super();

    this.schema = schema;
    this.selector = selector;
    this.filterBy = filterBy;
    this.hiddenFields = hiddenFields;

    this.get('/', this.index.bind(this));
    this.post('/', this.create.bind(this));

    this.get('/{__selector}', this.read.bind(this));
    this.put('/{__selector}', this.update.bind(this));
    this.delete('/{__selector}', this.del.bind(this));
  }

  runSession (fn, ctx) {
    if (typeof fn === 'object') {
      console.error('Deprecated signature, please call #runSession(fn, ctx)');
      [ctx, fn] = [fn, ctx];
    }

    if (Constants.MANAGER_KEY in ctx === false) {
      throw new Error('Uninitialized manager! Please use bono-norm middleware');
    }

    const { state } = ctx;
    return ctx[Constants.MANAGER_KEY].runSession(fn, { state });
  }

  index (ctx) {
    return this.runSession(async session => {
      const criteria = this._buildAllCriteria(ctx);

      let query = session.factory(this.schema, criteria);

      if ('!skip' in ctx.query) {
        query = query.skip(Number(ctx.query['!skip']));
      }

      if ('!limit' in ctx.query) {
        query = query.limit(Number(ctx.query['!limit']));
      }

      if ('!sort' in ctx.query) {
        query = query.sort(ctx.query['!sort']);
      }

      const entries = (await query.all()).map(entry => this.hideFields(entry));
      const count = await session.factory(this.schema, criteria).count();
      return { entries, count };
    }, ctx);
  }

  hideFields (entry) {
    const result = { ...entry };

    this.hiddenFields.forEach(field => {
      delete result[field];
    });

    return result;
  }

  create (ctx) {
    return this.runSession(async session => {
      const entry = {
        ...await ctx.parse(),
        ...this._buildFilterCriteria(ctx),
      };

      const { rows } = await session.factory(this.schema, ctx.parameters.id).insert(entry).save();
      const resultEntry = rows[0];
      ctx.status = 201;
      ctx.response.set('Location', `${ctx.originalUrl}/${resultEntry.id}`);

      return this.hideFields(resultEntry);
    }, ctx);
  }

  read (ctx, session) {
    const doRead = async session => {
      const criteria = this._buildSingleCriteria(ctx);
      const entry = await session.factory(this.schema, criteria).single();
      if (!entry) {
        ctx.throw(404);
      }

      return this.hideFields(entry);
    };

    if (!session) {
      return this.runSession(doRead, ctx);
    }

    return doRead(session);
  }

  update (ctx) {
    return this.runSession(async session => {
      let entry = await this.read(ctx, session);
      if (!entry) {
        ctx.throw(404);
      }

      entry = {
        ...entry,
        ...await ctx.parse(),
      };

      await session.factory(this.schema, entry.id).set(entry).save();

      return this.hideFields(entry);
    }, ctx);
  }

  del (ctx) {
    return this.runSession(async session => {
      const entry = await this.read(ctx, session);
      if (!entry) {
        ctx.throw(404);
      }

      await session.factory(this.schema, entry.id).delete();

      return this.hideFields(entry);
    }, ctx);
  }

  _buildSingleCriteria (ctx) {
    return {
      [this.selector]: ctx.parameters.__selector,
      ...this._buildFilterCriteria(ctx),
    };
  }

  _buildAllCriteria (ctx) {
    const criteria = {};
    for (const key in ctx.query) {
      if (key[0] === '!') {
        continue;
      }
      criteria[key] = ctx.query[key];
    }

    return {
      ...criteria,
      ...this._buildFilterCriteria(ctx),
    };
  }

  _buildFilterCriteria (ctx) {
    if (!this.filterBy) {
      return;
    }

    return Object.keys(this.filterBy).reduce((criteria, filterKey) => {
      criteria[this.filterBy[filterKey]] = ctx.parameters[filterKey];
      return criteria;
    }, {});
  }
}

module.exports = NormBundle;
