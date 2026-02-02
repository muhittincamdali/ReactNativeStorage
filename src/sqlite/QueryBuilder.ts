type WhereCondition = {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
  value?: unknown;
};

type OrderDirection = 'ASC' | 'DESC';

type OrderClause = {
  column: string;
  direction: OrderDirection;
};

export class QueryBuilder {
  private tableName: string;
  private selectColumns: string[] = ['*'];
  private whereConditions: WhereCondition[] = [];
  private orderClauses: OrderClause[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private params: unknown[] = [];

  constructor(table: string) {
    this.tableName = table;
  }

  static from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  }

  select(...columns: string[]): this {
    this.selectColumns = columns.length > 0 ? columns : ['*'];
    return this;
  }

  where(column: string, operator: WhereCondition['operator'], value?: unknown): this {
    this.whereConditions.push({ column, operator, value });
    if (value !== undefined && operator !== 'IS NULL' && operator !== 'IS NOT NULL') {
      if (operator === 'IN' && Array.isArray(value)) {
        this.params.push(...value);
      } else {
        this.params.push(value);
      }
    }
    return this;
  }

  whereEquals(column: string, value: unknown): this {
    return this.where(column, '=', value);
  }

  whereLike(column: string, pattern: string): this {
    return this.where(column, 'LIKE', pattern);
  }

  whereNull(column: string): this {
    return this.where(column, 'IS NULL');
  }

  whereNotNull(column: string): this {
    return this.where(column, 'IS NOT NULL');
  }

  whereIn(column: string, values: unknown[]): this {
    return this.where(column, 'IN', values);
  }

  orderBy(column: string, direction: OrderDirection = 'ASC'): this {
    this.orderClauses.push({ column, direction });
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  buildSelect(): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    parts.push(`SELECT ${this.selectColumns.join(', ')}`);
    parts.push(`FROM ${this.tableName}`);

    if (this.whereConditions.length > 0) {
      const clauses = this.whereConditions.map((cond) => {
        if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
          return `${cond.column} ${cond.operator}`;
        }
        if (cond.operator === 'IN' && Array.isArray(cond.value)) {
          const placeholders = cond.value.map(() => '?').join(', ');
          return `${cond.column} IN (${placeholders})`;
        }
        return `${cond.column} ${cond.operator} ?`;
      });
      parts.push(`WHERE ${clauses.join(' AND ')}`);
    }

    if (this.orderClauses.length > 0) {
      const orders = this.orderClauses.map((o) => `${o.column} ${o.direction}`);
      parts.push(`ORDER BY ${orders.join(', ')}`);
    }

    if (this.limitValue !== undefined) {
      parts.push(`LIMIT ${this.limitValue}`);
    }

    if (this.offsetValue !== undefined) {
      parts.push(`OFFSET ${this.offsetValue}`);
    }

    return { sql: parts.join(' '), params: [...this.params] };
  }

  buildInsert(data: Record<string, unknown>): { sql: string; params: unknown[] } {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    return {
      sql: `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
      params: values,
    };
  }

  buildUpdate(data: Record<string, unknown>): { sql: string; params: unknown[] } {
    const setClauses = Object.keys(data).map((col) => `${col} = ?`);
    const setParams = Object.values(data);

    const parts: string[] = [];
    parts.push(`UPDATE ${this.tableName}`);
    parts.push(`SET ${setClauses.join(', ')}`);

    if (this.whereConditions.length > 0) {
      const clauses = this.whereConditions.map((cond) => {
        if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
          return `${cond.column} ${cond.operator}`;
        }
        return `${cond.column} ${cond.operator} ?`;
      });
      parts.push(`WHERE ${clauses.join(' AND ')}`);
    }

    return { sql: parts.join(' '), params: [...setParams, ...this.params] };
  }

  buildDelete(): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    parts.push(`DELETE FROM ${this.tableName}`);

    if (this.whereConditions.length > 0) {
      const clauses = this.whereConditions.map((cond) => {
        if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
          return `${cond.column} ${cond.operator}`;
        }
        return `${cond.column} ${cond.operator} ?`;
      });
      parts.push(`WHERE ${clauses.join(' AND ')}`);
    }

    return { sql: parts.join(' '), params: [...this.params] };
  }

  reset(): this {
    this.selectColumns = ['*'];
    this.whereConditions = [];
    this.orderClauses = [];
    this.limitValue = undefined;
    this.offsetValue = undefined;
    this.params = [];
    return this;
  }
}
