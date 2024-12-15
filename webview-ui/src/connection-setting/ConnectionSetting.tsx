import { useVSCodeState } from '@/hooks/useVSCodeState'
import { messenger } from '@/utilities/messenger'
import {
  getConnectionSettingInitialDataRequest,
  saveDBConfigRequest,
  testDBConnectionRequest,
} from '@shared-types/message'
import type { DBConfigInput } from '@shared-types/sharedTypes'
import { useQuery } from '@tanstack/react-query'
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { type ChangeEvent, type FC, useEffect } from 'react'
import { container } from 'styled-system/patterns/container'
import { grid } from 'styled-system/patterns/grid'
import { stack } from 'styled-system/patterns/stack'
import { HOST_EXTENSION } from 'vscode-messenger-common'

const ConnectionSetting: FC = () => {
  const useConnectionSettingPanelState = useVSCodeState(
    'connectionSettingPanel',
  )

  const [dbConfig, setDBConfig] = useConnectionSettingPanelState('config', {
    targetUUID: undefined,
    connectionName: '',
    host: '',
    port: '',
    user: '',
    password: '',
    database: '',
  })

  const {
    data: initialData,
    isPending: isInitialDataPending,
    error: initialDataError,
  } = useQuery({
    queryKey: ['getConnectionSettingInitialData'],
    queryFn: () =>
      messenger.sendRequest(
        getConnectionSettingInitialDataRequest,
        HOST_EXTENSION,
      ),
  })
  useEffect(() => {
    if (initialData && dbConfig.targetUUID === undefined) {
      setDBConfig({
        ...initialData,
        port: initialData.port.toString(),
        targetUUID: initialData.uuid,
      })
    }
  }, [dbConfig.targetUUID, initialData, setDBConfig])

  useEffect(() => {
    messenger.start()
  }, [])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    key: keyof DBConfigInput,
  ) => {
    setDBConfig({ ...dbConfig, [key]: e.target.value })
  }

  const handleClickSaveOrTest = (type: 'save' | 'test') => {
    const request =
      type === 'save' ? saveDBConfigRequest : testDBConnectionRequest
    messenger.sendRequest(request, HOST_EXTENSION, {
      ...dbConfig,
      port: Number(dbConfig.port),
    })
  }

  return (
    !isInitialDataPending && (
      <main
        className={container({
          maxW: 'sm',
          py: '10',
        })}
      >
        <div className={stack({ gap: '6' })}>
          <div className={stack({ gap: '2' })}>
            <VSCodeTextField
              value={dbConfig.connectionName}
              onInput={(e) =>
                handleChange(
                  e as ChangeEvent<HTMLInputElement>,
                  'connectionName',
                )
              }
            >
              Name
            </VSCodeTextField>
            <VSCodeTextField
              value={dbConfig.host}
              onInput={(e) =>
                handleChange(e as ChangeEvent<HTMLInputElement>, 'host')
              }
            >
              Host
            </VSCodeTextField>
            <VSCodeTextField
              value={dbConfig.port}
              onInput={(e) =>
                handleChange(e as ChangeEvent<HTMLInputElement>, 'port')
              }
            >
              Port
            </VSCodeTextField>
            <VSCodeTextField
              value={dbConfig.user}
              onInput={(e) =>
                handleChange(e as ChangeEvent<HTMLInputElement>, 'user')
              }
            >
              User
            </VSCodeTextField>
            <VSCodeTextField
              value={dbConfig.password}
              onInput={(e) =>
                handleChange(e as ChangeEvent<HTMLInputElement>, 'password')
              }
            >
              Password
            </VSCodeTextField>
            <VSCodeTextField
              value={dbConfig.database}
              onInput={(e) =>
                handleChange(e as ChangeEvent<HTMLInputElement>, 'database')
              }
            >
              Database
            </VSCodeTextField>
          </div>
          <div className={grid({ columns: 2 })}>
            <VSCodeButton
              appearance="secondary"
              onClick={() => handleClickSaveOrTest('test')}
            >
              Test
            </VSCodeButton>
            <VSCodeButton onClick={() => handleClickSaveOrTest('save')}>
              Save
            </VSCodeButton>
          </div>
        </div>
      </main>
    )
  )
}

export default ConnectionSetting
