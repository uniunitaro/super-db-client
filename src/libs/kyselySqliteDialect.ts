import type { Database } from '@junsiklee/vscode-sqlite3'
import type { IGenericSqlite } from 'kysely-generic-sqlite'
import { buildQueryFn, parseBigInt } from 'kysely-generic-sqlite'

export const createSqliteExecutor = (
  db: Database,
): IGenericSqlite<Database> => {
  return {
    db,
    query: buildQueryFn({
      all: (sql, parameters) => {
        return new Promise((resolve, reject) => {
          db.all(sql, parameters || [], (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
          })
        })
      },
      run: (sql, parameters) => {
        return new Promise((resolve, reject) => {
          db.run(sql, parameters || [], function (err) {
            if (err) reject(err)
            else
              resolve({
                insertId: parseBigInt(this.lastID),
                numAffectedRows: parseBigInt(this.changes),
              })
          })
        })
      },
    }),
    close: () => {
      return new Promise<void>((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    },
    iterator: (isSelect, sql, parameters) => {
      if (!isSelect) {
        throw new Error('Only support select in stream()')
      }

      const rows: unknown[] = []
      let index = 0
      let done = false

      const iterator: AsyncIterableIterator<unknown> = {
        next() {
          return new Promise((resolve, reject) => {
            if (done && index >= rows.length) {
              return resolve({ done: true, value: undefined })
            }

            if (index < rows.length) {
              return resolve({ done: false, value: rows[index++] })
            }

            db.each(
              sql,
              parameters,
              (err, row) => {
                if (err) {
                  reject(err)
                  return
                }
                rows.push(row)
              },
              (err) => {
                if (err) {
                  reject(err)
                  return
                }
                done = true
                if (rows.length > index) {
                  resolve({ done: false, value: rows[index++] })
                } else {
                  resolve({ done: true, value: undefined })
                }
              },
            )
          })
        },
        [Symbol.asyncIterator]() {
          return this
        },
      }

      return iterator
    },
  }
}
