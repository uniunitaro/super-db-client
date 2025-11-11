import { readFile } from 'node:fs/promises'
import {
  type AddressInfo,
  type Server as NetServer,
  createServer,
} from 'node:net'
import { Client, type ClientChannel, type ConnectConfig } from 'ssh2'
import type { SSHPasswordConfig, SSHPrivateKeyConfig } from '../types/dbConfig'

type SSHEnabledConfig = SSHPasswordConfig | SSHPrivateKeyConfig

type TunnelOptions = {
  sshConfig: SSHEnabledConfig
  dstHost: string
  dstPort: number
}

export type SSHTunnelHandle = {
  localPort: number
  dispose: () => Promise<void>
}

type ManagedTunnelHandle = SSHTunnelHandle & {
  signature: string
}

const LOCAL_HOST = '127.0.0.1'

const connectSSHClient = (config: ConnectConfig): Promise<Client> => {
  return new Promise((resolve, reject) => {
    const client = new Client()

    const handleReady = () => {
      client.off('error', handleError)
      resolve(client)
    }

    const handleError = (error: Error) => {
      client.off('ready', handleReady)
      reject(error)
    }

    client.once('ready', handleReady)
    client.once('error', handleError)
    client.connect(config)
  })
}

const listenLocalServer = (server: NetServer): Promise<number> => {
  return new Promise((resolve, reject) => {
    const handleError = (error: Error) => {
      server.off('listening', handleListening)
      reject(error)
    }
    const handleListening = () => {
      server.off('error', handleError)
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to bind SSH tunnel server'))
        return
      }
      resolve((address as AddressInfo).port)
    }

    server.once('error', handleError)
    server.once('listening', handleListening)
    server.listen(0, LOCAL_HOST)
  })
}

const closeServer = (server: NetServer): Promise<void> => {
  return new Promise((resolve) => {
    if (!server.listening) {
      resolve()
      return
    }
    server.close(() => resolve())
  })
}

const readPrivateKey = async (filePath: string): Promise<string> => {
  return readFile(filePath, 'utf8')
}

const createTunnel = async ({
  sshConfig,
  dstHost,
  dstPort,
}: TunnelOptions): Promise<SSHTunnelHandle> => {
  const connectConfig: ConnectConfig = {
    host: sshConfig.host,
    port: sshConfig.port,
    username: sshConfig.username,
    readyTimeout: 20_000,
    keepaliveInterval: 10_000,
    keepaliveCountMax: 3,
  }

  if (sshConfig.authMethod === 'password') {
    connectConfig.password = sshConfig.password
  } else {
    connectConfig.privateKey = await readPrivateKey(sshConfig.privateKeyPath)
    if (sshConfig.passphrase) {
      connectConfig.passphrase = sshConfig.passphrase
    }
  }

  const sshClient = await connectSSHClient(connectConfig)
  let isClientClosed = false

  const server = createServer((socket) => {
    sshClient.forwardOut(
      LOCAL_HOST,
      socket.remotePort ?? 0,
      dstHost,
      dstPort,
      (error: Error | undefined, stream: ClientChannel) => {
        if (error) {
          socket.destroy(error)
          return
        }

        stream.on('error', () => {
          socket.destroy()
        })
        socket.on('error', () => {
          stream.destroy()
        })

        socket.pipe(stream)
        stream.pipe(socket)
      },
    )
  })

  const localPort = await listenLocalServer(server)

  const waitForClientClose = (): Promise<void> => {
    if (isClientClosed) return Promise.resolve()
    return new Promise((resolve) => {
      sshClient.once('close', () => resolve())
    })
  }

  const dispose = async () => {
    const waitClientClose = waitForClientClose()
    if (!isClientClosed) {
      sshClient.end()
    }

    await Promise.all([closeServer(server), waitClientClose])
  }

  sshClient.on('close', () => {
    isClientClosed = true
    server.close()
  })

  return {
    localPort,
    dispose,
  }
}

const normalizeSignature = ({ sshConfig, dstHost, dstPort }: TunnelOptions) => {
  return JSON.stringify({
    authMethod: sshConfig.authMethod,
    host: sshConfig.host,
    port: sshConfig.port,
    username: sshConfig.username,
    password:
      sshConfig.authMethod === 'password' ? sshConfig.password : undefined,
    privateKeyPath:
      sshConfig.authMethod === 'privateKey'
        ? sshConfig.privateKeyPath
        : undefined,
    passphrase:
      sshConfig.authMethod === 'privateKey' ? sshConfig.passphrase : undefined,
    dstHost,
    dstPort,
  })
}

class SSHTunnelManager {
  private tunnels = new Map<string, ManagedTunnelHandle>()

  async ensure(
    key: string,
    options: TunnelOptions,
  ): Promise<ManagedTunnelHandle> {
    const signature = normalizeSignature(options)
    const existing = this.tunnels.get(key)

    if (existing && existing.signature === signature) {
      return existing
    }

    if (existing) {
      await existing.dispose()
      this.tunnels.delete(key)
    }

    const tunnel = await createTunnel(options)
    const managed: ManagedTunnelHandle = { ...tunnel, signature }
    this.tunnels.set(key, managed)
    return managed
  }

  async create(options: TunnelOptions): Promise<SSHTunnelHandle> {
    return createTunnel(options)
  }

  async dispose(key: string): Promise<void> {
    const existing = this.tunnels.get(key)
    if (!existing) return
    await existing.dispose()
    this.tunnels.delete(key)
  }
}

export const sshTunnelManager = new SSHTunnelManager()
