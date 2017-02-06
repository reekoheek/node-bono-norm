# node-bono-norm

## Usage

```javascript
...

const normMiddleware = require('node-bono-norm/middleware');
const NormBundle = require('node-bono-norm/bundle');
const config = {
  connections: {

  },
};

// add middleware to use bono manager from bundle
app.use(normMiddleware(config));

// add json middleware to return data from bundle as json body
app.use(require('bono/middlewares/json')());

// add bundle with collection schema name
app.bundle('/user', new NormBundle({ schema: 'user' }));
...
```
