import { describe, expect, it } from 'vitest';
import { SnowflakeCredentialsSchema } from './credentials';

describe('SnowflakeCredentialsSchema', () => {
  describe('password authentication', () => {
    it('should validate valid password credentials with all required fields', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'password' as const,
        account_id: 'ABC123.us-central1.gcp',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        password: 'secretpassword',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.auth_method).toBe('password');
        expect(result.data.password).toBe('secretpassword');
      }
    });

    it('should validate password credentials with optional fields', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'password' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        password: 'secretpassword',
        default_database: 'DEMO_DB',
        default_schema: 'PUBLIC',
        role: 'ADMIN',
        custom_host: 'custom.snowflakecomputing.com',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.default_schema).toBe('PUBLIC');
        expect(result.data.role).toBe('ADMIN');
        expect(result.data.custom_host).toBe('custom.snowflakecomputing.com');
      }
    });

    it('should default auth_method to password when not provided', () => {
      const credentials = {
        type: 'snowflake' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        password: 'secretpassword',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.auth_method).toBe('password');
      }
    });

    it('should reject password auth without password field', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'password' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        default_database: 'DEMO_DB',
        // Missing password
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });

    it('should reject password auth with empty password', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'password' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        password: '',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });

    it('should reject password auth without required common fields', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'password' as const,
        password: 'secretpassword',
        // Missing account_id, warehouse_id, username, default_database
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });
  });

  describe('key-pair authentication', () => {
    const validPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15j6imydbDVJHKf5Hk6qT7XK2M3mJQ8WJQhQzI
-----END PRIVATE KEY-----`;

    it('should validate valid key-pair credentials with all required fields', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123.us-central1.gcp',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        private_key: validPrivateKey,
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.auth_method).toBe('key_pair');
        expect(result.data.private_key).toBe(validPrivateKey);
      }
    });

    it('should accept optional passphrase for encrypted keys', () => {
      const encryptedKey = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFLTBXBgkqhkiG9w0BBQ0wSjApBgkqhkiG9w0BBQwwHAQITo1O0b8YrS0CAggA
-----END ENCRYPTED PRIVATE KEY-----`;

      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        private_key: encryptedKey,
        private_key_passphrase: 'my-passphrase',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.private_key_passphrase).toBe('my-passphrase');
      }
    });

    it('should accept RSA private key format', () => {
      const rsaKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END RSA PRIVATE KEY-----`;

      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        private_key: rsaKey,
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(true);
    });

    it('should validate key-pair credentials with optional fields', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        private_key: validPrivateKey,
        default_database: 'DEMO_DB',
        default_schema: 'PUBLIC',
        role: 'ADMIN',
        custom_host: 'custom.snowflakecomputing.com',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.default_schema).toBe('PUBLIC');
        expect(result.data.role).toBe('ADMIN');
      }
    });

    it('should reject key-pair auth without private_key field', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        default_database: 'DEMO_DB',
        // Missing private_key
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });

    it('should reject key-pair auth with invalid PEM format', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        private_key: 'not-a-valid-pem-key',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('PEM format');
      }
    });

    it('should reject key-pair auth with empty private_key', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        private_key: '',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });

    it('should reject key-pair auth with public key instead of private key', () => {
      const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
-----END PUBLIC KEY-----`;

      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        private_key: publicKey,
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });
  });

  describe('type narrowing', () => {
    it('should narrow type to password auth based on auth_method', () => {
      const credentials = SnowflakeCredentialsSchema.parse({
        type: 'snowflake' as const,
        auth_method: 'password' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        password: 'secret',
        default_database: 'DEMO_DB',
      });

      if (credentials.auth_method === 'password') {
        // Should have password field
        expect(credentials.password).toBe('secret');
        // TypeScript should know private_key doesn't exist
        expect('private_key' in credentials).toBe(false);
      }
    });

    it('should narrow type to key-pair auth based on auth_method', () => {
      const validPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END PRIVATE KEY-----`;

      const credentials = SnowflakeCredentialsSchema.parse({
        type: 'snowflake' as const,
        auth_method: 'key_pair' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        private_key: validPrivateKey,
        default_database: 'DEMO_DB',
      });

      if (credentials.auth_method === 'key_pair') {
        // Should have private_key field
        expect(credentials.private_key).toBe(validPrivateKey);
        // TypeScript should know password doesn't exist
        expect('password' in credentials).toBe(false);
      }
    });
  });

  describe('common field validation', () => {
    it('should reject credentials without type field', () => {
      const credentials = {
        auth_method: 'password' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        password: 'secret',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });

    it('should reject credentials with wrong type', () => {
      const credentials = {
        type: 'postgres' as const,
        auth_method: 'password' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        password: 'secret',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });

    it('should reject credentials with empty required fields', () => {
      const credentials = {
        type: 'snowflake' as const,
        auth_method: 'password' as const,
        account_id: '',
        warehouse_id: '',
        username: '',
        password: 'secret',
        default_database: '',
      };

      const result = SnowflakeCredentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });
  });

  describe('backward compatibility', () => {
    it('should handle legacy credentials without auth_method (defaults to password)', () => {
      const legacyCredentials = {
        type: 'snowflake' as const,
        account_id: 'ABC123',
        warehouse_id: 'COMPUTE_WH',
        username: 'john_doe',
        password: 'secretpassword',
        default_database: 'DEMO_DB',
      };

      const result = SnowflakeCredentialsSchema.safeParse(legacyCredentials);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.auth_method).toBe('password');
        expect(result.data.password).toBe('secretpassword');
      }
    });
  });
});
