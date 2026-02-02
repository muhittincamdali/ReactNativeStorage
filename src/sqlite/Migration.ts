import { MigrationStep, SQLiteDatabase } from '../types';

const MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    description TEXT,
    applied_at INTEGER NOT NULL
  )
`;

export class MigrationRunner {
  private db: SQLiteDatabase;
  private migrations: MigrationStep[] = [];

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  register(...steps: MigrationStep[]): this {
    this.migrations.push(...steps);
    this.migrations.sort((a, b) => a.version - b.version);
    return this;
  }

  async initialize(): Promise<void> {
    await this.db.execute(MIGRATION_TABLE_SQL);
  }

  async getCurrentVersion(): Promise<number> {
    const result = await this.db.execute(
      'SELECT MAX(version) as version FROM schema_migrations'
    );
    return (result.rows[0]?.version as number) ?? 0;
  }

  async getPendingMigrations(): Promise<MigrationStep[]> {
    const currentVersion = await this.getCurrentVersion();
    return this.migrations.filter((m) => m.version > currentVersion);
  }

  async migrate(): Promise<number> {
    await this.initialize();
    const pending = await this.getPendingMigrations();

    let applied = 0;
    for (const migration of pending) {
      try {
        await migration.up(this.db);
        await this.db.execute(
          'INSERT INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.description ?? '', Date.now()]
        );
        applied++;
      } catch (error) {
        throw new MigrationError(
          `Migration v${migration.version} failed: ${(error as Error).message}`
        );
      }
    }

    return applied;
  }

  async rollback(targetVersion = 0): Promise<number> {
    await this.initialize();
    const currentVersion = await this.getCurrentVersion();

    const toRollback = this.migrations
      .filter((m) => m.version > targetVersion && m.version <= currentVersion)
      .reverse();

    let rolledBack = 0;
    for (const migration of toRollback) {
      try {
        await migration.down(this.db);
        await this.db.execute(
          'DELETE FROM schema_migrations WHERE version = ?',
          [migration.version]
        );
        rolledBack++;
      } catch (error) {
        throw new MigrationError(
          `Rollback v${migration.version} failed: ${(error as Error).message}`
        );
      }
    }

    return rolledBack;
  }

  async getAppliedMigrations(): Promise<Array<{ version: number; description: string; appliedAt: number }>> {
    const result = await this.db.execute(
      'SELECT version, description, applied_at FROM schema_migrations ORDER BY version'
    );
    return result.rows.map((row) => ({
      version: row.version as number,
      description: row.description as string,
      appliedAt: row.applied_at as number,
    }));
  }
}

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}
