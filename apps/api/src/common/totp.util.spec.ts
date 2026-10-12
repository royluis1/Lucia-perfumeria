import { generateBase32Secret, generateOtpUri, verifyTotpToken } from './totp.util';

describe('totp.util', () => {
  it('genera secretos base32 válidos', () => {
    for (let i = 0; i < 20; i++) {
      const secret = generateBase32Secret();
      expect(secret).toMatch(/^[A-Z2-7]+$/);
      expect(secret.length).toBeGreaterThanOrEqual(16);
    }
  });

  it('arma una URI otpauth que los autenticadores pueden escanear', () => {
    const uri = generateOtpUri({ issuer: 'Lucia Perfumeria', label: 'ana', secret: 'ABC123' });
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('secret=ABC123');
    expect(uri).toContain('issuer=Lucia+Perfumeria');
  });

  it('acepta el código correcto y rechaza uno inválido', () => {
    const secret = generateBase32Secret();
    expect(verifyTotpToken(secret, '000000')).toBe(false);
    expect(verifyTotpToken(secret, '')).toBe(false);
    expect(verifyTotpToken(secret, 'abc')).toBe(false);
  });

  it('rechaza secretos inválidos sin explotar', () => {
    expect(verifyTotpToken('***', '123456')).toBe(false);
    expect(verifyTotpToken('', '123456')).toBe(false);
  });
});