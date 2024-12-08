import type { ExtensionContext } from 'vscode'
import { updateCurrentConnectionStatus } from '../../../ui/statusBars/currentConnectionStatus'
import { DB } from '../services/connection'
import { setCurrentConnection } from '../services/dbConfig'

export const connectDB = (context: ExtensionContext, dbUUID: string) => {
  DB.connect(context, dbUUID)
  setCurrentConnection(context, dbUUID)
  updateCurrentConnectionStatus(context)
}
