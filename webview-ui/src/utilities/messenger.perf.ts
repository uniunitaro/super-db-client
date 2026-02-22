import type { Messenger } from 'vscode-messenger-webview'
import { PerfMockMessenger } from './perfMockMessenger'

// Perf mode only depends on sendRequest/start/onRequest, so a thin cast keeps
// production-side types untouched while replacing transport at bundle time.
export const messenger = new PerfMockMessenger() as unknown as Messenger
