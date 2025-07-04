import { describe, expect, it } from 'vitest';
import { type Currency, CurrencySchema } from './currency.types';

describe('CurrencySchema', () => {
	it('should validate valid currency object', () => {
		const validCurrency = {
			code: 'USD',
			description: 'United States Dollar',
			flag: '🇺🇸',
		};

		const result = CurrencySchema.parse(validCurrency);
		expect(result).toEqual(validCurrency);
	});

	it('should validate different currency codes', () => {
		const currencies = [
			{ code: 'EUR', description: 'Euro', flag: '🇪🇺' },
			{ code: 'GBP', description: 'British Pound Sterling', flag: '🇬🇧' },
			{ code: 'JPY', description: 'Japanese Yen', flag: '🇯🇵' },
			{ code: 'CAD', description: 'Canadian Dollar', flag: '🇨🇦' },
			{ code: 'AUD', description: 'Australian Dollar', flag: '🇦🇺' },
		];

		for (const currency of currencies) {
			const result = CurrencySchema.parse(currency);
			expect(result).toEqual(currency);
			expect(result.code).toBe(currency.code);
		}
	});

	it('should accept empty strings for fields', () => {
		const currencyWithEmptyStrings = {
			code: '',
			description: '',
			flag: '',
		};

		const result = CurrencySchema.parse(currencyWithEmptyStrings);
		expect(result).toEqual(currencyWithEmptyStrings);
	});

	it('should accept long descriptions', () => {
		const currencyWithLongDescription = {
			code: 'BTC',
			description:
				'Bitcoin - A decentralized digital currency that can be transferred on the peer-to-peer bitcoin network',
			flag: '₿',
		};

		const result = CurrencySchema.parse(currencyWithLongDescription);
		expect(result.description).toBe(currencyWithLongDescription.description);
	});

	it('should accept special characters in flag', () => {
		const currencyWithSpecialFlag = {
			code: 'XAU',
			description: 'Gold (troy ounce)',
			flag: '🥇',
		};

		const result = CurrencySchema.parse(currencyWithSpecialFlag);
		expect(result.flag).toBe('🥇');
	});

	it('should reject missing required fields', () => {
		expect(() => CurrencySchema.parse({})).toThrow();

		expect(() =>
			CurrencySchema.parse({
				code: 'USD',
				description: 'United States Dollar',
				// missing flag
			}),
		).toThrow();

		expect(() =>
			CurrencySchema.parse({
				code: 'USD',
				// missing description
				flag: '🇺🇸',
			}),
		).toThrow();

		expect(() =>
			CurrencySchema.parse({
				// missing code
				description: 'United States Dollar',
				flag: '🇺🇸',
			}),
		).toThrow();
	});

	it('should reject non-string values', () => {
		expect(() =>
			CurrencySchema.parse({
				code: 123,
				description: 'United States Dollar',
				flag: '🇺🇸',
			}),
		).toThrow();

		expect(() =>
			CurrencySchema.parse({
				code: 'USD',
				description: null,
				flag: '🇺🇸',
			}),
		).toThrow();

		expect(() =>
			CurrencySchema.parse({
				code: 'USD',
				description: 'United States Dollar',
				flag: true,
			}),
		).toThrow();
	});

	it('should reject undefined values', () => {
		expect(() =>
			CurrencySchema.parse({
				code: undefined,
				description: 'United States Dollar',
				flag: '🇺🇸',
			}),
		).toThrow();

		expect(() =>
			CurrencySchema.parse({
				code: 'USD',
				description: undefined,
				flag: '🇺🇸',
			}),
		).toThrow();

		expect(() =>
			CurrencySchema.parse({
				code: 'USD',
				description: 'United States Dollar',
				flag: undefined,
			}),
		).toThrow();
	});

	it('should handle extra properties gracefully', () => {
		const currencyWithExtra = {
			code: 'USD',
			description: 'United States Dollar',
			flag: '🇺🇸',
			extraProperty: 'this should be ignored',
			anotherExtra: 123,
		};

		const result = CurrencySchema.parse(currencyWithExtra);

		// Zod objects by default strip unknown properties
		expect(result).toEqual({
			code: 'USD',
			description: 'United States Dollar',
			flag: '🇺🇸',
		});
		expect((result as any).extraProperty).toBeUndefined();
	});

	it('should validate whitespace strings', () => {
		const currencyWithWhitespace = {
			code: '   ',
			description: '\t\n',
			flag: ' ',
		};

		const result = CurrencySchema.parse(currencyWithWhitespace);
		expect(result.code).toBe('   ');
		expect(result.description).toBe('\t\n');
		expect(result.flag).toBe(' ');
	});

	it('should validate complex Unicode characters', () => {
		const currencyWithUnicode = {
			code: 'مﻼﺰﻲ', // Arabic text
			description: '中文货币描述', // Chinese text
			flag: '🏴‍☠️', // Complex emoji
		};

		const result = CurrencySchema.parse(currencyWithUnicode);
		expect(result).toEqual(currencyWithUnicode);
	});

	it('should have correct type inference', () => {
		const currency: Currency = {
			code: 'USD',
			description: 'United States Dollar',
			flag: '🇺🇸',
		};

		expect(currency.code).toBe('USD');
		expect(currency.description).toBe('United States Dollar');
		expect(currency.flag).toBe('🇺🇸');
	});

	it('should work with safeParse for error handling', () => {
		const validCurrency = {
			code: 'USD',
			description: 'United States Dollar',
			flag: '🇺🇸',
		};

		const validResult = CurrencySchema.safeParse(validCurrency);
		expect(validResult.success).toBe(true);
		if (validResult.success) {
			expect(validResult.data).toEqual(validCurrency);
		}

		const invalidCurrency = {
			code: 123,
			description: 'Invalid',
			flag: '🇺🇸',
		};

		const invalidResult = CurrencySchema.safeParse(invalidCurrency);
		expect(invalidResult.success).toBe(false);
		if (!invalidResult.success) {
			expect(invalidResult.error).toBeDefined();
			expect(invalidResult.error.issues).toHaveLength(1);
			expect(invalidResult.error.issues[0].path).toEqual(['code']);
		}
	});

	it('should validate real-world currency examples', () => {
		const realCurrencies = [
			{ code: 'USD', description: 'United States Dollar', flag: '🇺🇸' },
			{ code: 'EUR', description: 'Euro', flag: '🇪🇺' },
			{ code: 'JPY', description: 'Japanese Yen', flag: '🇯🇵' },
			{ code: 'GBP', description: 'British Pound Sterling', flag: '🇬🇧' },
			{ code: 'CHF', description: 'Swiss Franc', flag: '🇨🇭' },
			{ code: 'CNY', description: 'Chinese Yuan', flag: '🇨🇳' },
			{ code: 'INR', description: 'Indian Rupee', flag: '🇮🇳' },
			{ code: 'BRL', description: 'Brazilian Real', flag: '🇧🇷' },
			{ code: 'KRW', description: 'South Korean Won', flag: '🇰🇷' },
			{ code: 'MXN', description: 'Mexican Peso', flag: '🇲🇽' },
		];

		for (const currency of realCurrencies) {
			const result = CurrencySchema.parse(currency);
			expect(result).toEqual(currency);
		}
	});
});
