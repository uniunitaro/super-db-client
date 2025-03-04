import { constants, accessSync } from 'node:fs'
import sqlite3 from '@junsiklee/vscode-sqlite3'
import { type Dialect, Kysely, MysqlDialect, sql } from 'kysely'
import { GenericSqliteDialect } from 'kysely-generic-sqlite'
import { createPool } from 'mysql2'
import { Result, ResultAsync, err, ok } from 'neverthrow'
import type { ExtensionContext } from 'vscode'
import { createSqliteExecutor } from '../../../libs/kyselySqliteDialect'
import { assertNever } from '../../../utilities/assertNever'
import {
  DatabaseError,
  type ValidationError,
  toDatabaseError,
  toValidationError,
} from '../../core/errors'
import type { DBInfo, KyselyDB } from '../types/connection'
import type { DBConfigInput } from '../types/dbConfig'
import { getDBConfigByUUID } from './dbConfig'

let _db: KyselyDB | undefined
let _dbInfo: DBInfo | undefined

const createKysely = (dialect: Dialect): Result<KyselyDB, DatabaseError> =>
  Result.fromThrowable(
    () => new Kysely({ dialect }),
    (error) => toDatabaseError(error),
  )()

const createDialect = (
  config: DBConfigInput,
  options?: { enableTypeCast?: boolean },
): Result<Dialect, DatabaseError> =>
  Result.fromThrowable(
    () => {
      switch (config.type) {
        case 'mysql':
          return new MysqlDialect({
            pool: createPool({
              host: config.host,
              port: config.port,
              user: config.user,
              password: config.password,
              database: config.database,
              typeCast: (field, next) => {
                if (!options?.enableTypeCast) return next()

                if (
                  field.type === 'DATE' ||
                  field.type === 'DATETIME' ||
                  field.type === 'TIMESTAMP'
                ) {
                  // デフォルトはDate型で返るので文字列にする
                  return field.string()
                }
                return next()
              },
            }),
          })
        case 'sqlite':
          return new GenericSqliteDialect(() =>
            createSqliteExecutor(new sqlite3.Database(config.filePath)),
          )
        default:
          return assertNever(config)
      }
    },
    (error) => toDatabaseError(error),
  )()

export const connect = (
  context: ExtensionContext,
  dbUUID: string,
): Result<KyselyDB, DatabaseError> => {
  const dbConfig = getDBConfigByUUID(context, dbUUID)
  if (!dbConfig) {
    return err(new DatabaseError('DB not found'))
  }

  const fileExists =
    dbConfig.type === 'sqlite'
      ? checkFileExists(dbConfig.filePath)
      : ok(undefined)

  return fileExists
    .andThen(() => createDialect(dbConfig, { enableTypeCast: true }))
    .andThen(createKysely)
    .map((kysely) => {
      _db = kysely

      switch (dbConfig.type) {
        case 'mysql':
          _dbInfo = {
            type: dbConfig.type,
            schema: dbConfig.database,
          }
          break
        case 'sqlite':
          _dbInfo = {
            type: dbConfig.type,
            schema: 'main',
          }
          break
        default:
          assertNever(dbConfig)
      }

      return _db
    })
}

export const testConnection = (
  dbConfigInput: DBConfigInput,
): ResultAsync<void, DatabaseError | ValidationError> => {
  const fileExists =
    dbConfigInput.type === 'sqlite'
      ? checkFileExists(dbConfigInput.filePath)
      : ok(undefined)

  return fileExists
    .andThen(() => createDialect(dbConfigInput))
    .andThen(createKysely)
    .asyncAndThen((db) =>
      ResultAsync.fromPromise(
        sql`SELECT 1`.execute(db).finally(() => db.destroy()),
        toDatabaseError,
      ),
    )
    .map(() => undefined)
}

export const getDB = (): KyselyDB | undefined => {
  return _db
}

export const getDBInfo = (): DBInfo | undefined => {
  return _dbInfo
}

const checkFileExists = (filePath: string): Result<void, ValidationError> => {
  return Result.fromThrowable(
    () => accessSync(filePath, constants.F_OK),
    () => toValidationError(new Error('ファイルが存在しません')),
  )()
}
