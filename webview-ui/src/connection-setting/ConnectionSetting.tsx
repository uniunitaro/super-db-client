import { useVSCodeState } from '@/hooks/useVSCodeState'
import { assertNever } from '@/utilities/assertNever'
import { messenger } from '@/utilities/messenger'
import {
  getConnectionSettingInitialDataRequest,
  saveDBConfigRequest,
  testDBConnectionRequest,
} from '@shared-types/message'
import type { DBConfigInput } from '@shared-types/sharedTypes'
import { useQuery } from '@tanstack/react-query'
import {
  VSCodeButton,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeTextField,
} from '@vscode/webview-ui-toolkit/react'
import { type ChangeEvent, type FC, useEffect } from 'react'
import { container } from 'styled-system/patterns/container'
import { grid } from 'styled-system/patterns/grid'
import { stack } from 'styled-system/patterns/stack'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import type { DBConfigInputForForm } from './types/state'

const defaultDBConfig: DBConfigInputForForm = {
  targetUUID: undefined,
  connectionName: '',
  type: 'mysql',
  database: '',
  host: '',
  port: '',
  user: '',
  password: '',
  filePath: '',
}

const ConnectionSetting: FC = () => {
  const useConnectionSettingPanelState = useVSCodeState(
    'connectionSettingPanel',
  )

  const [dbConfig, setDBConfig] = useConnectionSettingPanelState('config', {
    ...defaultDBConfig,
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
      switch (initialData.type) {
        case 'mysql':
          setDBConfig({
            ...defaultDBConfig,
            ...initialData,
            port: initialData.port.toString(),
            targetUUID: initialData.uuid,
          })
          break
        case 'sqlite':
          setDBConfig({
            ...defaultDBConfig,
            ...initialData,
            targetUUID: initialData.uuid,
          })
          break
        default:
          assertNever(initialData)
      }
    }
  }, [dbConfig.targetUUID, initialData, setDBConfig])

  useEffect(() => {
    messenger.start()
  }, [])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    key: keyof DBConfigInputForForm,
  ) => {
    setDBConfig({ ...dbConfig, [key]: e.target.value })
  }

  const handleClickSaveOrTest = (type: 'save' | 'test') => {
    const request =
      type === 'save' ? saveDBConfigRequest : testDBConnectionRequest

    const input: DBConfigInput = (() => {
      switch (dbConfig.type) {
        case 'mysql':
          return {
            ...dbConfig,
            type: dbConfig.type,
            port: Number(dbConfig.port),
          }
        case 'sqlite':
          return {
            ...dbConfig,
            type: dbConfig.type,
          }
        default:
          return assertNever(dbConfig.type)
      }
    })()

    messenger.sendRequest(request, HOST_EXTENSION, input)
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
            <div className={stack({ gap: '0' })}>
              <label>Database Type</label>
              <VSCodeDropdown
                value={dbConfig.type}
                onChange={(e) =>
                  handleChange(e as ChangeEvent<HTMLSelectElement>, 'type')
                }
              >
                <VSCodeOption value="mysql">MySQL</VSCodeOption>
                <VSCodeOption value="sqlite">SQLite</VSCodeOption>
              </VSCodeDropdown>
            </div>
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
            {dbConfig.type === 'mysql' ? (
              <>
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
              </>
            ) : (
              <VSCodeTextField
                value={dbConfig.filePath}
                onInput={(e) =>
                  handleChange(e as ChangeEvent<HTMLInputElement>, 'filePath')
                }
              >
                File Path
              </VSCodeTextField>
            )}
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
