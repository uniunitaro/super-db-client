import { type Dialect, Kysely, MysqlDialect, sql } from 'kysely'
import { NodeWasmDialect } from 'kysely-wasm'
import { createPool } from 'mysql2'
import { Result, ResultAsync, err } from 'neverthrow'
import { Database } from 'node-sqlite3-wasm'
import type { ExtensionContext } from 'vscode'
import { assertNever } from '../../../utilities/assertNever'
import { DatabaseError, toDatabaseError } from '../../core/errors'
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
          return new NodeWasmDialect({
            database: new Database(config.filePath, {
              fileMustExist: true,
            }),
          })
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

  return createDialect(dbConfig, { enableTypeCast: true })
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
): ResultAsync<void, DatabaseError> => {
  return createDialect(dbConfigInput)
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
