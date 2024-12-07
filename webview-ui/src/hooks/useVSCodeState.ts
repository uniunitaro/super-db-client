import type { ConnectionSettingPanelState } from '@/connection-setting/types/state'
import type { TablePanelState } from '@/table/types/state'
import { vscode } from '@/utilities/vscode'
import type { PersistedClient } from '@tanstack/react-query-persist-client'
import { useCallback, useState } from 'react'

// stateをnullableにしたい場合はundefinedではなくnullを使う
export type VSCodeState = {
  tablePanel?: TablePanelState
  connectionSettingPanel?: ConnectionSettingPanelState
  persistedClient?: {
    client?: PersistedClient
  }
}

export const useVSCodeState = <P extends keyof VSCodeState>(panel: P) =>
  useCallback(
    <
      // Requiredは {foo?: string | undefined} を {foo: string} にしてしまうので、
      // nullableにしたい場合はundefinedではなくnullを使う
      T extends Required<Required<VSCodeState>[P]>[K],
      K extends keyof Required<VSCodeState>[P],
    >(
      key: K,
      initialValue: T,
    ) => {
      // 俺またはTypeScriptの敗北
      const vscodeStoredState = (
        vscode.getState()?.[panel] as Required<VSCodeState>[P] | undefined
      )?.[key]

      const [state, _setState] = useState<
        Required<Required<VSCodeState>[P]>[K]
      >(vscodeStoredState ?? initialValue)

      const setState = useCallback(
        (value: Required<Required<VSCodeState>[P]>[K]) => {
          const currentState = vscode.getState()
          vscode.setState({
            ...currentState,
            [panel]: currentState?.[panel]
              ? { ...currentState[panel], [key]: value }
              : { [key]: value },
          })
          _setState(value)
        },
        [key, panel],
      )

      return [state, setState] as const
    },
    [panel],
  )
