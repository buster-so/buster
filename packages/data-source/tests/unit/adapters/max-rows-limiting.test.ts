import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MySQLAdapter } from '../../../src/adapters/mysql';
import { PostgreSQLAdapter } from '../../../src/adapters/postgresql';
import { SnowflakeAdapter } from '../../../src/adapters/snowflake';
import { SQLServerAdapter } from '../../../src/adapters/sqlserver';

describe('MaxRows Limiting Tests', () => {
  describe('PostgreSQL Adapter', () => {
    let adapter: PostgreSQLAdapter;
    let mockClient: {
      connect: ReturnType<typeof vi.fn>;
      query: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
    };
    let mockCursor: {
      read: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
      _result: { fields: Array<{ name: string; dataTypeID: number; dataTypeSize: number }> };
    };

    beforeEach(() => {
      adapter = new PostgreSQLAdapter();
      mockClient = {
        connect: vi.fn(),
        query: vi.fn(),
        end: vi.fn(),
      };
      mockCursor = {
        read: vi.fn(),
        close: vi.fn(),
        _result: {
          fields: [
            { name: 'id', dataTypeID: 23, dataTypeSize: 4 },
            { name: 'name', dataTypeID: 25, dataTypeSize: -1 },
          ],
        },
      };
      (adapter as PostgreSQLAdapter & { client: typeof mockClient; connected: boolean }).client =
        mockClient;
      (adapter as PostgreSQLAdapter & { client: typeof mockClient; connected: boolean }).connected =
        true;
    });

    it('should limit results to exactly 1 row when maxRows=1', async () => {
      // Mock cursor behavior for 1 row limit
      mockClient.query.mockReturnValue(mockCursor);
      mockCursor.read.mockImplementationOnce(
        (count: number, callback: (err: unknown, rows: unknown[]) => void) => {
          // First read returns 2 rows (more than requested)
          callback(null, [
            { id: 1, name: 'User 1' },
            { id: 2, name: 'User 2' },
          ]);
        }
      );
      mockCursor.close.mockImplementation((callback: (err: unknown) => void) => callback(null));

      const result = await adapter.query('SELECT * FROM users', undefined, 1);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: 1, name: 'User 1' });
      expect(result.hasMoreRows).toBe(true);
      expect(mockCursor.read).toHaveBeenCalledWith(2, expect.any(Function)); // When maxRows=1, readSize = min(1, 1) + 1 = 2
    });

    it('should limit results to exactly 5 rows when maxRows=5', async () => {
      mockClient.query.mockReturnValue(mockCursor);
      const allRows = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
      }));

      mockCursor.read.mockImplementationOnce(
        (count: number, callback: (err: unknown, rows: unknown[]) => void) => {
          // Return 6 rows (more than requested 5)
          callback(null, allRows.slice(0, 6));
        }
      );
      mockCursor.close.mockImplementation((callback: (err: unknown) => void) => callback(null));

      const result = await adapter.query('SELECT * FROM users', undefined, 5);

      expect(result.rows).toHaveLength(5);
      expect(result.rows[0]).toEqual({ id: 1, name: 'User 1' });
      expect(result.rows[4]).toEqual({ id: 5, name: 'User 5' });
      expect(result.hasMoreRows).toBe(true);
    });

    it('should return all rows when result set is smaller than maxRows', async () => {
      mockClient.query.mockReturnValue(mockCursor);
      mockCursor.read
        .mockImplementationOnce((count: number, callback: Function) => {
          // Return only 3 rows when asking for 10
          callback(null, [
            { id: 1, name: 'User 1' },
            { id: 2, name: 'User 2' },
            { id: 3, name: 'User 3' },
          ]);
        })
        .mockImplementationOnce((count: number, callback: Function) => {
          // No more rows
          callback(null, []);
        });
      mockCursor.close.mockImplementation((callback: (err: unknown) => void) => callback(null));

      const result = await adapter.query('SELECT * FROM users', undefined, 10);

      expect(result.rows).toHaveLength(3);
      expect(result.hasMoreRows).toBe(false);
    });
  });

  describe('MySQL Adapter', () => {
    let adapter: MySQLAdapter;
    let mockConnection: {
      execute: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      adapter = new MySQLAdapter();
      mockConnection = {
        execute: vi.fn(),
        end: vi.fn(),
      };
      (
        adapter as MySQLAdapter & { connection: typeof mockConnection; connected: boolean }
      ).connection = mockConnection;
      (
        adapter as MySQLAdapter & { connection: typeof mockConnection; connected: boolean }
      ).connected = true;
    });

    it('should limit results to exactly 1 row when maxRows=1', async () => {
      // MySQL adapter limits in memory after fetching
      mockConnection.execute.mockResolvedValue([
        [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
          { id: 3, name: 'User 3' },
        ],
        [
          { name: 'id', type: 3, flags: 0 },
          { name: 'name', type: 253, flags: 0 },
        ],
      ]);

      const result = await adapter.query('SELECT * FROM users', undefined, 1);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: 1, name: 'User 1' });
      expect(result.hasMoreRows).toBe(true);
    });

    it('should limit results to exactly 5 rows when maxRows=5', async () => {
      const allRows = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
      }));

      mockConnection.execute.mockResolvedValue([
        allRows,
        [
          { name: 'id', type: 3, flags: 0 },
          { name: 'name', type: 253, flags: 0 },
        ],
      ]);

      const result = await adapter.query('SELECT * FROM users', undefined, 5);

      expect(result.rows).toHaveLength(5);
      expect(result.rows[0]).toEqual({ id: 1, name: 'User 1' });
      expect(result.rows[4]).toEqual({ id: 5, name: 'User 5' });
      expect(result.hasMoreRows).toBe(true);
    });
  });

  describe('Snowflake Adapter', () => {
    let adapter: SnowflakeAdapter;
    let mockConnection: {
      execute: ReturnType<typeof vi.fn>;
      destroy: ReturnType<typeof vi.fn>;
    };
    let mockStatement: {
      getColumns: ReturnType<typeof vi.fn>;
      streamRows: ReturnType<typeof vi.fn>;
    };
    let mockStream: {
      on: ReturnType<typeof vi.fn>;
      destroy: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      adapter = new SnowflakeAdapter();
      mockStatement = {
        getColumns: vi.fn().mockReturnValue([
          {
            getName: () => 'id',
            getType: () => 'NUMBER',
            isNullable: () => false,
            getScale: () => 0,
            getPrecision: () => 10,
          },
          {
            getName: () => 'name',
            getType: () => 'VARCHAR',
            isNullable: () => true,
            getScale: () => 0,
            getPrecision: () => 0,
          },
        ]),
        streamRows: vi.fn(),
      };
      mockStream = {
        on: vi.fn(),
        destroy: vi.fn(),
        destroyed: false,
      };
      mockConnection = {
        execute: vi.fn(),
      };
      mockStatement.streamRows.mockReturnValue(mockStream);
      (
        adapter as SnowflakeAdapter & { connection: typeof mockConnection; connected: boolean }
      ).connection = mockConnection;
      (
        adapter as SnowflakeAdapter & { connection: typeof mockConnection; connected: boolean }
      ).connected = true;
    });

    it('should limit results to exactly 1 row when maxRows=1', async () => {
      let dataHandler: (data: unknown) => void;
      let endHandler: () => void;

      mockStream.on.mockImplementation((event: string, handler: (data?: unknown) => void) => {
        if (event === 'data') dataHandler = handler;
        if (event === 'end') endHandler = handler;
        return mockStream;
      });

      mockConnection.execute.mockImplementation(
        (options: { streamResult: boolean; complete: (err?: unknown) => void }) => {
          expect(options.streamResult).toBe(true);
          // Defer the callback to allow the statement to be returned first
          setTimeout(() => {
            options.complete(undefined);
            // Now simulate streaming after complete callback
            dataHandler({ id: 1, name: 'User 1' });
            dataHandler({ id: 2, name: 'User 2' }); // This should trigger destroy

            // Verify stream was destroyed after 1 row
            expect(mockStream.destroy).toHaveBeenCalled();

            endHandler();
          }, 0);
          return mockStatement;
        }
      );

      const result = await adapter.query('SELECT * FROM users', undefined, 1);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: 1, name: 'User 1' });
      expect(result.hasMoreRows).toBe(true);
    });
  });

  describe('SQL Server Adapter', () => {
    let adapter: SQLServerAdapter;
    let mockPool: {
      request: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };
    let mockRequest: {
      input: ReturnType<typeof vi.fn>;
      query: ReturnType<typeof vi.fn>;
      on: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
      stream: boolean;
    };

    beforeEach(() => {
      adapter = new SQLServerAdapter();
      mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn(),
        on: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(),
        stream: false,
      };
      mockPool = {
        request: vi.fn().mockReturnValue(mockRequest),
        close: vi.fn(),
      };
      (adapter as SQLServerAdapter & { pool: typeof mockPool; connected: boolean }).pool = mockPool;
      (adapter as SQLServerAdapter & { pool: typeof mockPool; connected: boolean }).connected =
        true;
    });

    it('should limit results to exactly 1 row when maxRows=1', async () => {
      let rowHandler: Function;
      let doneHandler: Function;
      let recordsetHandler: Function;

      mockRequest.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'row') rowHandler = handler;
        if (event === 'done') doneHandler = handler;
        if (event === 'recordset') recordsetHandler = handler;
      });

      const queryPromise = adapter.query('SELECT * FROM users', undefined, 1);

      // Verify streaming was enabled
      expect(mockRequest.stream).toBe(true);

      // Emit column metadata
      recordsetHandler!({
        id: { type: () => ({ name: 'int' }), nullable: false },
        name: { type: () => ({ name: 'varchar' }), nullable: true },
      });

      // Emit rows
      rowHandler!({ id: 1, name: 'User 1' });
      rowHandler!({ id: 2, name: 'User 2' }); // This should trigger pause and cancel

      // Verify request was paused and cancelled
      expect(mockRequest.pause).toHaveBeenCalled();
      expect(mockRequest.cancel).toHaveBeenCalled();

      doneHandler!();

      const result = await queryPromise;
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: 1, name: 'User 1' });
      expect(result.hasMoreRows).toBe(true);
    });
  });
});
