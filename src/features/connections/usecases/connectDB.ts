import type { ResultAsync } from 'neverthrow'
import type { ExtensionContext } from 'vscode'
import { updateCurrentConnectionStatus } from '../../../ui/statusBars/currentConnectionStatus'
import {
  type DatabaseError,
  type StoreError,
  type ValidationError,
  toDatabaseError,
} from '../../core/errors'
import { connect } from '../services/connection'
import { setCurrentConnection } from '../services/dbConfig'
import type { KyselyDB } from '../types/connection'

export const connectDB = (
  context: ExtensionContext,
  dbUUID: string,
): ResultAsync<KyselyDB, DatabaseError | ValidationError | StoreError> => {
  return connect(context, dbUUID).andThen((db) =>
    setCurrentConnection(context, dbUUID)
      .mapErr(toDatabaseError)
      .map(() => {
        void updateCurrentConnectionStatus(context)
        return db
      }),
  )
}
