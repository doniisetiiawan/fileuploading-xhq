import express from 'express';
import basicAuth from 'basic-auth-connect';
import errTo from 'errto';
import debugx from 'debug';

import pkg from '../package.json';
import File from '../models/file';

const debug = debugx(`${pkg.name}:filesRoute`);

const router = express.Router();

router.param('id', (req, res, next, id) => {
  File.find(
    id,
    errTo(next, (file) => {
      debug('file', file);

      // populate req.file, will need it later
      req.file = file;

      if (file.isPasswordProtected()) {
        // Password protected file, check for password using HTTP basic auth
        basicAuth((user, pwd, fn) => {
          if (!pwd) {
            return fn();
          }

          // ignore user
          file.authenticate(
            pwd,
            errTo(next, (match) => {
              if (match) {
                return fn(null, file.id);
              }

              fn();
            }),
          );
        })(req, res, next);
      } else {
        // Not password protected, proceeed normally
        next();
      }
    }),
  );
});

// eslint-disable-next-line no-unused-vars
router.get('/', (req, res, next) => {
  res.send({ title: 'Upload file' });
});

// eslint-disable-next-line no-unused-vars
router.get('/:id.html', (req, res, next) => {
  res.send({
    id: req.params.id,
    meta: req.file.meta,
    isPasswordProtected: req.file.isPasswordProtected(),
    title: `Download file ${req.file.meta.name}`,
  });
});

// eslint-disable-next-line no-unused-vars
router.get('/download/:id', (req, res, next) => {
  res.download(req.file.path, req.file.meta.name);
});

router.post('/', (req, res, next) => {
  const tempFile = req.files.file;
  if (!tempFile.size) {
    return res.redirect('/files');
  }

  const file = new File(tempFile);

  file.save(
    tempFile.path,
    req.body.password,
    errTo(next, () => {
      res.redirect(`/files/${file.id}.html`);
    }),
  );
});

export default router;
