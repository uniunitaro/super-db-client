import type { GetTableDataRequestResponse } from '@shared-types/message'
import type { ColumnMetadata } from '@shared-types/sharedTypes'
import type { MessageParticipant, RequestType } from 'vscode-messenger-common'

type GetTableDataParams = {
  order?: 'asc' | 'desc'
  orderBy?: string
  limit: number
  offset: number
}

type PerfConfig = {
  totalRows: number
  columns: number
  defaultLimit: number
  textLength: number
}

const parseNumber = (value: string | null, fallback: number): number => {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return parsed
}

const getPerfConfig = (): PerfConfig => {
  const query = new URLSearchParams(window.location.search)

  return {
    totalRows: Math.max(1, parseNumber(query.get('rows'), 100_000)),
    columns: Math.max(1, parseNumber(query.get('columns'), 20)),
    defaultLimit: Math.max(1, parseNumber(query.get('limit'), 5_000)),
    textLength: Math.max(4, parseNumber(query.get('textLength'), 24)),
  }
}

const createColumns = (count: number): ColumnMetadata[] => {
  const columns: ColumnMetadata[] = [
    {
      name: 'id',
      dataType: 'bigint',
      default: null,
      isNullable: false,
      isBinaryType: false,
      isTextType: false,
      comment: '',
      extra: '',
    },
  ]

  for (let index = 0; index < count - 1; index++) {
    columns.push({
      name: `col_${index + 1}`,
      dataType: 'varchar',
      default: null,
      isNullable: true,
      isBinaryType: false,
      isTextType: true,
      comment: '',
      extra: '',
    })
  }

  return columns
}

const pad = (value: number, size: number): string =>
  value.toString().padStart(size, '0')

const resolveRowNumber = ({
  index,
  totalRows,
  order,
}: {
  index: number
  totalRows: number
  order?: 'asc' | 'desc'
}): number => {
  if (order === 'desc') {
    return totalRows - index
  }

  return index + 1
}

const toCellText = ({
  rowNumber,
  columnName,
  textLength,
}: {
  rowNumber: number
  columnName: string
  textLength: number
}): string => {
  const baseText = `${columnName}_${pad(rowNumber, 7)}`

  if (baseText.length >= textLength) {
    return baseText.slice(0, textLength)
  }

  return `${baseText}${'x'.repeat(textLength - baseText.length)}`
}

export class PerfMockMessenger {
  private readonly config = getPerfConfig()

  private readonly columns = createColumns(this.config.columns)

  public start(): void {
    // No-op: perf mode runs without extension host.
  }

  public onRequest<P, R>(
    _type: RequestType<P, R>,
    _handler: (params: P) => R | Promise<R>,
  ): this {
    // Commands are sent by the extension host. There is no host in perf mode.
    return this
  }

  public async sendRequest<P, R>(
    type: RequestType<P, R>,
    _receiver: MessageParticipant,
    params?: P,
  ): Promise<R> {
    switch (type.method) {
      case 'getTableData':
        return this.createTableDataResponse(
          params as GetTableDataParams | undefined,
        ) as R
      case 'getConfig':
        return this.createConfigResponse() as R
      case 'getTableInitialData':
        return this.createInitialDataResponse() as R
      case 'saveTableChanges':
        return this.createSaveTableChangesResponse() as R
      default:
        throw new Error(`Unsupported request in perf mode: ${type.method}`)
    }
  }

  private createTableDataResponse(
    params: GetTableDataParams | undefined,
  ): GetTableDataRequestResponse {
    const limit = params?.limit ?? this.config.defaultLimit
    const offset = params?.offset ?? 0
    const order = params?.order

    const rows = Array.from({ length: Math.max(0, limit) }, (_, localIndex) => {
      const absoluteIndex = offset + localIndex
      const rowNumber = resolveRowNumber({
        index: absoluteIndex,
        totalRows: this.config.totalRows,
        order,
      })

      if (rowNumber < 1 || rowNumber > this.config.totalRows) {
        return null
      }

      const row: Record<string, unknown> = { id: rowNumber }

      for (
        let columnIndex = 1;
        columnIndex < this.columns.length;
        columnIndex++
      ) {
        const columnName = this.columns[columnIndex]?.name
        if (!columnName) {
          continue
        }

        row[columnName] = toCellText({
          rowNumber,
          columnName,
          textLength: this.config.textLength,
        })
      }

      return row
    }).filter((row): row is Record<string, unknown> => row !== null)

    return {
      rows,
      tableMetadata: {
        columns: this.columns,
        columnKeys: [],
        name: 'perf_table',
        primaryKeyColumns: ['id'],
        totalRows: this.config.totalRows,
      },
    }
  }

  private createConfigResponse(): { fontSize: number } {
    return {
      fontSize: 14,
    }
  }

  private createInitialDataResponse(): { shouldRefresh: boolean } {
    return {
      shouldRefresh: false,
    }
  }

  private createSaveTableChangesResponse(): undefined {
    return undefined
  }
}
