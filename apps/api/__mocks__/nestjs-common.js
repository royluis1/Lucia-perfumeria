'use strict';
// Mock manual de @nestjs/common para unit tests.
// @nestjs/common v12 es ESM-only y no se puede `require` desde CJS en Node 22.

class ConflictException extends Error {}
class UnauthorizedException extends Error {}
class BadRequestException extends Error {}
class NotFoundException extends Error {}
class ServiceUnavailableException extends Error {}

function Injectable() {
  return (value) => value;
}
function OnModuleInit() {
  return (value) => value;
}
function OnModuleDestroy() {
  return (value) => value;
}

module.exports = {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
};