export class ConflictException extends Error {
}
export class UnauthorizedException extends Error {
}
export class BadRequestException extends Error {
}
export class NotFoundException extends Error {
}
export class ServiceUnavailableException extends Error {
}
export function Injectable(): (value: any) => any;
export function OnModuleInit(): (value: any) => any;
export function OnModuleDestroy(): (value: any) => any;
