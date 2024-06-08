import type { DBConfig } from './db'

export type WebviewMessage =
  | {
      command: 'testDBConnection'
      value: DBConfig
    }
  | {
      command: 'sendDBConfig'
      value: DBConfig
    }
