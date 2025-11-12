import { type Result, err, ok } from 'neverthrow'
import {
  type InferOutput,
  array,
  fallback,
  literal,
  number,
  object,
  optional,
  safeParse,
  string,
  union,
} from 'valibot'
import { ValidationError } from '../../core/errors'

export const writeModeSchema = fallback(
  optional(
    union([literal('allow'), literal('warn'), literal('disable')]),
    'allow',
  ),
  'allow',
)

export const sshPasswordSchema = object({
  enabled: literal(true),
  host: string(),
  port: number(),
  username: string(),
  authMethod: literal('password'),
  password: string(),
})

export const sshPrivateKeySchema = object({
  enabled: literal(true),
  host: string(),
  port: number(),
  username: string(),
  authMethod: literal('privateKey'),
  privateKeyPath: string(),
  passphrase: optional(string()),
})

export const sshDisabledSchema = object({
  enabled: literal(false),
  host: optional(string()),
  port: optional(number()),
  username: optional(string()),
  authMethod: optional(union([literal('password'), literal('privateKey')])),
  password: optional(string()),
  privateKeyPath: optional(string()),
  passphrase: optional(string()),
})

export const sshSchema = optional(
  union([sshPasswordSchema, sshPrivateKeySchema, sshDisabledSchema]),
)

const baseConfigFields = {
  uuid: string(),
  connectionName: string(),
  ssh: sshSchema,
  writeMode: writeModeSchema,
}

export const mysqlDBConfigSchema = object({
  ...baseConfigFields,
  type: literal('mysql'),
  host: string(),
  port: number(),
  user: string(),
  password: string(),
  database: string(),
})

export const sqliteDBConfigSchema = object({
  ...baseConfigFields,
  type: literal('sqlite'),
  filePath: string(),
})

export const persistedDBConfigSchema = union([
  mysqlDBConfigSchema,
  sqliteDBConfigSchema,
])

export const persistedDBConfigsSchema = array(persistedDBConfigSchema)

export type PersistedDBConfig = InferOutput<typeof persistedDBConfigSchema>

export const parsePersistedDBConfigs = (
  value: unknown,
): Result<PersistedDBConfig[], ValidationError> => {
  const result = safeParse(persistedDBConfigsSchema, value)
  if (result.success) {
    return ok(result.output)
  }

  return err(
    new ValidationError(
      `Failed to parse DB configurations from storage: ${formatIssues(result.issues)}`,
    ),
  )
}

export const normalizeDBConfig = (
  value: unknown,
): Result<PersistedDBConfig, ValidationError> => {
  const result = safeParse(persistedDBConfigSchema, value)
  if (result.success) {
    return ok(result.output)
  }

  return err(
    new ValidationError(
      `Invalid DB configuration: ${formatIssues(result.issues)}`,
    ),
  )
}

const formatIssues = (issues: Array<{ message?: string }>): string =>
  issues.map((issue) => issue.message ?? 'Unknown validation error').join(', ')
