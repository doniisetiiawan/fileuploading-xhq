/* eslint-disable no-unused-expressions */
// eslint-disable-next-line no-unused-vars
import should from 'should';
import path from 'path';
import sinon from 'sinon';
import fs from 'fs';
import mocha from 'mocha';

import config from '../../config.json';
import hash from '../../lib/hash';
import File from '../../models/file';

const noop = () => {};

const {
  describe, it, beforeEach, afterEach,
} = mocha;

describe('models', () => {
  describe('File', () => {
    it('should have default properties', () => {
      const file = new File();

      file.id.should.be.a.String;
      file.meta.uploadedAt.should.be.a.Date;
    });

    it('should return the path based on the root and the file id', () => {
      const file = new File({}, '1');
      file.path.should.eql(`${File.dir}/1`);
    });

    it('should move a file', () => {
      const stub = sinon.stub(fs, 'rename');

      const file = new File({}, '1');
      file.move('/from/path', noop);

      stub.calledOnce.should.be.true;
      stub.calledWith('/from/path', `${File.dir}/1`, noop)
        .should.be.true;

      stub.restore();
    });

    it('should save the metadata', () => {
      const stub = sinon.stub(fs, 'writeFile');
      const file = new File({}, '1');
      file.meta = { a: 1, b: 2 };

      file.saveMeta(noop);

      stub.calledOnce.should.be.true;
      stub.calledWith(
        `${File.dir}/1.json`,
        JSON.stringify(file.meta),
        noop,
      ).should.be.true;

      stub.restore();
    });

    it('should check if file is password protected', () => {
      const file = new File({}, '1');

      file.meta.hash = 'y';
      file.isPasswordProtected().should.be.true;

      file.meta.hash = null;
      file.isPasswordProtected().should.be.false;
    });

    it('should allow access if matched file password', () => {
      const stub = sinon.stub(hash, 'compare');

      const file = new File({}, '1');
      file.meta.hash = 'hashedPwd';
      file.authenticate('password', noop);

      stub.calledOnce.should.be.true;
      stub.calledWith('password', 'hashedPwd', noop).should
        .be.true;

      stub.restore();
    });

    describe('.dir', () => {
      it('should return the root of the files folder', () => {
        path
          .resolve(`${__dirname}/../../${config.filesDir}`)
          .should.eql(File.dir);
      });
    });

    describe('.exists', () => {
      let stub;

      beforeEach(() => {
        stub = sinon.stub(fs, 'exists');
      });

      afterEach(() => {
        stub.restore();
      });

      it('should callback with an error when the file does not exist', (done) => {
        File.exists('unknown', (err) => {
          err.should.be.an
            .instanceOf(Error)
            .and.have.property('status', 404);
          done();
        });

        // call the function passed as argument[1] with the parameter `false`
        stub.callArgWith(1, false);
      });

      it('should callback with no arguments when the file exists', (done) => {
        File.exists('existing-file', (err) => {
          (typeof err === 'undefined').should.be.true;
          done();
        });

        // call the function passed as argument[1] with the parameter `true`
        stub.callArgWith(1, true);
      });
    });
  });
});
