export type DBConfig = {
  uuid: string
  connectionName: string
  host: string
  port: number
  user: string
  password: string
  database: string
}

export type DBConfigInput = Omit<DBConfig, 'uuid'>
