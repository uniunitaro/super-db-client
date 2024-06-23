import type { TablePanelState } from '@/table/types/state'
import { vscode } from '@/utilities/vscode'
import type { PersistedClient } from '@tanstack/react-query-persist-client'
import { useCallback, useState } from 'react'

export type VSCodeState = {
  tablePanel?: TablePanelState
  persistedClient?: {
    client?: PersistedClient
  }
}

export const useVSCodeState = <P extends keyof Required<VSCodeState>>(
  panel: P,
) =>
  useCallback(
    <
      T extends Required<VSCodeState>[P][K],
      K extends keyof Required<VSCodeState>[P],
    >(
      key: K,
      initialValue: T,
    ) => {
      const [state, _setState] = useState(
        // 俺またはTypeScriptの敗北
        (vscode.getState()?.[panel] as Required<VSCodeState>[P] | undefined)?.[
          key
        ] ?? initialValue,
      )

      const setState = useCallback(
        (value: T | NonNullable<NonNullable<VSCodeState[P]>[K]>) => {
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
