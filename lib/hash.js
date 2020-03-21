import bcrypt from 'bcrypt';
import errTo from 'errto';

const Hash = {};

Hash.generate = (password, cb) => {
  bcrypt.genSalt(
    10,
    errTo(cb, (salt) => {
      bcrypt.hash(
        password,
        salt,
        errTo(cb, (hash) => {
          cb(null, hash);
        }),
      );
    }),
  );
};

Hash.compare = (password, hash, cb) => {
  bcrypt.compare(password, hash, cb);
};

export default Hash;
