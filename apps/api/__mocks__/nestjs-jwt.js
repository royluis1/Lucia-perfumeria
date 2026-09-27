'use strict';
// Mock manual de @nestjs/jwt para unit tests.

class JwtService {
  sign() {
    throw new Error('not implemented');
  }
  signAsync() {
    return Promise.resolve('token');
  }
  verify() {
    throw new Error('not implemented');
  }
  verifyAsync() {
    return Promise.reject(new Error('not implemented'));
  }
}

module.exports = { JwtService };