import { constants, accessSync } from 'node:fs'
import sqlite3 from '@junsiklee/vscode-sqlite3'
import { type Dialect, Kysely, MysqlDialect, sql } from 'kysely'
import { GenericSqliteDialect } from 'kysely-generic-sqlite'
import { createPool } from 'mysql2'
import { Result, ResultAsync, err, errAsync, ok, okAsync } from 'neverthrow'
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
import type {
  DBConfig,
  DBConfigInput,
  SSHConfig,
  SSHPasswordConfig,
  SSHPrivateKeyConfig,
} from '../types/dbConfig'
import { getDBConfigByUUID } from './dbConfig'
import { sshTunnelManager } from './sshTunnel'

let _db: KyselyDB | undefined
let _dbInfo: DBInfo | undefined

const LOCAL_TUNNEL_HOST = '127.0.0.1'

type PreparedConnectionConfig = {
  config: DBConfigInput
  disposeTunnel?: () => Promise<void>
}

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
): ResultAsync<KyselyDB, DatabaseError> => {
  return getDBConfig(context, dbUUID)
    .andThen(ensureSQLiteFileExists)
    .asyncAndThen((dbConfig) =>
      prepareConnectionConfig(dbConfig, {
        persistentKey: dbUUID,
      }).map((prepared) => ({ dbConfig, preparedConfig: prepared.config })),
    )
    .andThen(({ dbConfig, preparedConfig }) =>
      createDialect(preparedConfig, { enableTypeCast: true }).map(
        (dialect) => ({
          dbConfig,
          dialect,
        }),
      ),
    )
    .andThen(({ dbConfig, dialect }) =>
      createKysely(dialect).map((db) => ({ dbConfig, db })),
    )
    .map(({ dbConfig, db }) => {
      _db = db

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
  const fileCheck: Result<DBConfigInput, ValidationError> =
    dbConfigInput.type === 'sqlite'
      ? checkFileExists(dbConfigInput.filePath).map(() => dbConfigInput)
      : ok(dbConfigInput)

  return fileCheck
    .asyncAndThen((config) =>
      prepareConnectionConfig(config).map(
        ({ config: preparedConfig, disposeTunnel }) => ({
          preparedConfig,
          disposeTunnel,
        }),
      ),
    )
    .andThen(({ preparedConfig, disposeTunnel }) =>
      createDialect(preparedConfig).map((dialect) => ({
        dialect,
        disposeTunnel,
      })),
    )
    .andThen(({ dialect, disposeTunnel }) =>
      createKysely(dialect).map((db) => ({ db, disposeTunnel })),
    )
    .andThen(({ db, disposeTunnel }) =>
      ResultAsync.fromPromise(
        sql`SELECT 1`.execute(db).finally(async () => {
          await db.destroy()
          await disposeTunnel?.()
        }),
        toDatabaseError,
      ).map(() => undefined),
    )
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

const getDBConfig = (
  context: ExtensionContext,
  dbUUID: string,
): Result<DBConfig, DatabaseError> => {
  const dbConfig = getDBConfigByUUID(context, dbUUID)
  if (!dbConfig) {
    return err(new DatabaseError('DB not found'))
  }
  return ok(dbConfig)
}

const ensureSQLiteFileExists = (
  dbConfig: DBConfig,
): Result<DBConfig, DatabaseError> => {
  if (dbConfig.type !== 'sqlite') {
    return ok(dbConfig)
  }

  return checkFileExists(dbConfig.filePath)
    .map(() => dbConfig)
    .mapErr((error) => new DatabaseError(error.message, { cause: error }))
}

const prepareConnectionConfig = (
  config: DBConfigInput,
  options?: { persistentKey?: string },
): ResultAsync<PreparedConnectionConfig, DatabaseError> => {
  if (config.type !== 'mysql') {
    if (options?.persistentKey) {
      return ResultAsync.fromPromise(
        sshTunnelManager
          .dispose(options.persistentKey)
          .then(() => ({ config })),
        toDatabaseError,
      )
    }
    return okAsync({ config })
  }

  const resolvedSSH = resolveSSHConfig(config.ssh)
  if (resolvedSSH.isErr()) {
    return errAsync(resolvedSSH.error)
  }

  const sshConfig = resolvedSSH.value
  if (!sshConfig) {
    if (options?.persistentKey) {
      return ResultAsync.fromPromise(
        sshTunnelManager
          .dispose(options.persistentKey)
          .then(() => ({ config })),
        toDatabaseError,
      )
    }
    return okAsync({ config })
  }

  if (options?.persistentKey) {
    return ResultAsync.fromPromise(
      sshTunnelManager.ensure(options.persistentKey, {
        sshConfig,
        dstHost: config.host,
        dstPort: config.port,
      }),
      toDatabaseError,
    ).map((handle) => ({
      config: {
        ...config,
        host: LOCAL_TUNNEL_HOST,
        port: handle.localPort,
      },
    }))
  }

  return ResultAsync.fromPromise(
    sshTunnelManager.create({
      sshConfig,
      dstHost: config.host,
      dstPort: config.port,
    }),
    toDatabaseError,
  ).map((handle) => ({
    config: {
      ...config,
      host: LOCAL_TUNNEL_HOST,
      port: handle.localPort,
    },
    disposeTunnel: handle.dispose,
  }))
}

const resolveSSHConfig = (
  ssh?: SSHConfig,
): Result<
  SSHPasswordConfig | SSHPrivateKeyConfig | undefined,
  DatabaseError
> => {
  if (!ssh || !ssh.enabled) {
    return ok(undefined)
  }

  if (ssh.authMethod === 'password') {
    return ok(ssh)
  }

  if (!ssh.privateKeyPath) {
    return err(new DatabaseError('SSH private key path is required'))
  }

  return ok(ssh)
}
