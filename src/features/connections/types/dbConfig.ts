import type { StrictOmit } from '../../../utilities/typeUtils'

export type DBType = 'mysql' | 'sqlite'

export type BaseDBConfig = {
  uuid: string
  connectionName: string
  type: DBType
}

export type MySQLDBConfig = BaseDBConfig & {
  type: 'mysql'
  host: string
  port: number
  user: string
  password: string
  database: string
}

export type SQLiteDBConfig = BaseDBConfig & {
  type: 'sqlite'
  filePath: string
}

export type DBConfig = MySQLDBConfig | SQLiteDBConfig

export type DBConfigInput = StrictOmit<DBConfig, 'uuid'> & {
  targetUUID?: string
}
