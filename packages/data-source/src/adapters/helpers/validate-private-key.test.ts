import { describe, expect, it } from 'vitest';
import { PrivateKeySchema, validatePrivateKey } from './validate-private-key';

describe('validatePrivateKey', () => {
  describe('valid private keys', () => {
    it('should accept standard PKCS8 private key format', () => {
      const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15j6imydbDVJHKf5Hk6qT7XK2M3mJQ8WJQhQzI
-----END PRIVATE KEY-----`;
      expect(validatePrivateKey(key)).toBe(true);
    });

    it('should accept RSA private key format', () => {
      const key = `-----BEGIN RSA PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15j6imydbDVJHKf5Hk6qT7XK2M3mJQ8WJQhQzI
-----END RSA PRIVATE KEY-----`;
      expect(validatePrivateKey(key)).toBe(true);
    });

    it('should accept encrypted private key format', () => {
      const key = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFLTBXBgkqhkiG9w0BBQ0wSjApBgkqhkiG9w0BBQwwHAQITo1O0b8YrS0CAggA
MAwGCCqGSIb3DQIJBQAwHQYJYIZIAWUDBAEqBBBtLH4T1KOfo1GGr7sADBdN
-----END ENCRYPTED PRIVATE KEY-----`;
      expect(validatePrivateKey(key)).toBe(true);
    });

    it('should accept key with extra whitespace', () => {
      const key = `
      -----BEGIN PRIVATE KEY-----
      MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
      -----END PRIVATE KEY-----
      `;
      expect(validatePrivateKey(key)).toBe(true);
    });

    it('should accept multiline key content', () => {
      const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15j6imydbDVJHKf5Hk6qT7XK2M3mJQ8WJQhQzI
z5z+mJQzIz5z+mJQzIz5z+mJQzIz5z+mJQzIz5z+mJQzIz5z+mJQzIz5z+mJQzI
-----END PRIVATE KEY-----`;
      expect(validatePrivateKey(key)).toBe(true);
    });
  });

  describe('invalid private keys', () => {
    it('should reject plain text', () => {
      expect(validatePrivateKey('not a private key')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validatePrivateKey('')).toBe(false);
    });

    it('should reject key without BEGIN marker', () => {
      const key = `MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END PRIVATE KEY-----`;
      expect(validatePrivateKey(key)).toBe(false);
    });

    it('should reject key without END marker', () => {
      const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj`;
      expect(validatePrivateKey(key)).toBe(false);
    });

    it('should reject public key format', () => {
      const key = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
-----END PUBLIC KEY-----`;
      expect(validatePrivateKey(key)).toBe(false);
    });

    it('should reject certificate format', () => {
      const key = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKq5MA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
-----END CERTIFICATE-----`;
      expect(validatePrivateKey(key)).toBe(false);
    });

    it('should reject mismatched markers', () => {
      const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END RSA PRIVATE KEY-----`;
      expect(validatePrivateKey(key)).toBe(false);
    });
  });
});

describe('PrivateKeySchema', () => {
  describe('valid inputs', () => {
    it('should parse valid PKCS8 private key', () => {
      const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END PRIVATE KEY-----`;
      const result = PrivateKeySchema.safeParse(key);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(key);
      }
    });

    it('should parse valid encrypted private key', () => {
      const key = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFLTBXBgkqhkiG9w0BBQ0wSjApBgkqhkiG9w0BBQwwHAQITo1O0b8YrS0CAggA
-----END ENCRYPTED PRIVATE KEY-----`;
      const result = PrivateKeySchema.safeParse(key);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty string with clear error message', () => {
      const result = PrivateKeySchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Private key is required');
      }
    });

    it('should reject invalid format with clear error message', () => {
      const result = PrivateKeySchema.safeParse('not-a-valid-key');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('PEM format');
      }
    });

    it('should reject public key format', () => {
      const key = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
-----END PUBLIC KEY-----`;
      const result = PrivateKeySchema.safeParse(key);
      expect(result.success).toBe(false);
    });
  });
});
