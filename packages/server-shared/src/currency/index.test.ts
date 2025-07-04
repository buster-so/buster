import { describe, expect, it } from 'vitest';
import { type Currency, CurrencySchema } from './index';

describe('currency index exports', () => {
	it('should export CurrencySchema', () => {
		expect(CurrencySchema).toBeDefined();
		expect(typeof CurrencySchema.parse).toBe('function');
	});

	it('should have working Currency type', () => {
		// Test type inference
		const currency: Currency = {
			code: 'USD',
			description: 'United States Dollar',
			flag: '🇺🇸',
		};
		expect(currency.code).toBe('USD');
	});

	it('should validate currency through index export', () => {
		const validCurrency = {
			code: 'EUR',
			description: 'Euro',
			flag: '🇪🇺',
		};

		const result = CurrencySchema.parse(validCurrency);
		expect(result).toEqual(validCurrency);
	});

	it('should reject invalid currency through index export', () => {
		const invalidCurrency = {
			code: 123,
			description: 'Invalid',
			flag: '🇺🇸',
		};

		expect(() => CurrencySchema.parse(invalidCurrency)).toThrow();
	});

	it('should work with safeParse from index', () => {
		const validCurrency = {
			code: 'GBP',
			description: 'British Pound Sterling',
			flag: '🇬🇧',
		};

		const result = CurrencySchema.safeParse(validCurrency);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validCurrency);
		}
	});

	it('should handle multiple currency validations from index', () => {
		const currencies = [
			{ code: 'USD', description: 'United States Dollar', flag: '🇺🇸' },
			{ code: 'EUR', description: 'Euro', flag: '🇪🇺' },
			{ code: 'JPY', description: 'Japanese Yen', flag: '🇯🇵' },
		];

		for (const currency of currencies) {
			expect(() => CurrencySchema.parse(currency)).not.toThrow();
			const result = CurrencySchema.parse(currency);
			expect(result.code).toBe(currency.code);
		}
	});
});
