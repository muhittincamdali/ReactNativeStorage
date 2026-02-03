/**
 * Migration Module
 *
 * This module exports the migration system for React Native storage.
 *
 * @module migration
 * @version 2.0.0
 */

export { MigrationManager, createMigrationManager } from './MigrationManager';

export type {
  MigrationConfig,
  Migration,
  MigrationFunction,
  MigrationContext,
  MigrationHelpers,
  MigrationCallbacks,
  MigrationResult,
  ExecutedMigration,
  MigrationError,
} from './MigrationManager';
