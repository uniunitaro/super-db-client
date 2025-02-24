import type { Kysely } from 'kysely'
import type { DBType } from './dbConfig'

export type KyselyDB = Kysely<unknown>

// biome-ignore lint/suspicious/noExplicitAny: We don't know the type of the table
export type KyselyAnyDB = Kysely<any>

export type DBInfo = {
  type: DBType
  schema: string
}
