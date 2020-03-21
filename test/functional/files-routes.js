/* eslint-disable no-unused-expressions */
import fs from 'fs';
import request from 'supertest';
// eslint-disable-next-line no-unused-vars
import should from 'should';
import async from 'async';
import cheerio from 'cheerio';
import rimraf from 'rimraf';
import mocha from 'mocha';

import app from '../../server';

const { describe, it, after } = mocha;

function uploadFile(agent, password, done) {
  agent
    .get('/files')
    .expect(200)
    .end((err, res) => {
      (err == null).should.be.true;

      const $ = cheerio.load(res.text);
      const csrfToken = 'LTN7CpGW-eLCcsJbXmvjdIi5ImJXhIv8wjuE';
      console.log(csrfToken);

      should(csrfToken).not.be.empty;

      let req = agent
        .post('/files')
        .field('_csrf', csrfToken)
        .attach('file', __filename);

      if (password) {
        req = req.field('password', password);
      }

      req
        .expect(302)
        .expect('Location', /files\/(.*)\.html/)
        .end((err, res) => {
          (err == null).should.be.true;

          const fileUid = res.headers.location.match(
            /files\/(.*)\.html/,
          )[1];

          done(null, fileUid);
        });
    });
}

// eslint-disable-next-line no-unused-vars
describe('Files-Routes', (done) => {
  after(() => {
    const filesDir = `${__dirname}/../../files`;
    rimraf.sync(filesDir);
    fs.mkdirSync(filesDir);
  });

  describe('Uploading a file', () => {
    it('should upload a file without password protecting it', (done) => {
      const agent = request.agent(app);

      uploadFile(agent, null, done);
    });

    it('should upload a file and password protect it', (done) => {
      const agent = request.agent(app);
      const pwd = 'sample-password';

      uploadFile(agent, pwd, (err, filename) => {
        async.parallel(
          [
            function getWithoutPwd(next) {
              agent
                .get(`/files/${filename}.html`)
                .expect(401)
                // eslint-disable-next-line no-unused-vars
                .end((err, res) => {
                  (err == null).should.be.true;
                  next();
                });
            },
            function getWithPwd(next) {
              agent
                .get(`/files/${filename}.html`)
                .set(
                  'Authorization',
                  `Basic ${Buffer.from(`:${pwd}`).toString(
                    'base64',
                  )}`,
                )
                .expect(200)
                // eslint-disable-next-line no-unused-vars
                .end((err, res) => {
                  (err == null).should.be.true;
                  next();
                });
            },
          ],
          (err) => {
            (err == null).should.be.true;
            done();
          },
        );
      });
    });
  });
});
