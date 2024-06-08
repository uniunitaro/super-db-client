import type { DBConfig } from '@shared-types/db'
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { useState, type ChangeEvent, type FC } from 'react'
import { Container, Grid, Stack } from 'styled-system/jsx'
import './index.css'
import { vscode } from './utilities/vscode'

const App: FC = () => {
  const [dbConfig, setDBConfig] = useState<{
    [P in keyof DBConfig]: string
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
    key: keyof DBConfig,
  ) => {
    setDBConfig((prev) => ({
      ...prev,
      [key]: e.target.value,
    }))
  }

  const handleClickSaveOrTest = (type: 'save' | 'test') => {
    vscode.postMessage({
      command: type === 'save' ? 'sendDBConfig' : 'testDBConnection',
      value: {
        connectionName: dbConfig.connectionName,
        host: dbConfig.host,
        port: Number(dbConfig.port),
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
      },
    })
  }

  return (
    <main>
      <Container maxW="sm" py="10">
        <Stack gap={6}>
          <Stack gap={2}>
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
          </Stack>
          <Grid columns={2}>
            <VSCodeButton
              appearance="secondary"
              onClick={() => handleClickSaveOrTest('test')}
            >
              Test
            </VSCodeButton>
            <VSCodeButton onClick={() => handleClickSaveOrTest('save')}>
              Save
            </VSCodeButton>
          </Grid>
        </Stack>
      </Container>
    </main>
  )
}

export default App
