import {
  saveDBConfigRequest,
  testDBConnectionRequest,
} from '@shared-types/message'
import type { DBConfigInput } from '@shared-types/sharedTypes'
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { type ChangeEvent, type FC, useState } from 'react'
import { container } from 'styled-system/patterns/container'
import { grid } from 'styled-system/patterns/grid'
import { stack } from 'styled-system/patterns/stack'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import { vscode } from '../utilities/vscode'

const ConnectionSetting: FC = () => {
  const [dbConfig, setDBConfig] = useState<{
    [P in keyof DBConfigInput]: string
  }>({
    connectionName: '',
    host: '',
    port: '',
    user: '',
    password: '',
    database: '',
  })

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    key: keyof DBConfigInput,
  ) => {
    setDBConfig((prev) => ({
      ...prev,
      [key]: e.target.value,
    }))
  }

  const handleClickSaveOrTest = (type: 'save' | 'test') => {
    const request =
      type === 'save' ? saveDBConfigRequest : testDBConnectionRequest
    vscode.messenger.sendRequest(request, HOST_EXTENSION, {
      connectionName: dbConfig.connectionName,
      host: dbConfig.host,
      port: Number(dbConfig.port),
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
    })
  }

  return (
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
              handleChange(e as ChangeEvent<HTMLInputElement>, 'connectionName')
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
}

export default ConnectionSetting
