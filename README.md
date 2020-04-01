# bono-norm

## Install

```sh
npm i bono-norm
```

## Usage

```js
// ...

const Bundle = require('bono');
const normMiddleware = require('bono-norm');
const NormBundle = require('bono-norm/bundle');
const config = {
  connections: [
    {
      name: 'default',
      adapter: 'disk',
    },
  ],
};

// create app bundle

const app = new Bundle();

// add middleware to use bono manager from bundle
app.use(normMiddleware(config));

// add json middleware to return data from bundle as json body
app.use(require('bono/middlewares/json')());

// add bundle with collection schema name
app.bundle('/user', new NormBundle({ schema: 'user' }));

// ...
```

### Hide fields

```js
// ...

app.bundle('/user', new NormBundle({ schema: 'user', hiddenFields: ['password'] }));

// ...
```

### Nested bundles

```js
// ...

const userBundle = new NormBundle({ schema: 'user' };
userBundle.bundle('/{userId}/task', new NormBundle({ schema: 'task', filterBy: { userId: 'id' } }));

app.bundle('/user', userBundle);

// ...
```


