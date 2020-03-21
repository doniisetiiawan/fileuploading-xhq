import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import multiparty from 'connect-multiparty';
import cookieParser from 'cookie-parser';
import session from 'cookie-session';
import csrf from 'csurf';
import Err from 'custom-err';

import config from './config.json';
import csrfHelper from './lib/middleware/csrf-helper';
import homeRouter from './routes/index';
import filesRouter from './routes/files';

const app = express();
const port = 3000;

const ENV = app.get('env');

if (ENV === 'development') {
  app.use(logger('dev'));
}
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Limit uploads to X Mb
app.use(
  multiparty({
    maxFilesSize: 1024 * 1024 * config.maxSize,
  }),
);
app.use(cookieParser());
app.use(
  session({
    keys: ['rQo2#0s!qkE', 'Q.ZpeR49@9!szAe'],
  }),
);
app.use(csrf());
// add CSRF helper
app.use(csrfHelper);

app.use('/', homeRouter);
app.use('/files', filesRouter);

app.use((req, res, next) => {
  next(Err('Not Found', { status: 404 }));
});

if (ENV === 'development') {
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err,
    });
  });
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
