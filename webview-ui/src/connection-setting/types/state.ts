import type { DBConfigInput } from '@shared-types/sharedTypes'

export type ConnectionSettingPanelState = {
  config?: { [P in keyof DBConfigInput]: string }
}
