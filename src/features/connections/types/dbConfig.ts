import type { InferInput, InferOutput } from 'valibot'
import type { StrictOmit } from '../../../utilities/typeUtils'
import type * as Schema from '../services/dbConfigSchema'

type SSHSchemaOutput = InferOutput<typeof Schema.sshSchema>
export type SSHPasswordConfig = InferOutput<typeof Schema.sshPasswordSchema>
export type SSHPrivateKeyConfig = InferOutput<typeof Schema.sshPrivateKeySchema>
export type SSHConfig = Exclude<SSHSchemaOutput, undefined>
export type SSHAuthMethod = Extract<SSHConfig, { enabled: true }>['authMethod']

export type DBConfig = InferOutput<typeof Schema.persistedDBConfigSchema>
export type DBType = DBConfig['type']

type DBConfigSchemaInput = InferInput<typeof Schema.persistedDBConfigSchema>
export type DBConfigInput = StrictOmit<DBConfigSchemaInput, 'uuid'> & {
  targetUUID?: string
}
