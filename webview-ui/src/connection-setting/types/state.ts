import type { DBConfigInput, SSHAuthMethod } from '@shared-types/sharedTypes'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AllKeys<T> = T extends any ? keyof T : never

type FormValue<T> = T extends number
  ? string
  : T extends object
    ? ForForm<T>
    : T

type ForForm<T> = {
  [P in AllKeys<T>]: FormValue<Extract<T, { [K in P]?: unknown }>[P]>
}

export type SSHFormState = {
  enabled: boolean
  host: string
  port: string
  username: string
  authMethod: SSHAuthMethod
  password: string
  privateKeyPath: string
  passphrase: string
}

export type DBConfigInputForForm = Omit<ForForm<DBConfigInput>, 'ssh'> & {
  ssh: SSHFormState
}

export type ConnectionSettingPanelState = {
  config?: DBConfigInputForForm
}
