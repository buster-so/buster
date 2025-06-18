import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from '../../../src/tools/database-tools/execute-sql';
import { validateArrayAccess } from '../../../src/utils/validation-helpers';

describe('Execute SQL Tool Streaming Parser', () => {
  test('should return null for empty or invalid input', () => {
    expect(parseStreamingArgs('')).toBeNull();
    expect(parseStreamingArgs('{')).toBeNull();
    expect(parseStreamingArgs('invalid json')).toBeNull();
    expect(parseStreamingArgs('{"other_field":')).toBeNull();
  });

  test('should parse complete JSON with statements array', () => {
    const completeJson = JSON.stringify({
      statements: [
        'SELECT user_id, name FROM public.users LIMIT 25',
        "SELECT COUNT(*) FROM public.orders WHERE created_at >= '2024-01-01'",
      ],
    });

    const result = parseStreamingArgs(completeJson);

    expect(result).toEqual({
      statements: [
        'SELECT user_id, name FROM public.users LIMIT 25',
        "SELECT COUNT(*) FROM public.orders WHERE created_at >= '2024-01-01'",
      ],
    });
  });

  test('should extract partial statements array as it builds incrementally', () => {
    // Simulate the streaming chunks building up a statements array
    const chunks = [
      '{"statements"',
      '{"statements":',
      '{"statements": [',
      '{"statements": ["',
      '{"statements": ["SELECT',
      '{"statements": ["SELECT user_id',
      '{"statements": ["SELECT user_id, name',
      '{"statements": ["SELECT user_id, name FROM',
      '{"statements": ["SELECT user_id, name FROM public.users"',
      '{"statements": ["SELECT user_id, name FROM public.users",',
      '{"statements": ["SELECT user_id, name FROM public.users", "',
      '{"statements": ["SELECT user_id, name FROM public.users", "SELECT COUNT(*)"',
      '{"statements": ["SELECT user_id, name FROM public.users", "SELECT COUNT(*)"]}',
    ];

    // Test incremental building
    expect(parseStreamingArgs(validateArrayAccess(chunks, 0, 'test chunks'))).toBeNull(); // No colon yet
    expect(parseStreamingArgs(validateArrayAccess(chunks, 1, 'test chunks'))).toBeNull(); // No array start yet
    expect(parseStreamingArgs(validateArrayAccess(chunks, 2, 'test chunks'))).toEqual({
      statements: [],
    }); // Empty array detected
    expect(parseStreamingArgs(validateArrayAccess(chunks, 3, 'test chunks'))).toEqual({
      statements: [],
    }); // Incomplete string
    expect(parseStreamingArgs(validateArrayAccess(chunks, 4, 'test chunks'))).toEqual({
      statements: [],
    }); // Still incomplete
    expect(parseStreamingArgs(validateArrayAccess(chunks, 5, 'test chunks'))).toEqual({
      statements: [],
    }); // Still incomplete
    expect(parseStreamingArgs(validateArrayAccess(chunks, 6, 'test chunks'))).toEqual({
      statements: [],
    }); // Still incomplete
    expect(parseStreamingArgs(validateArrayAccess(chunks, 7, 'test chunks'))).toEqual({
      statements: [],
    }); // Still incomplete
    expect(parseStreamingArgs(validateArrayAccess(chunks, 8, 'test chunks'))).toEqual({
      statements: ['SELECT user_id, name FROM public.users'],
    }); // First complete statement
    expect(parseStreamingArgs(validateArrayAccess(chunks, 9, 'test chunks'))).toEqual({
      statements: ['SELECT user_id, name FROM public.users'],
    }); // Comma added
    expect(parseStreamingArgs(validateArrayAccess(chunks, 10, 'test chunks'))).toEqual({
      statements: ['SELECT user_id, name FROM public.users'],
    }); // Second statement starting
    expect(parseStreamingArgs(validateArrayAccess(chunks, 11, 'test chunks'))).toEqual({
      statements: ['SELECT user_id, name FROM public.users', 'SELECT COUNT(*)'],
    }); // Second statement complete

    // Final complete chunk should be parsed as complete JSON
    const finalResult = parseStreamingArgs(validateArrayAccess(chunks, 12, 'test chunks'));
    expect(finalResult).toEqual({
      statements: ['SELECT user_id, name FROM public.users', 'SELECT COUNT(*)'],
    });
  });

  test('should handle single statement', () => {
    const singleStatement = '{"statements": ["SELECT * FROM public.users"]}';
    const result = parseStreamingArgs(singleStatement);

    expect(result).toEqual({
      statements: ['SELECT * FROM public.users'],
    });
  });

  test('should handle escaped quotes in SQL statements', () => {
    const withEscapedQuotes =
      '{"statements": ["SELECT name FROM users WHERE status = \\"active\\""]}';
    const result = parseStreamingArgs(withEscapedQuotes);

    expect(result).toEqual({
      statements: ['SELECT name FROM users WHERE status = "active"'],
    });
  });

  test('should handle complex SQL with newlines and special characters', () => {
    const complexSql = JSON.stringify({
      statements: [
        'SELECT \n  u.user_id,\n  u.name,\n  COUNT(o.order_id) as order_count\nFROM public.users u\nLEFT JOIN public.orders o ON u.user_id = o.user_id\nGROUP BY u.user_id, u.name',
      ],
    });

    const result = parseStreamingArgs(complexSql);

    expect(result).toEqual({
      statements: [
        'SELECT \n  u.user_id,\n  u.name,\n  COUNT(o.order_id) as order_count\nFROM public.users u\nLEFT JOIN public.orders o ON u.user_id = o.user_id\nGROUP BY u.user_id, u.name',
      ],
    });
  });

  test('should handle multiple statements being built incrementally', () => {
    const partialMultiple = '{"statements": ["SELECT user_id FROM users", "SELECT';
    const result = parseStreamingArgs(partialMultiple);

    // Should extract the complete first statement only
    expect(result).toEqual({
      statements: ['SELECT user_id FROM users'],
    });
  });

  test('should handle whitespace variations', () => {
    const withWhitespace = '{ "statements" : [ "SELECT * FROM table" , "SELECT COUNT(*)" ]';
    const result = parseStreamingArgs(withWhitespace);

    expect(result).toEqual({
      statements: ['SELECT * FROM table', 'SELECT COUNT(*)'],
    });
  });

  test('should handle empty statements array', () => {
    const emptyArray = '{"statements": []}';
    const result = parseStreamingArgs(emptyArray);

    expect(result).toEqual({
      statements: [],
    });
  });

  test('should handle statements with date literals and special characters', () => {
    const withDates = JSON.stringify({
      statements: [
        "SELECT * FROM orders WHERE created_at >= '2024-01-01'",
        'SELECT COUNT(*) FROM products WHERE price > 100.50',
      ],
    });

    const result = parseStreamingArgs(withDates);

    expect(result).toEqual({
      statements: [
        "SELECT * FROM orders WHERE created_at >= '2024-01-01'",
        'SELECT COUNT(*) FROM products WHERE price > 100.50',
      ],
    });
  });

  test('should return undefined for statements if field is not present', () => {
    const withoutStatements = '{"other_field": "value"}';
    const result = parseStreamingArgs(withoutStatements);

    expect(result).toEqual({
      statements: undefined,
    });
  });

  test('should handle incomplete array with partial second statement', () => {
    const partialSecond = '{"statements": ["SELECT user_id FROM users", "SELECT COUNT(*) FROM';
    const result = parseStreamingArgs(partialSecond);

    // Should only return the complete first statement
    expect(result).toEqual({
      statements: ['SELECT user_id FROM users'],
    });
  });

  test('should handle statements with schema qualifiers', () => {
    const withSchema = JSON.stringify({
      statements: [
        'SELECT analytics.users.user_id FROM analytics.users',
        'SELECT public.orders.order_id FROM public.orders WHERE public.orders.total > 100',
      ],
    });

    const result = parseStreamingArgs(withSchema);

    expect(result).toEqual({
      statements: [
        'SELECT analytics.users.user_id FROM analytics.users',
        'SELECT public.orders.order_id FROM public.orders WHERE public.orders.total > 100',
      ],
    });
  });
});
