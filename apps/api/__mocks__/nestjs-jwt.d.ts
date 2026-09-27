export class JwtService {
    sign(): void;
    signAsync(): Promise<string>;
    verify(): void;
    verifyAsync(): Promise<never>;
}
