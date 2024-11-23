import { Kysely, MysqlDialect, sql } from 'kysely'
import { createPool } from 'mysql2'
import type { ExtensionContext } from 'vscode'
import { getErrorMessage } from '../../../utilities/getErrorMessage'
import type { DBConfigInput } from '../types/dbConfig'
import { getDBConfigs } from './dbConfig'

export class DB {
  private static _db: Kysely<unknown> | undefined
  public static database: string

  private constructor(context: ExtensionContext, dbUUID: string) {
    const dbConfig = getDBConfigs(context).find(
      (dbConfig) => dbConfig.uuid === dbUUID,
    )
    if (!dbConfig) {
      throw new Error('DB not found')
    }

    const dialect = new MysqlDialect({
      pool: createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        typeCast: (field, next) => {
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

    DB._db = new Kysely({
      dialect,
    })

    DB.database = dbConfig.database
  }

  public static connect(context: ExtensionContext, dbUUID: string): DB {
    return new DB(context, dbUUID)
  }

  public static get(): Kysely<unknown> | undefined {
    return DB._db
  }
}

export const testConnection = async (
  dbConfigInput: DBConfigInput,
): Promise<{ error?: string }> => {
  const dialect = new MysqlDialect({
    pool: createPool({
      host: dbConfigInput.host,
      port: dbConfigInput.port,
      user: dbConfigInput.user,
      password: dbConfigInput.password,
      database: dbConfigInput.database,
    }),
  })

  const db = new Kysely({
    dialect,
  })

  try {
    await sql`SELECT 1`.execute(db)
    return {}
  } catch (error) {
    return { error: getErrorMessage(error) }
  } finally {
    await db.destroy()
  }
}
