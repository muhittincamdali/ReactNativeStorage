/**
 * SQLiteAdapter - Advanced SQLite Storage Adapter for React Native
 * 
 * Provides a comprehensive SQLite-based storage solution with support for:
 * - CRUD operations with type safety
 * - Transaction management
 * - Query building and optimization
 * - Index management
 * - Data migration
 * - Batch operations
 * - Full-text search
 * - JSON column support
 * 
 * @module SQLiteAdapter
 * @version 2.0.0
 */

import type {
  StorageAdapter,
  StorageOptions,
  QueryOptions,
  BatchOperation,
  TransactionContext,
  IndexDefinition,
  MigrationStep,
  StorageMetrics,
  ConnectionPool,
  PreparedStatement,
  QueryResult,
  TableSchema,
  ColumnDefinition,
  ForeignKeyConstraint,
  TriggerDefinition,
  ViewDefinition,
} from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * SQLite specific configuration options
 */
export interface SQLiteConfig {
  /** Database file name */
  name: string;
  /** Database location (default, library, documents) */
  location?: 'default' | 'Library' | 'Documents' | 'Shared';
  /** Enable foreign key constraints */
  enableForeignKeys?: boolean;
  /** Enable WAL mode for better concurrency */
  enableWAL?: boolean;
  /** Page size in bytes (512 to 65536, must be power of 2) */
  pageSize?: number;
  /** Cache size in pages */
  cacheSize?: number;
  /** Enable memory-mapped I/O */
  enableMMAP?: boolean;
  /** Memory map size in bytes */
  mmapSize?: number;
  /** Synchronous mode (OFF, NORMAL, FULL, EXTRA) */
  synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
  /** Journal mode */
  journalMode?: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'WAL' | 'OFF';
  /** Temp store location */
  tempStore?: 'DEFAULT' | 'FILE' | 'MEMORY';
  /** Locking mode */
  lockingMode?: 'NORMAL' | 'EXCLUSIVE';
  /** Auto vacuum mode */
  autoVacuum?: 'NONE' | 'FULL' | 'INCREMENTAL';
  /** Busy timeout in milliseconds */
  busyTimeout?: number;
  /** Maximum number of connections in pool */
  maxConnections?: number;
  /** Minimum number of connections in pool */
  minConnections?: number;
  /** Connection idle timeout in milliseconds */
  idleTimeout?: number;
  /** Enable query logging */
  enableLogging?: boolean;
  /** Custom logger function */
  logger?: (message: string, level: 'debug' | 'info' | 'warn' | 'error') => void;
}

/**
 * SQLite column types
 */
export type SQLiteColumnType = 
  | 'INTEGER'
  | 'REAL'
  | 'TEXT'
  | 'BLOB'
  | 'NULL'
  | 'NUMERIC'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'JSON';

/**
 * SQLite column definition with constraints
 */
export interface SQLiteColumn {
  name: string;
  type: SQLiteColumnType;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defaultValue?: string | number | boolean | null;
  check?: string;
  collate?: 'BINARY' | 'NOCASE' | 'RTRIM';
  references?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
  };
}

/**
 * SQLite table definition
 */
export interface SQLiteTable {
  name: string;
  columns: SQLiteColumn[];
  primaryKey?: string[];
  uniqueConstraints?: string[][];
  foreignKeys?: ForeignKeyConstraint[];
  checkConstraints?: string[];
  withoutRowid?: boolean;
  strict?: boolean;
}

/**
 * Query execution result
 */
export interface SQLiteResult<T = unknown> {
  rows: T[];
  rowsAffected: number;
  insertId?: number;
  executionTime: number;
  queryPlan?: string;
}

/**
 * Prepared statement handle
 */
export interface SQLitePreparedStatement {
  id: string;
  sql: string;
  parameterCount: number;
  execute: <T>(params?: unknown[]) => Promise<SQLiteResult<T>>;
  finalize: () => Promise<void>;
}

/**
 * Transaction savepoint
 */
export interface Savepoint {
  name: string;
  createdAt: number;
  release: () => Promise<void>;
  rollback: () => Promise<void>;
}

/**
 * Database connection
 */
export interface SQLiteConnection {
  id: string;
  isOpen: boolean;
  inTransaction: boolean;
  createdAt: number;
  lastUsedAt: number;
  execute: <T>(sql: string, params?: unknown[]) => Promise<SQLiteResult<T>>;
  prepare: (sql: string) => Promise<SQLitePreparedStatement>;
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  savepoint: (name: string) => Promise<Savepoint>;
  close: () => Promise<void>;
}

// ============================================================================
// Helper Classes
// ============================================================================

/**
 * Query builder for constructing SQL queries with type safety
 */
export class SQLiteQueryBuilder<T = unknown> {
  private _table: string = '';
  private _select: string[] = ['*'];
  private _where: string[] = [];
  private _whereParams: unknown[] = [];
  private _orderBy: string[] = [];
  private _limit?: number;
  private _offset?: number;
  private _joins: string[] = [];
  private _groupBy: string[] = [];
  private _having: string[] = [];
  private _havingParams: unknown[] = [];
  private _distinct: boolean = false;

  /**
   * Set the table for the query
   */
  table(name: string): this {
    this._table = name;
    return this;
  }

  /**
   * Select specific columns
   */
  select(...columns: string[]): this {
    this._select = columns.length > 0 ? columns : ['*'];
    return this;
  }

  /**
   * Add DISTINCT modifier
   */
  distinct(): this {
    this._distinct = true;
    return this;
  }

  /**
   * Add WHERE clause
   */
  where(column: string, operator: string, value: unknown): this {
    this._where.push(`${column} ${operator} ?`);
    this._whereParams.push(value);
    return this;
  }

  /**
   * Add WHERE with AND
   */
  andWhere(column: string, operator: string, value: unknown): this {
    return this.where(column, operator, value);
  }

  /**
   * Add WHERE with OR
   */
  orWhere(column: string, operator: string, value: unknown): this {
    if (this._where.length > 0) {
      const lastIndex = this._where.length - 1;
      this._where[lastIndex] = `(${this._where[lastIndex]} OR ${column} ${operator} ?)`;
    } else {
      this._where.push(`${column} ${operator} ?`);
    }
    this._whereParams.push(value);
    return this;
  }

  /**
   * Add WHERE IN clause
   */
  whereIn(column: string, values: unknown[]): this {
    const placeholders = values.map(() => '?').join(', ');
    this._where.push(`${column} IN (${placeholders})`);
    this._whereParams.push(...values);
    return this;
  }

  /**
   * Add WHERE NOT IN clause
   */
  whereNotIn(column: string, values: unknown[]): this {
    const placeholders = values.map(() => '?').join(', ');
    this._where.push(`${column} NOT IN (${placeholders})`);
    this._whereParams.push(...values);
    return this;
  }

  /**
   * Add WHERE BETWEEN clause
   */
  whereBetween(column: string, min: unknown, max: unknown): this {
    this._where.push(`${column} BETWEEN ? AND ?`);
    this._whereParams.push(min, max);
    return this;
  }

  /**
   * Add WHERE NULL clause
   */
  whereNull(column: string): this {
    this._where.push(`${column} IS NULL`);
    return this;
  }

  /**
   * Add WHERE NOT NULL clause
   */
  whereNotNull(column: string): this {
    this._where.push(`${column} IS NOT NULL`);
    return this;
  }

  /**
   * Add WHERE LIKE clause
   */
  whereLike(column: string, pattern: string): this {
    this._where.push(`${column} LIKE ?`);
    this._whereParams.push(pattern);
    return this;
  }

  /**
   * Add raw WHERE clause
   */
  whereRaw(sql: string, params: unknown[] = []): this {
    this._where.push(`(${sql})`);
    this._whereParams.push(...params);
    return this;
  }

  /**
   * Add JOIN clause
   */
  join(table: string, column1: string, operator: string, column2: string): this {
    this._joins.push(`JOIN ${table} ON ${column1} ${operator} ${column2}`);
    return this;
  }

  /**
   * Add LEFT JOIN clause
   */
  leftJoin(table: string, column1: string, operator: string, column2: string): this {
    this._joins.push(`LEFT JOIN ${table} ON ${column1} ${operator} ${column2}`);
    return this;
  }

  /**
   * Add RIGHT JOIN clause
   */
  rightJoin(table: string, column1: string, operator: string, column2: string): this {
    this._joins.push(`RIGHT JOIN ${table} ON ${column1} ${operator} ${column2}`);
    return this;
  }

  /**
   * Add CROSS JOIN clause
   */
  crossJoin(table: string): this {
    this._joins.push(`CROSS JOIN ${table}`);
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBy.push(`${column} ${direction}`);
    return this;
  }

  /**
   * Add multiple ORDER BY clauses
   */
  orderByMultiple(orders: Array<{ column: string; direction: 'ASC' | 'DESC' }>): this {
    for (const order of orders) {
      this._orderBy.push(`${order.column} ${order.direction}`);
    }
    return this;
  }

  /**
   * Add ORDER BY random
   */
  orderByRandom(): this {
    this._orderBy.push('RANDOM()');
    return this;
  }

  /**
   * Add GROUP BY clause
   */
  groupBy(...columns: string[]): this {
    this._groupBy.push(...columns);
    return this;
  }

  /**
   * Add HAVING clause
   */
  having(column: string, operator: string, value: unknown): this {
    this._having.push(`${column} ${operator} ?`);
    this._havingParams.push(value);
    return this;
  }

  /**
   * Set LIMIT
   */
  limit(count: number): this {
    this._limit = count;
    return this;
  }

  /**
   * Set OFFSET
   */
  offset(count: number): this {
    this._offset = count;
    return this;
  }

  /**
   * Build SELECT query
   */
  buildSelect(): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    
    parts.push(`SELECT${this._distinct ? ' DISTINCT' : ''} ${this._select.join(', ')}`);
    parts.push(`FROM ${this._table}`);
    
    if (this._joins.length > 0) {
      parts.push(this._joins.join(' '));
    }
    
    if (this._where.length > 0) {
      parts.push(`WHERE ${this._where.join(' AND ')}`);
    }
    
    if (this._groupBy.length > 0) {
      parts.push(`GROUP BY ${this._groupBy.join(', ')}`);
    }
    
    if (this._having.length > 0) {
      parts.push(`HAVING ${this._having.join(' AND ')}`);
    }
    
    if (this._orderBy.length > 0) {
      parts.push(`ORDER BY ${this._orderBy.join(', ')}`);
    }
    
    if (this._limit !== undefined) {
      parts.push(`LIMIT ${this._limit}`);
    }
    
    if (this._offset !== undefined) {
      parts.push(`OFFSET ${this._offset}`);
    }
    
    return {
      sql: parts.join(' '),
      params: [...this._whereParams, ...this._havingParams],
    };
  }

  /**
   * Build COUNT query
   */
  buildCount(column: string = '*'): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    
    parts.push(`SELECT COUNT(${this._distinct ? 'DISTINCT ' : ''}${column}) as count`);
    parts.push(`FROM ${this._table}`);
    
    if (this._joins.length > 0) {
      parts.push(this._joins.join(' '));
    }
    
    if (this._where.length > 0) {
      parts.push(`WHERE ${this._where.join(' AND ')}`);
    }
    
    if (this._groupBy.length > 0) {
      parts.push(`GROUP BY ${this._groupBy.join(', ')}`);
    }
    
    if (this._having.length > 0) {
      parts.push(`HAVING ${this._having.join(' AND ')}`);
    }
    
    return {
      sql: parts.join(' '),
      params: [...this._whereParams, ...this._havingParams],
    };
  }

  /**
   * Build INSERT query
   */
  static buildInsert<T extends Record<string, unknown>>(
    table: string,
    data: T
  ): { sql: string; params: unknown[] } {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
    return {
      sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      params: values,
    };
  }

  /**
   * Build INSERT OR REPLACE query
   */
  static buildUpsert<T extends Record<string, unknown>>(
    table: string,
    data: T
  ): { sql: string; params: unknown[] } {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
    return {
      sql: `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      params: values,
    };
  }

  /**
   * Build batch INSERT query
   */
  static buildBatchInsert<T extends Record<string, unknown>>(
    table: string,
    dataArray: T[]
  ): { sql: string; params: unknown[] } {
    if (dataArray.length === 0) {
      throw new Error('Cannot build batch insert with empty array');
    }
    
    const columns = Object.keys(dataArray[0]);
    const singlePlaceholder = `(${columns.map(() => '?').join(', ')})`;
    const placeholders = dataArray.map(() => singlePlaceholder).join(', ');
    const values = dataArray.flatMap((data) => Object.values(data));
    
    return {
      sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`,
      params: values,
    };
  }

  /**
   * Build UPDATE query
   */
  buildUpdate<U extends Record<string, unknown>>(
    data: U
  ): { sql: string; params: unknown[] } {
    const setClause = Object.keys(data)
      .map((column) => `${column} = ?`)
      .join(', ');
    const values = Object.values(data);
    
    const parts: string[] = [];
    parts.push(`UPDATE ${this._table}`);
    parts.push(`SET ${setClause}`);
    
    if (this._where.length > 0) {
      parts.push(`WHERE ${this._where.join(' AND ')}`);
    }
    
    return {
      sql: parts.join(' '),
      params: [...values, ...this._whereParams],
    };
  }

  /**
   * Build DELETE query
   */
  buildDelete(): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    parts.push(`DELETE FROM ${this._table}`);
    
    if (this._where.length > 0) {
      parts.push(`WHERE ${this._where.join(' AND ')}`);
    }
    
    return {
      sql: parts.join(' '),
      params: this._whereParams,
    };
  }

  /**
   * Reset the query builder
   */
  reset(): this {
    this._table = '';
    this._select = ['*'];
    this._where = [];
    this._whereParams = [];
    this._orderBy = [];
    this._limit = undefined;
    this._offset = undefined;
    this._joins = [];
    this._groupBy = [];
    this._having = [];
    this._havingParams = [];
    this._distinct = false;
    return this;
  }
}

/**
 * Schema builder for creating and modifying tables
 */
export class SQLiteSchemaBuilder {
  private statements: string[] = [];

  /**
   * Create a new table
   */
  createTable(table: SQLiteTable): this {
    const columnDefs: string[] = [];
    const constraints: string[] = [];
    
    for (const column of table.columns) {
      let def = `${column.name} ${column.type}`;
      
      if (column.primaryKey && !table.primaryKey) {
        def += ' PRIMARY KEY';
        if (column.autoIncrement) {
          def += ' AUTOINCREMENT';
        }
      }
      
      if (column.notNull) {
        def += ' NOT NULL';
      }
      
      if (column.unique) {
        def += ' UNIQUE';
      }
      
      if (column.defaultValue !== undefined) {
        if (typeof column.defaultValue === 'string') {
          def += ` DEFAULT '${column.defaultValue}'`;
        } else if (column.defaultValue === null) {
          def += ' DEFAULT NULL';
        } else {
          def += ` DEFAULT ${column.defaultValue}`;
        }
      }
      
      if (column.check) {
        def += ` CHECK (${column.check})`;
      }
      
      if (column.collate) {
        def += ` COLLATE ${column.collate}`;
      }
      
      if (column.references) {
        def += ` REFERENCES ${column.references.table}(${column.references.column})`;
        if (column.references.onDelete) {
          def += ` ON DELETE ${column.references.onDelete}`;
        }
        if (column.references.onUpdate) {
          def += ` ON UPDATE ${column.references.onUpdate}`;
        }
      }
      
      columnDefs.push(def);
    }
    
    if (table.primaryKey && table.primaryKey.length > 0) {
      constraints.push(`PRIMARY KEY (${table.primaryKey.join(', ')})`);
    }
    
    if (table.uniqueConstraints) {
      for (const unique of table.uniqueConstraints) {
        constraints.push(`UNIQUE (${unique.join(', ')})`);
      }
    }
    
    if (table.foreignKeys) {
      for (const fk of table.foreignKeys) {
        let fkDef = `FOREIGN KEY (${fk.columns.join(', ')}) REFERENCES ${fk.referencesTable}(${fk.referencesColumns.join(', ')})`;
        if (fk.onDelete) {
          fkDef += ` ON DELETE ${fk.onDelete}`;
        }
        if (fk.onUpdate) {
          fkDef += ` ON UPDATE ${fk.onUpdate}`;
        }
        constraints.push(fkDef);
      }
    }
    
    if (table.checkConstraints) {
      for (const check of table.checkConstraints) {
        constraints.push(`CHECK (${check})`);
      }
    }
    
    const allDefs = [...columnDefs, ...constraints].join(',\n  ');
    let sql = `CREATE TABLE IF NOT EXISTS ${table.name} (\n  ${allDefs}\n)`;
    
    if (table.withoutRowid) {
      sql += ' WITHOUT ROWID';
    }
    
    if (table.strict) {
      sql += ' STRICT';
    }
    
    this.statements.push(sql);
    return this;
  }

  /**
   * Drop a table
   */
  dropTable(name: string, ifExists: boolean = true): this {
    const sql = `DROP TABLE ${ifExists ? 'IF EXISTS ' : ''}${name}`;
    this.statements.push(sql);
    return this;
  }

  /**
   * Rename a table
   */
  renameTable(oldName: string, newName: string): this {
    this.statements.push(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
    return this;
  }

  /**
   * Add a column to existing table
   */
  addColumn(table: string, column: SQLiteColumn): this {
    let def = `ALTER TABLE ${table} ADD COLUMN ${column.name} ${column.type}`;
    
    if (column.notNull && column.defaultValue !== undefined) {
      def += ' NOT NULL';
    }
    
    if (column.unique) {
      def += ' UNIQUE';
    }
    
    if (column.defaultValue !== undefined) {
      if (typeof column.defaultValue === 'string') {
        def += ` DEFAULT '${column.defaultValue}'`;
      } else if (column.defaultValue === null) {
        def += ' DEFAULT NULL';
      } else {
        def += ` DEFAULT ${column.defaultValue}`;
      }
    }
    
    if (column.references) {
      def += ` REFERENCES ${column.references.table}(${column.references.column})`;
    }
    
    this.statements.push(def);
    return this;
  }

  /**
   * Rename a column (SQLite 3.25.0+)
   */
  renameColumn(table: string, oldName: string, newName: string): this {
    this.statements.push(`ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`);
    return this;
  }

  /**
   * Drop a column (SQLite 3.35.0+)
   */
  dropColumn(table: string, column: string): this {
    this.statements.push(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    return this;
  }

  /**
   * Create an index
   */
  createIndex(
    name: string,
    table: string,
    columns: string[],
    options: { unique?: boolean; where?: string; ifNotExists?: boolean } = {}
  ): this {
    let sql = 'CREATE';
    if (options.unique) {
      sql += ' UNIQUE';
    }
    sql += ' INDEX';
    if (options.ifNotExists) {
      sql += ' IF NOT EXISTS';
    }
    sql += ` ${name} ON ${table} (${columns.join(', ')})`;
    if (options.where) {
      sql += ` WHERE ${options.where}`;
    }
    this.statements.push(sql);
    return this;
  }

  /**
   * Drop an index
   */
  dropIndex(name: string, ifExists: boolean = true): this {
    this.statements.push(`DROP INDEX ${ifExists ? 'IF EXISTS ' : ''}${name}`);
    return this;
  }

  /**
   * Create a view
   */
  createView(name: string, selectSql: string, ifNotExists: boolean = true): this {
    const sql = `CREATE VIEW ${ifNotExists ? 'IF NOT EXISTS ' : ''}${name} AS ${selectSql}`;
    this.statements.push(sql);
    return this;
  }

  /**
   * Drop a view
   */
  dropView(name: string, ifExists: boolean = true): this {
    this.statements.push(`DROP VIEW ${ifExists ? 'IF EXISTS ' : ''}${name}`);
    return this;
  }

  /**
   * Create a trigger
   */
  createTrigger(trigger: TriggerDefinition): this {
    let sql = 'CREATE TRIGGER';
    if (trigger.ifNotExists) {
      sql += ' IF NOT EXISTS';
    }
    sql += ` ${trigger.name}`;
    sql += ` ${trigger.timing} ${trigger.event}`;
    if (trigger.columns) {
      sql += ` OF ${trigger.columns.join(', ')}`;
    }
    sql += ` ON ${trigger.table}`;
    if (trigger.forEachRow) {
      sql += ' FOR EACH ROW';
    }
    if (trigger.when) {
      sql += ` WHEN ${trigger.when}`;
    }
    sql += ` BEGIN ${trigger.body} END`;
    this.statements.push(sql);
    return this;
  }

  /**
   * Drop a trigger
   */
  dropTrigger(name: string, ifExists: boolean = true): this {
    this.statements.push(`DROP TRIGGER ${ifExists ? 'IF EXISTS ' : ''}${name}`);
    return this;
  }

  /**
   * Create FTS5 virtual table
   */
  createFTS5Table(
    name: string,
    columns: string[],
    options: {
      content?: string;
      contentRowid?: string;
      tokenize?: string;
      prefix?: string;
      columnsize?: boolean;
    } = {}
  ): this {
    const opts: string[] = [];
    
    if (options.content !== undefined) {
      opts.push(`content='${options.content}'`);
    }
    if (options.contentRowid) {
      opts.push(`content_rowid='${options.contentRowid}'`);
    }
    if (options.tokenize) {
      opts.push(`tokenize='${options.tokenize}'`);
    }
    if (options.prefix) {
      opts.push(`prefix='${options.prefix}'`);
    }
    if (options.columnsize !== undefined) {
      opts.push(`columnsize=${options.columnsize ? 1 : 0}`);
    }
    
    const allColumns = [...columns, ...opts].join(', ');
    this.statements.push(`CREATE VIRTUAL TABLE IF NOT EXISTS ${name} USING fts5(${allColumns})`);
    return this;
  }

  /**
   * Get all statements
   */
  getStatements(): string[] {
    return [...this.statements];
  }

  /**
   * Clear all statements
   */
  clear(): this {
    this.statements = [];
    return this;
  }
}

// ============================================================================
// Connection Pool
// ============================================================================

/**
 * Connection pool for managing database connections
 */
class SQLiteConnectionPool {
  private connections: SQLiteConnection[] = [];
  private availableConnections: SQLiteConnection[] = [];
  private waitingResolvers: Array<(conn: SQLiteConnection) => void> = [];
  private config: SQLiteConfig;
  private isShuttingDown: boolean = false;

  constructor(config: SQLiteConfig) {
    this.config = config;
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    const minConnections = this.config.minConnections || 1;
    
    for (let i = 0; i < minConnections; i++) {
      const conn = await this.createConnection();
      this.connections.push(conn);
      this.availableConnections.push(conn);
    }
  }

  /**
   * Create a new database connection
   */
  private async createConnection(): Promise<SQLiteConnection> {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In a real implementation, this would use the native SQLite module
    const connection: SQLiteConnection = {
      id,
      isOpen: true,
      inTransaction: false,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      execute: async <T>(sql: string, params?: unknown[]): Promise<SQLiteResult<T>> => {
        connection.lastUsedAt = Date.now();
        // Native implementation would go here
        return {
          rows: [] as T[],
          rowsAffected: 0,
          executionTime: 0,
        };
      },
      prepare: async (sql: string): Promise<SQLitePreparedStatement> => {
        const stmtId = `stmt_${Date.now()}`;
        return {
          id: stmtId,
          sql,
          parameterCount: (sql.match(/\?/g) || []).length,
          execute: async <T>(params?: unknown[]): Promise<SQLiteResult<T>> => {
            return connection.execute<T>(sql, params);
          },
          finalize: async () => {
            // Cleanup prepared statement
          },
        };
      },
      beginTransaction: async () => {
        connection.inTransaction = true;
        await connection.execute('BEGIN TRANSACTION');
      },
      commit: async () => {
        await connection.execute('COMMIT');
        connection.inTransaction = false;
      },
      rollback: async () => {
        await connection.execute('ROLLBACK');
        connection.inTransaction = false;
      },
      savepoint: async (name: string): Promise<Savepoint> => {
        await connection.execute(`SAVEPOINT ${name}`);
        return {
          name,
          createdAt: Date.now(),
          release: async () => {
            await connection.execute(`RELEASE SAVEPOINT ${name}`);
          },
          rollback: async () => {
            await connection.execute(`ROLLBACK TO SAVEPOINT ${name}`);
          },
        };
      },
      close: async () => {
        connection.isOpen = false;
      },
    };
    
    return connection;
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<SQLiteConnection> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down');
    }

    // Check for available connection
    const conn = this.availableConnections.pop();
    if (conn) {
      conn.lastUsedAt = Date.now();
      return conn;
    }

    // Check if we can create a new connection
    const maxConnections = this.config.maxConnections || 10;
    if (this.connections.length < maxConnections) {
      const newConn = await this.createConnection();
      this.connections.push(newConn);
      return newConn;
    }

    // Wait for a connection to become available
    return new Promise((resolve) => {
      this.waitingResolvers.push(resolve);
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: SQLiteConnection): void {
    if (!connection.isOpen) {
      // Connection is closed, remove from pool
      this.connections = this.connections.filter((c) => c.id !== connection.id);
      return;
    }

    // Check if there are waiting requests
    const resolver = this.waitingResolvers.shift();
    if (resolver) {
      connection.lastUsedAt = Date.now();
      resolver(connection);
      return;
    }

    // Return to available pool
    this.availableConnections.push(connection);
  }

  /**
   * Shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Reject all waiting requests
    for (const resolver of this.waitingResolvers) {
      // This would throw an error in the waiting promise
    }
    this.waitingResolvers = [];

    // Close all connections
    for (const conn of this.connections) {
      await conn.close();
    }

    this.connections = [];
    this.availableConnections = [];
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    waiting: number;
  } {
    return {
      total: this.connections.length,
      available: this.availableConnections.length,
      inUse: this.connections.length - this.availableConnections.length,
      waiting: this.waitingResolvers.length,
    };
  }
}

// ============================================================================
// Main SQLite Adapter
// ============================================================================

/**
 * SQLiteAdapter - Main adapter class for SQLite storage operations
 */
export class SQLiteAdapter implements StorageAdapter {
  private config: SQLiteConfig;
  private pool: SQLiteConnectionPool;
  private isInitialized: boolean = false;
  private preparedStatements: Map<string, SQLitePreparedStatement> = new Map();
  private queryMetrics: Map<string, { count: number; totalTime: number }> = new Map();
  private schemaVersion: number = 0;

  constructor(config: SQLiteConfig) {
    this.config = {
      enableForeignKeys: true,
      enableWAL: true,
      pageSize: 4096,
      cacheSize: 2000,
      synchronous: 'NORMAL',
      journalMode: 'WAL',
      tempStore: 'MEMORY',
      busyTimeout: 5000,
      maxConnections: 10,
      minConnections: 2,
      idleTimeout: 30000,
      enableLogging: false,
      ...config,
    };
    this.pool = new SQLiteConnectionPool(this.config);
  }

  /**
   * Initialize the adapter and database connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.pool.initialize();

    // Configure database pragmas
    const conn = await this.pool.acquire();
    try {
      await this.configurePragmas(conn);
      await this.createMetadataTable(conn);
      this.isInitialized = true;
      this.log('SQLite adapter initialized', 'info');
    } finally {
      this.pool.release(conn);
    }
  }

  /**
   * Configure SQLite pragmas
   */
  private async configurePragmas(conn: SQLiteConnection): Promise<void> {
    const pragmas: string[] = [];

    if (this.config.enableForeignKeys) {
      pragmas.push('PRAGMA foreign_keys = ON');
    }

    if (this.config.pageSize) {
      pragmas.push(`PRAGMA page_size = ${this.config.pageSize}`);
    }

    if (this.config.cacheSize) {
      pragmas.push(`PRAGMA cache_size = ${this.config.cacheSize}`);
    }

    if (this.config.synchronous) {
      pragmas.push(`PRAGMA synchronous = ${this.config.synchronous}`);
    }

    if (this.config.journalMode) {
      pragmas.push(`PRAGMA journal_mode = ${this.config.journalMode}`);
    }

    if (this.config.tempStore) {
      pragmas.push(`PRAGMA temp_store = ${this.config.tempStore}`);
    }

    if (this.config.lockingMode) {
      pragmas.push(`PRAGMA locking_mode = ${this.config.lockingMode}`);
    }

    if (this.config.autoVacuum) {
      pragmas.push(`PRAGMA auto_vacuum = ${this.config.autoVacuum}`);
    }

    if (this.config.busyTimeout) {
      pragmas.push(`PRAGMA busy_timeout = ${this.config.busyTimeout}`);
    }

    if (this.config.enableMMAP && this.config.mmapSize) {
      pragmas.push(`PRAGMA mmap_size = ${this.config.mmapSize}`);
    }

    for (const pragma of pragmas) {
      await conn.execute(pragma);
    }
  }

  /**
   * Create metadata table for tracking schema versions
   */
  private async createMetadataTable(conn: SQLiteConnection): Promise<void> {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS __storage_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at INTEGER
      )
    `);

    const result = await conn.execute<{ value: string }>(
      "SELECT value FROM __storage_metadata WHERE key = 'schema_version'"
    );

    if (result.rows.length > 0) {
      this.schemaVersion = parseInt(result.rows[0].value, 10) || 0;
    }
  }

  /**
   * Log a message using the configured logger
   */
  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    if (this.config.enableLogging && this.config.logger) {
      this.config.logger(message, level);
    }
  }

  /**
   * Execute a raw SQL query
   */
  async execute<T = unknown>(
    sql: string,
    params: unknown[] = []
  ): Promise<SQLiteResult<T>> {
    this.ensureInitialized();
    
    const startTime = Date.now();
    const conn = await this.pool.acquire();
    
    try {
      const result = await conn.execute<T>(sql, params);
      const executionTime = Date.now() - startTime;
      
      this.trackQueryMetrics(sql, executionTime);
      this.log(`Query executed in ${executionTime}ms: ${sql.substring(0, 100)}`, 'debug');
      
      return {
        ...result,
        executionTime,
      };
    } finally {
      this.pool.release(conn);
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async executeTransaction<T>(
    callback: (context: TransactionContext) => Promise<T>
  ): Promise<T> {
    this.ensureInitialized();
    
    const conn = await this.pool.acquire();
    
    try {
      await conn.beginTransaction();
      
      const context: TransactionContext = {
        execute: async <R>(sql: string, params?: unknown[]) => {
          return conn.execute<R>(sql, params);
        },
        savepoint: async (name: string) => {
          return conn.savepoint(name);
        },
      };
      
      const result = await callback(context);
      await conn.commit();
      
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      this.pool.release(conn);
    }
  }

  /**
   * Get a value by key from a table
   */
  async get<T>(table: string, key: string): Promise<T | null> {
    const result = await this.execute<{ value: string }>(
      `SELECT value FROM ${table} WHERE key = ?`,
      [key]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    try {
      return JSON.parse(result.rows[0].value) as T;
    } catch {
      return result.rows[0].value as unknown as T;
    }
  }

  /**
   * Set a value by key in a table
   */
  async set<T>(table: string, key: string, value: T): Promise<void> {
    const serializedValue = JSON.stringify(value);
    
    await this.execute(
      `INSERT OR REPLACE INTO ${table} (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, serializedValue, Date.now()]
    );
  }

  /**
   * Delete a value by key from a table
   */
  async delete(table: string, key: string): Promise<boolean> {
    const result = await this.execute(
      `DELETE FROM ${table} WHERE key = ?`,
      [key]
    );
    
    return result.rowsAffected > 0;
  }

  /**
   * Check if a key exists in a table
   */
  async has(table: string, key: string): Promise<boolean> {
    const result = await this.execute<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table} WHERE key = ?`,
      [key]
    );
    
    return result.rows[0].count > 0;
  }

  /**
   * Get all keys from a table
   */
  async keys(table: string, prefix?: string): Promise<string[]> {
    let sql = `SELECT key FROM ${table}`;
    const params: unknown[] = [];
    
    if (prefix) {
      sql += ' WHERE key LIKE ?';
      params.push(`${prefix}%`);
    }
    
    const result = await this.execute<{ key: string }>(sql, params);
    return result.rows.map((row) => row.key);
  }

  /**
   * Get all entries from a table
   */
  async entries<T>(table: string, prefix?: string): Promise<Array<[string, T]>> {
    let sql = `SELECT key, value FROM ${table}`;
    const params: unknown[] = [];
    
    if (prefix) {
      sql += ' WHERE key LIKE ?';
      params.push(`${prefix}%`);
    }
    
    const result = await this.execute<{ key: string; value: string }>(sql, params);
    
    return result.rows.map((row) => {
      try {
        return [row.key, JSON.parse(row.value) as T];
      } catch {
        return [row.key, row.value as unknown as T];
      }
    });
  }

  /**
   * Clear all data from a table
   */
  async clear(table: string): Promise<void> {
    await this.execute(`DELETE FROM ${table}`);
  }

  /**
   * Execute batch operations
   */
  async batch(operations: BatchOperation[]): Promise<void> {
    await this.executeTransaction(async (context) => {
      for (const op of operations) {
        switch (op.type) {
          case 'set':
            await context.execute(
              `INSERT OR REPLACE INTO ${op.table} (key, value, updated_at) VALUES (?, ?, ?)`,
              [op.key, JSON.stringify(op.value), Date.now()]
            );
            break;
          case 'delete':
            await context.execute(
              `DELETE FROM ${op.table} WHERE key = ?`,
              [op.key]
            );
            break;
          case 'clear':
            await context.execute(`DELETE FROM ${op.table}`);
            break;
        }
      }
    });
  }

  /**
   * Create a query builder instance
   */
  query<T = unknown>(): SQLiteQueryBuilder<T> {
    return new SQLiteQueryBuilder<T>();
  }

  /**
   * Create a schema builder instance
   */
  schema(): SQLiteSchemaBuilder {
    return new SQLiteSchemaBuilder();
  }

  /**
   * Execute schema changes
   */
  async executeSchema(builder: SQLiteSchemaBuilder): Promise<void> {
    const statements = builder.getStatements();
    
    await this.executeTransaction(async (context) => {
      for (const sql of statements) {
        await context.execute(sql);
      }
    });
  }

  /**
   * Prepare a statement for repeated execution
   */
  async prepare(name: string, sql: string): Promise<SQLitePreparedStatement> {
    const conn = await this.pool.acquire();
    
    try {
      const stmt = await conn.prepare(sql);
      this.preparedStatements.set(name, stmt);
      return stmt;
    } finally {
      this.pool.release(conn);
    }
  }

  /**
   * Execute a prepared statement
   */
  async executePrepared<T>(
    name: string,
    params: unknown[] = []
  ): Promise<SQLiteResult<T>> {
    const stmt = this.preparedStatements.get(name);
    
    if (!stmt) {
      throw new Error(`Prepared statement '${name}' not found`);
    }
    
    return stmt.execute<T>(params);
  }

  /**
   * Get query execution metrics
   */
  getMetrics(): StorageMetrics {
    const metrics: StorageMetrics = {
      queries: {},
      poolStats: this.pool.getStats(),
    };
    
    this.queryMetrics.forEach((data, sql) => {
      metrics.queries[sql] = {
        count: data.count,
        avgTime: data.totalTime / data.count,
        totalTime: data.totalTime,
      };
    });
    
    return metrics;
  }

  /**
   * Track query metrics
   */
  private trackQueryMetrics(sql: string, executionTime: number): void {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim().substring(0, 100);
    
    const existing = this.queryMetrics.get(normalizedSql) || { count: 0, totalTime: 0 };
    existing.count++;
    existing.totalTime += executionTime;
    
    this.queryMetrics.set(normalizedSql, existing);
  }

  /**
   * Analyze database and get optimization suggestions
   */
  async analyze(): Promise<{
    tables: Array<{ name: string; rowCount: number; size: number }>;
    indexes: Array<{ name: string; table: string; columns: string[] }>;
    suggestions: string[];
  }> {
    this.ensureInitialized();
    
    const tables: Array<{ name: string; rowCount: number; size: number }> = [];
    const indexes: Array<{ name: string; table: string; columns: string[] }> = [];
    const suggestions: string[] = [];
    
    // Get table list
    const tableResult = await this.execute<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    );
    
    for (const table of tableResult.rows) {
      const countResult = await this.execute<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table.name}`
      );
      
      tables.push({
        name: table.name,
        rowCount: countResult.rows[0].count,
        size: 0, // Would need ANALYZE for actual size
      });
      
      // Check for missing indexes on large tables
      if (countResult.rows[0].count > 1000) {
        suggestions.push(`Consider adding indexes to table '${table.name}' (${countResult.rows[0].count} rows)`);
      }
    }
    
    // Get index list
    const indexResult = await this.execute<{ name: string; tbl_name: string; sql: string }>(
      "SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL"
    );
    
    for (const index of indexResult.rows) {
      const columnsMatch = index.sql.match(/\(([^)]+)\)/);
      const columns = columnsMatch
        ? columnsMatch[1].split(',').map((c) => c.trim())
        : [];
      
      indexes.push({
        name: index.name,
        table: index.tbl_name,
        columns,
      });
    }
    
    // Run ANALYZE
    await this.execute('ANALYZE');
    
    return { tables, indexes, suggestions };
  }

  /**
   * Vacuum the database to reclaim space
   */
  async vacuum(): Promise<void> {
    this.ensureInitialized();
    await this.execute('VACUUM');
    this.log('Database vacuumed', 'info');
  }

  /**
   * Checkpoint WAL file
   */
  async checkpoint(mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE' = 'PASSIVE'): Promise<void> {
    this.ensureInitialized();
    await this.execute(`PRAGMA wal_checkpoint(${mode})`);
    this.log(`WAL checkpoint completed (${mode})`, 'info');
  }

  /**
   * Get database integrity check
   */
  async integrityCheck(): Promise<{ ok: boolean; errors: string[] }> {
    const result = await this.execute<{ integrity_check: string }>(
      'PRAGMA integrity_check'
    );
    
    const errors = result.rows
      .map((row) => row.integrity_check)
      .filter((msg) => msg !== 'ok');
    
    return {
      ok: errors.length === 0,
      errors,
    };
  }

  /**
   * Ensure the adapter is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SQLiteAdapter not initialized. Call initialize() first.');
    }
  }

  /**
   * Close the adapter and all connections
   */
  async close(): Promise<void> {
    // Finalize all prepared statements
    for (const stmt of this.preparedStatements.values()) {
      await stmt.finalize();
    }
    this.preparedStatements.clear();
    
    // Shutdown connection pool
    await this.pool.shutdown();
    this.isInitialized = false;
    
    this.log('SQLite adapter closed', 'info');
  }
}

// ============================================================================
// Export
// ============================================================================

export default SQLiteAdapter;
