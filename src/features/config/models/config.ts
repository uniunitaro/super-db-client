import { workspace } from 'vscode'
import type { Config } from '../types/config'

export const getConfig = (): Config => {
  const config = workspace.getConfiguration()
  return {
    fontSize: config.get('fontSize'),
  }
}
