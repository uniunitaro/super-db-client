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
  VSCodeCheckbox,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeTextField,
} from '@vscode/webview-ui-toolkit/react'
import { type ChangeEvent, type FC, useEffect } from 'react'
import { container } from 'styled-system/patterns/container'
import { grid } from 'styled-system/patterns/grid'
import { stack } from 'styled-system/patterns/stack'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import type { DBConfigInputForForm, SSHFormState } from './types/state'

const createDefaultSSHConfig = (): SSHFormState => ({
  enabled: false,
  host: '',
  port: '22',
  username: '',
  authMethod: 'password',
  password: '',
  privateKeyPath: '',
  passphrase: '',
})

const createDefaultDBConfig = (): DBConfigInputForForm => ({
  targetUUID: undefined,
  connectionName: '',
  type: 'mysql',
  writeMode: 'allow',
  database: '',
  host: '',
  port: '',
  user: '',
  password: '',
  filePath: '',
  ssh: createDefaultSSHConfig(),
})

const convertSSHConfigToForm = (ssh?: DBConfigInput['ssh']): SSHFormState => {
  if (!ssh) {
    return createDefaultSSHConfig()
  }

  if (!ssh.enabled) {
    return {
      ...createDefaultSSHConfig(),
      enabled: false,
      host: ssh.host ?? '',
      port: ssh.port ? ssh.port.toString() : '22',
      username: ssh.username ?? '',
      authMethod: ssh.authMethod ?? 'password',
      password:
        'password' in ssh && typeof ssh.password === 'string'
          ? ssh.password
          : '',
      privateKeyPath:
        'privateKeyPath' in ssh && typeof ssh.privateKeyPath === 'string'
          ? ssh.privateKeyPath
          : '',
      passphrase:
        'passphrase' in ssh && typeof ssh.passphrase === 'string'
          ? (ssh.passphrase ?? '')
          : '',
    }
  }

  if (ssh.authMethod === 'password') {
    return {
      enabled: true,
      host: ssh.host ?? '',
      port: ssh.port?.toString() ?? '22',
      username: ssh.username ?? '',
      authMethod: 'password',
      password: ssh.password ?? '',
      privateKeyPath: '',
      passphrase: '',
    }
  }

  return {
    enabled: true,
    host: ssh.host ?? '',
    port: ssh.port?.toString() ?? '22',
    username: ssh.username ?? '',
    authMethod: 'privateKey',
    password: '',
    privateKeyPath: ssh.privateKeyPath ?? '',
    passphrase: ssh.passphrase ?? '',
  }
}

const convertSSHFormToInput = (
  ssh?: DBConfigInputForForm['ssh'],
): DBConfigInput['ssh'] | undefined => {
  if (!ssh) return undefined

  if (!ssh.enabled) {
    const hasValue = Boolean(
      ssh.host?.length ||
        ssh.port?.length ||
        ssh.username?.length ||
        ssh.password?.length ||
        ssh.privateKeyPath?.length ||
        ssh.passphrase?.length,
    )
    if (!hasValue) {
      return undefined
    }

    return {
      enabled: false,
      host: ssh.host || undefined,
      port: ssh.port ? Number(ssh.port) : undefined,
      username: ssh.username || undefined,
      authMethod: ssh.authMethod,
      password: ssh.password || undefined,
      privateKeyPath: ssh.privateKeyPath || undefined,
      passphrase: ssh.passphrase || undefined,
    }
  }

  if (ssh.authMethod === 'password') {
    return {
      enabled: true,
      authMethod: 'password',
      host: ssh.host ?? '',
      port: Number(ssh.port ?? '22'),
      username: ssh.username ?? '',
      password: ssh.password ?? '',
    }
  }

  return {
    enabled: true,
    authMethod: 'privateKey',
    host: ssh.host ?? '',
    port: Number(ssh.port ?? '22'),
    username: ssh.username ?? '',
    privateKeyPath: ssh.privateKeyPath ?? '',
    passphrase: ssh.passphrase || undefined,
  }
}

const ConnectionSetting: FC = () => {
  const useConnectionSettingPanelState = useVSCodeState(
    'connectionSettingPanel',
  )

  const [dbConfig, setDBConfig] = useConnectionSettingPanelState(
    'config',
    createDefaultDBConfig(),
  )
  const sshConfig = dbConfig.ssh ?? createDefaultSSHConfig()

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
            ...createDefaultDBConfig(),
            ...initialData,
            port: initialData.port.toString(),
            targetUUID: initialData.uuid,
            ssh: convertSSHConfigToForm(initialData.ssh),
            writeMode: initialData.writeMode,
          })
          break
        case 'sqlite':
          setDBConfig({
            ...createDefaultDBConfig(),
            ...initialData,
            targetUUID: initialData.uuid,
            ssh: convertSSHConfigToForm(initialData.ssh),
            writeMode: initialData.writeMode,
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

  const handleSSHFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    key: keyof SSHFormState,
  ) => {
    setDBConfig({
      ...dbConfig,
      ssh: {
        ...(dbConfig.ssh ?? createDefaultSSHConfig()),
        [key]: e.target.value,
      },
    })
  }

  const handleSSHEnabledChange = (checked: boolean) => {
    setDBConfig({
      ...dbConfig,
      ssh: {
        ...(dbConfig.ssh ?? createDefaultSSHConfig()),
        enabled: checked,
      },
    })
  }

  const handleClickSaveOrTest = (type: 'save' | 'test') => {
    const request =
      type === 'save' ? saveDBConfigRequest : testDBConnectionRequest

    const input: DBConfigInput = (() => {
      switch (dbConfig.type) {
        case 'mysql':
          return {
            targetUUID: dbConfig.targetUUID,
            connectionName: dbConfig.connectionName,
            type: 'mysql',
            writeMode: dbConfig.writeMode,
            database: dbConfig.database,
            host: dbConfig.host,
            port: Number(dbConfig.port),
            user: dbConfig.user,
            password: dbConfig.password,
            ssh: convertSSHFormToInput(dbConfig.ssh),
          }
        case 'sqlite':
          return {
            targetUUID: dbConfig.targetUUID,
            connectionName: dbConfig.connectionName,
            type: 'sqlite',
            writeMode: dbConfig.writeMode,
            filePath: dbConfig.filePath,
            ssh: convertSSHFormToInput(dbConfig.ssh),
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
              {/* biome-ignore lint/a11y/noLabelWithoutControl: TODO */}
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
            <div className={stack({ gap: '0' })}>
              {/* biome-ignore lint/a11y/noLabelWithoutControl: TODO */}
              <label>Write Mode</label>
              <VSCodeDropdown
                value={dbConfig.writeMode}
                onChange={(e) =>
                  handleChange(e as ChangeEvent<HTMLSelectElement>, 'writeMode')
                }
              >
                <VSCodeOption value="allow">Allow writes</VSCodeOption>
                <VSCodeOption value="warn">Warn before writes</VSCodeOption>
                <VSCodeOption value="disable">Disable writes</VSCodeOption>
              </VSCodeDropdown>
            </div>
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
                <div className={stack({ gap: '1' })}>
                  <VSCodeCheckbox
                    checked={sshConfig.enabled}
                    onChange={(e) =>
                      handleSSHEnabledChange(
                        (e as ChangeEvent<HTMLInputElement>).target.checked,
                      )
                    }
                  >
                    Connect via SSH tunnel
                  </VSCodeCheckbox>
                  {sshConfig.enabled ? (
                    <div className={stack({ gap: '2' })}>
                      <VSCodeTextField
                        value={sshConfig.host}
                        onInput={(e) =>
                          handleSSHFieldChange(
                            e as ChangeEvent<HTMLInputElement>,
                            'host',
                          )
                        }
                      >
                        SSH Host
                      </VSCodeTextField>
                      <VSCodeTextField
                        value={sshConfig.port}
                        onInput={(e) =>
                          handleSSHFieldChange(
                            e as ChangeEvent<HTMLInputElement>,
                            'port',
                          )
                        }
                      >
                        SSH Port
                      </VSCodeTextField>
                      <VSCodeTextField
                        value={sshConfig.username}
                        onInput={(e) =>
                          handleSSHFieldChange(
                            e as ChangeEvent<HTMLInputElement>,
                            'username',
                          )
                        }
                      >
                        SSH Username
                      </VSCodeTextField>
                      <div className={stack({ gap: '0' })}>
                        {/* biome-ignore lint/a11y/noLabelWithoutControl: TODO */}
                        <label>SSH Auth Method</label>
                        <VSCodeDropdown
                          value={sshConfig.authMethod}
                          onChange={(e) =>
                            handleSSHFieldChange(
                              e as ChangeEvent<HTMLSelectElement>,
                              'authMethod',
                            )
                          }
                        >
                          <VSCodeOption value="password">Password</VSCodeOption>
                          <VSCodeOption value="privateKey">
                            Private Key
                          </VSCodeOption>
                        </VSCodeDropdown>
                      </div>
                      {sshConfig.authMethod === 'password' ? (
                        <VSCodeTextField
                          value={sshConfig.password}
                          onInput={(e) =>
                            handleSSHFieldChange(
                              e as ChangeEvent<HTMLInputElement>,
                              'password',
                            )
                          }
                        >
                          SSH Password
                        </VSCodeTextField>
                      ) : (
                        <>
                          <VSCodeTextField
                            value={sshConfig.privateKeyPath}
                            onInput={(e) =>
                              handleSSHFieldChange(
                                e as ChangeEvent<HTMLInputElement>,
                                'privateKeyPath',
                              )
                            }
                          >
                            Private Key Path
                          </VSCodeTextField>
                          <VSCodeTextField
                            value={sshConfig.passphrase}
                            onInput={(e) =>
                              handleSSHFieldChange(
                                e as ChangeEvent<HTMLInputElement>,
                                'passphrase',
                              )
                            }
                          >
                            Passphrase (optional)
                          </VSCodeTextField>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
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
