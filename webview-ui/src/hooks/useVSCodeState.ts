import type { ConnectionSettingPanelState } from '@/connection-setting/types/state'
import type { TablePanelState } from '@/table/types/state'
import { vscode } from '@/utilities/vscode'
import { useCallback, useState } from 'react'

// stateをnullableにしたい場合はundefinedではなくnullを使う
export type VSCodeState = {
  tablePanel?: TablePanelState
  connectionSettingPanel?: ConnectionSettingPanelState
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
      type State = Required<Required<VSCodeState>[P]>[K]

      const vscodeStoredState = (
        vscode.getState()?.[panel] satisfies
          | Required<VSCodeState>[P]
          | undefined
      )?.[key]

      const [state, _setState] = useState<State>(
        vscodeStoredState ?? initialValue,
      )

      const setState = useCallback(
        (value: ((prevState: State) => State) | State) => {
          const setVSCodeState = (value: State) => {
            const currentState = vscode.getState()
            vscode.setState({
              ...currentState,
              [panel]: currentState?.[panel]
                ? { ...currentState[panel], [key]: value }
                : { [key]: value },
            })
          }

          // FIXME: typeof value === 'function'で型が正しく推論されないというかStateがFunctionな可能性があるからそれを考慮しなきゃいけないはずだが一旦無視、実用上は問題ない
          if (value instanceof Function) {
            _setState((prevState) => {
              const newValue = value(prevState)

              setVSCodeState(newValue)

              return newValue
            })
            return
          }

          setVSCodeState(value)
          _setState(value)
        },
        [key, panel],
      )

      return [state, setState] as const
    },
    [panel],
  )
