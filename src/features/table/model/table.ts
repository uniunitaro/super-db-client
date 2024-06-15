import type { Kysely } from 'kysely'
import type { KyselyDB } from '../../connection/types/connection'
import type { TableRow } from '../types/table'

export const getRows = async ({
  db,
  tableName,
  order,
  orderBy,
  limit,
  offset,
}: {
  db: KyselyDB
  tableName: string
  order?: 'asc' | 'desc'
  orderBy?: string
  limit: number
  offset: number
}): Promise<TableRow[]> => {
  // biome-ignore lint/suspicious/noExplicitAny: We don't know the type of the table
  let query = (db as Kysely<any>)
    .selectFrom(tableName)
    .selectAll()
    .limit(limit)
    .offset(offset)

  if (order && orderBy) {
    query = query.orderBy(orderBy, order)
  }

  const rows = await query.execute()
  return rows
}
