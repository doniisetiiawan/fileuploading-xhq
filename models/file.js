import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import cuid from 'cuid';
import errTo from 'errto';
import Err from 'custom-err';
import debugx from 'debug';

import hash from '../lib/hash';
import pkg from '../package.json';
import config from '../config.json';

const debug = debugx(`${pkg.name}:fileModel`);

class File {
  constructor(options, id) {
    this.id = id || cuid();
    this.meta = _.pick(options, [
      'hash',
      'name',
      'size',
      'type',
      'uploadedAt',
    ]);
    this.meta.uploadedAt = this.meta.uploadedAt || new Date();
  }

  save(path, password, cb) {
    const _this = this;

    this.move(
      path,
      errTo(cb, () => {
        if (!password) {
          return _this.saveMeta(cb);
        }

        hash.generate(
          password,
          errTo(cb, (hashedPassword) => {
            _this.meta.hash = hashedPassword;

            _this.saveMeta(cb);
          }),
        );
      }),
    );
  }

  move(path, cb) {
    fs.rename(path, this.path, cb);
  }

  saveMeta(cb) {
    fs.writeFile(
      `${this.path}.json`,
      JSON.stringify(this.meta),
      cb,
    );
  }

  isPasswordProtected() {
    return !!this.meta.hash;
  }

  authenticate(password, cb) {
    hash.compare(password, this.meta.hash, cb);
  }

  get path() {
    return `${File.dir}/${this.id}`;
  }
}

File.exists = (id, cb) => {
  fs.exists(`${File.dir}/${id}`, (exists) => {
    if (!exists) {
      return cb(Err('No such file', { status: 404 }));
    }

    cb();
  });
};

File.readMeta = (id, cb) => {
  fs.readFile(
    `${File.dir}/${id}.json`,
    'utf8',
    errTo(cb, (content) => {
      cb(null, JSON.parse(content));
    }),
  );
};

File.find = (id, cb) => {
  File.exists(
    id,
    errTo(cb, () => {
      File.readMeta(
        id,
        errTo(cb, (meta) => {
          cb(null, new File(meta, id));
        }),
      );
    }),
  );
};

File.dir = path.join(__dirname, '/../', config.filesDir);

debug('filesDir', File.dir);

export default File;
