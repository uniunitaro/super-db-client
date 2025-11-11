import type { StrictOmit } from '../../../utilities/typeUtils'

export type DBType = 'mysql' | 'sqlite'

export type BaseDBConfig = {
  uuid: string
  connectionName: string
  type: DBType
  ssh?: SSHConfig
}

export type SSHAuthMethod = 'password' | 'privateKey'

type SSHBaseConfig = {
  enabled: true
  host: string
  port: number
  username: string
}

export type SSHPasswordConfig = SSHBaseConfig & {
  authMethod: 'password'
  password: string
}

export type SSHPrivateKeyConfig = SSHBaseConfig & {
  authMethod: 'privateKey'
  privateKeyPath: string
  passphrase?: string
}

export type SSHDisabledConfig = {
  enabled: false
  host?: string
  port?: number
  username?: string
  authMethod?: SSHAuthMethod
  password?: string
  privateKeyPath?: string
  passphrase?: string
}

export type SSHConfig =
  | SSHPasswordConfig
  | SSHPrivateKeyConfig
  | SSHDisabledConfig

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
