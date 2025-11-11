import type { ResultAsync } from 'neverthrow'
import type { ExtensionContext } from 'vscode'
import { updateCurrentConnectionStatus } from '../../../ui/statusBars/currentConnectionStatus'
import type { DatabaseError } from '../../core/errors'
import { connect } from '../services/connection'
import { setCurrentConnection } from '../services/dbConfig'
import type { KyselyDB } from '../types/connection'

export const connectDB = (
  context: ExtensionContext,
  dbUUID: string,
): ResultAsync<KyselyDB, DatabaseError> => {
  return connect(context, dbUUID).map((db) => {
    setCurrentConnection(context, dbUUID)
    updateCurrentConnectionStatus(context)
    return db
  })
}
