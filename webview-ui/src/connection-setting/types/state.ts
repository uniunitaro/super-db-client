import type { DBConfigInput } from '@shared-types/sharedTypes'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AllKeys<T> = T extends any ? keyof T : never

type FormValue<T> = T extends number ? string : T

type ForForm<T> = {
  [P in AllKeys<T>]: FormValue<Extract<T, { [K in P]?: unknown }>[P]>
}

export type DBConfigInputForForm = ForForm<DBConfigInput>

export type ConnectionSettingPanelState = {
  config?: DBConfigInputForForm
}
