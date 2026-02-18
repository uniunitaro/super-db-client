import { useVSCodeState } from '@/hooks/useVSCodeState'
import { assertNever } from '@/utilities/assertNever'
import { messenger } from '@/utilities/messenger'
import {
  readEventTargetChecked,
  readEventTargetValue,
} from '@/utilities/readEventTarget'
import {
  getConnectionSettingInitialDataRequest,
  saveDBConfigRequest,
  testDBConnectionRequest,
} from '@shared-types/message'
import type { DBConfigInput } from '@shared-types/sharedTypes'
import { useQuery } from '@tanstack/react-query'
import {
  VscodeButton,
  VscodeCheckbox,
  VscodeFormGroup,
  VscodeLabel,
  VscodeOption,
  VscodeSingleSelect,
  VscodeTextfield,
} from '@vscode-elements/react-elements'
import { type ComponentProps, type FC, useEffect } from 'react'
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

type LabeledTextFieldProps = {
  id: string
  label: string
} & Omit<ComponentProps<typeof VscodeTextfield>, 'children' | 'id'>

const LabeledTextField: FC<LabeledTextFieldProps> = ({
  id,
  label,
  ...props
}) => (
  <VscodeFormGroup variant="vertical">
    <VscodeLabel htmlFor={id}>{label}</VscodeLabel>
    <VscodeTextfield id={id} {...props} />
  </VscodeFormGroup>
)

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

  const handleChange = (value: string, key: keyof DBConfigInputForForm) => {
    setDBConfig({ ...dbConfig, [key]: value })
  }

  const handleSSHFieldChange = (value: string, key: keyof SSHFormState) => {
    setDBConfig({
      ...dbConfig,
      ssh: {
        ...(dbConfig.ssh ?? createDefaultSSHConfig()),
        [key]: value,
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
            <VscodeFormGroup variant="vertical">
              <VscodeLabel htmlFor="type">Database Type</VscodeLabel>
              <VscodeSingleSelect
                id="type"
                value={dbConfig.type}
                onChange={(event) =>
                  handleChange(readEventTargetValue(event), 'type')
                }
              >
                <VscodeOption value="mysql">MySQL</VscodeOption>
                <VscodeOption value="sqlite">SQLite</VscodeOption>
              </VscodeSingleSelect>
            </VscodeFormGroup>
            <LabeledTextField
              id="connection-name"
              label="Name"
              value={dbConfig.connectionName}
              onInput={(event) =>
                handleChange(readEventTargetValue(event), 'connectionName')
              }
            />
            <VscodeFormGroup variant="vertical">
              <VscodeLabel htmlFor="write-mode">Write Mode</VscodeLabel>
              <VscodeSingleSelect
                id="write-mode"
                value={dbConfig.writeMode}
                onChange={(event) =>
                  handleChange(readEventTargetValue(event), 'writeMode')
                }
              >
                <VscodeOption value="allow">Allow writes</VscodeOption>
                <VscodeOption value="warn">Warn before writes</VscodeOption>
                <VscodeOption value="disable">Disable writes</VscodeOption>
              </VscodeSingleSelect>
            </VscodeFormGroup>
            {dbConfig.type === 'mysql' ? (
              <>
                <LabeledTextField
                  id="host"
                  label="Host"
                  value={dbConfig.host}
                  onInput={(event) =>
                    handleChange(readEventTargetValue(event), 'host')
                  }
                />
                <LabeledTextField
                  id="port"
                  label="Port"
                  value={dbConfig.port}
                  onInput={(event) =>
                    handleChange(readEventTargetValue(event), 'port')
                  }
                />
                <LabeledTextField
                  id="user"
                  label="User"
                  value={dbConfig.user}
                  onInput={(event) =>
                    handleChange(readEventTargetValue(event), 'user')
                  }
                />
                <LabeledTextField
                  id="password"
                  label="Password"
                  value={dbConfig.password}
                  onInput={(event) =>
                    handleChange(readEventTargetValue(event), 'password')
                  }
                />
                <LabeledTextField
                  id="database"
                  label="Database"
                  value={dbConfig.database}
                  onInput={(event) =>
                    handleChange(readEventTargetValue(event), 'database')
                  }
                />
                <div className={stack({ gap: '1' })}>
                  <VscodeCheckbox
                    checked={sshConfig.enabled}
                    onChange={(event) =>
                      handleSSHEnabledChange(readEventTargetChecked(event))
                    }
                  >
                    Connect via SSH tunnel
                  </VscodeCheckbox>
                  {sshConfig.enabled ? (
                    <div className={stack({ gap: '2' })}>
                      <LabeledTextField
                        id="ssh-host"
                        label="SSH Host"
                        value={sshConfig.host}
                        onInput={(event) =>
                          handleSSHFieldChange(
                            readEventTargetValue(event),
                            'host',
                          )
                        }
                      />
                      <LabeledTextField
                        id="ssh-port"
                        label="SSH Port"
                        value={sshConfig.port}
                        onInput={(event) =>
                          handleSSHFieldChange(
                            readEventTargetValue(event),
                            'port',
                          )
                        }
                      />
                      <LabeledTextField
                        id="ssh-username"
                        label="SSH Username"
                        value={sshConfig.username}
                        onInput={(event) =>
                          handleSSHFieldChange(
                            readEventTargetValue(event),
                            'username',
                          )
                        }
                      />
                      <VscodeFormGroup variant="vertical">
                        <VscodeLabel htmlFor="ssh-auth-method">
                          SSH Auth Method
                        </VscodeLabel>
                        <VscodeSingleSelect
                          id="ssh-auth-method"
                          value={sshConfig.authMethod}
                          onChange={(event) =>
                            handleSSHFieldChange(
                              readEventTargetValue(event),
                              'authMethod',
                            )
                          }
                        >
                          <VscodeOption value="password">Password</VscodeOption>
                          <VscodeOption value="privateKey">
                            Private Key
                          </VscodeOption>
                        </VscodeSingleSelect>
                      </VscodeFormGroup>
                      {sshConfig.authMethod === 'password' ? (
                        <LabeledTextField
                          id="ssh-password"
                          label="SSH Password"
                          value={sshConfig.password}
                          onInput={(event) =>
                            handleSSHFieldChange(
                              readEventTargetValue(event),
                              'password',
                            )
                          }
                        />
                      ) : (
                        <>
                          <LabeledTextField
                            id="private-key-path"
                            label="Private Key Path"
                            value={sshConfig.privateKeyPath}
                            onInput={(event) =>
                              handleSSHFieldChange(
                                readEventTargetValue(event),
                                'privateKeyPath',
                              )
                            }
                          />
                          <LabeledTextField
                            id="passphrase"
                            label="Passphrase (optional)"
                            value={sshConfig.passphrase}
                            onInput={(event) =>
                              handleSSHFieldChange(
                                readEventTargetValue(event),
                                'passphrase',
                              )
                            }
                          />
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <LabeledTextField
                id="file-path"
                label="File Path"
                value={dbConfig.filePath}
                onInput={(event) =>
                  handleChange(readEventTargetValue(event), 'filePath')
                }
              />
            )}
          </div>
          <div className={grid({ columns: 2 })}>
            <VscodeButton
              secondary
              onClick={() => handleClickSaveOrTest('test')}
            >
              Test
            </VscodeButton>
            <VscodeButton onClick={() => handleClickSaveOrTest('save')}>
              Save
            </VscodeButton>
          </div>
        </div>
      </main>
    )
  )
}

export default ConnectionSetting
