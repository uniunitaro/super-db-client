import { assertNever } from '@/utilities/assertNever'
import type { GetTableDataRequestResponse } from '@shared-types/message'
import type { Operation, TableRow } from '@shared-types/sharedTypes'
import type { SelectedCell, TableRowWithType } from './selection'

type PrimaryKeyValue = { key: string; value: string }

export type ClientOperation =
  | {
      type: 'edit'
      primaryKeyValues: PrimaryKeyValue[]
      columnName: string
      newValue: string | null
    }
  | {
      type: 'duplicate'
      uuid: string
      values: Record<string, string | null>
    }
  | {
      type: 'editInserted'
      insertedRowUUID: string
      columnName: string
      newValue: string | null
    }
  | {
      type: 'delete'
      primaryKeyValues: PrimaryKeyValue[]
    }
  | {
      type: 'deleteInserted'
      insertedRowUUID: string
    }
  | {
      type: 'insert'
      uuid: string
    }

export type Cell =
  | {
      type: 'existing'
      rowIndex: number
      columnId: string
    }
  | {
      type: 'inserted'
      rowIndex: number
      rowUUID: string
      columnId: string
    }

const toPrimaryKeyValues = ({
  primaryKeys,
  row,
}: {
  primaryKeys: string[]
  row: Record<string, unknown>
}) =>
  primaryKeys.map((key) => ({
    key,
    value: String(row[key]),
  }))

export const getUpdatedRowsByOperations = ({
  tableDataRows,
  operations,
}: {
  tableDataRows: GetTableDataRequestResponse['rows'] | undefined
  operations: ClientOperation[]
}): TableRowWithType[] => {
  const newRows: TableRowWithType[] = tableDataRows
    ? structuredClone(tableDataRows).map((row) => ({
        type: 'existing',
        row,
      }))
    : []

  for (const operation of operations) {
    if (operation.type === 'insert') {
      newRows.push({ type: 'inserted', uuid: operation.uuid, row: {} })
      continue
    }

    if (operation.type === 'duplicate') {
      newRows.push({
        type: 'inserted',
        uuid: operation.uuid,
        row: structuredClone(operation.values),
      })
      continue
    }

    if (operation.type === 'edit') {
      const targetRow = newRows.find(
        (row) =>
          row.type === 'existing' &&
          operation.primaryKeyValues.every(
            (primaryKey) =>
              String(row.row[primaryKey.key]) === primaryKey.value,
          ),
      )

      if (targetRow) {
        targetRow.row[operation.columnName] = operation.newValue
      }

      continue
    }

    if (operation.type === 'editInserted') {
      const targetRow = newRows.find(
        (row) =>
          row.type === 'inserted' && operation.insertedRowUUID === row.uuid,
      )

      if (targetRow) {
        targetRow.row[operation.columnName] = operation.newValue
      }

      continue
    }

    if (operation.type === 'deleteInserted') {
      const targetRowIndex = newRows.findIndex(
        (row) =>
          row.type === 'inserted' && operation.insertedRowUUID === row.uuid,
      )

      if (targetRowIndex !== -1) {
        newRows.splice(targetRowIndex, 1)
      }
    }
  }

  return newRows
}

export const createEditOperation = ({
  tableData,
  selectedCell,
  newValue,
}: {
  tableData: GetTableDataRequestResponse
  selectedCell: SelectedCell
  newValue: string | null
}): ClientOperation | undefined => {
  const targetColumn = tableData.tableMetadata.columns.find(
    (column) => column.name === selectedCell.columnId,
  )

  const adjustedNewValue =
    newValue === '' && !targetColumn?.isTextType ? null : newValue

  if (selectedCell.type === 'existing') {
    const targetRow = tableData.rows[selectedCell.rowIndex]

    if (!targetRow) {
      return undefined
    }

    return {
      type: 'edit',
      primaryKeyValues: toPrimaryKeyValues({
        primaryKeys: tableData.tableMetadata.primaryKeyColumns,
        row: targetRow,
      }),
      columnName: selectedCell.columnId,
      newValue: adjustedNewValue,
    }
  }

  if (selectedCell.type === 'inserted') {
    return {
      type: 'editInserted',
      insertedRowUUID: selectedCell.rowUUID,
      columnName: selectedCell.columnId,
      newValue: adjustedNewValue,
    }
  }

  return assertNever(selectedCell)
}

export const createDeleteOperations = ({
  tableData,
  selectedRowIndexes,
  updatedRows,
}: {
  tableData: GetTableDataRequestResponse
  selectedRowIndexes: number[]
  updatedRows: TableRowWithType[]
}): ClientOperation[] =>
  selectedRowIndexes.reduce<ClientOperation[]>((acc, rowIndex) => {
    const selectedRow = updatedRows[rowIndex]

    if (!selectedRow) {
      return acc
    }

    if (selectedRow.type === 'existing') {
      acc.push({
        type: 'delete',
        primaryKeyValues: toPrimaryKeyValues({
          primaryKeys: tableData.tableMetadata.primaryKeyColumns,
          row: selectedRow.row,
        }),
      })

      return acc
    }

    if (selectedRow.type === 'inserted') {
      acc.push({
        type: 'deleteInserted',
        insertedRowUUID: selectedRow.uuid,
      })

      return acc
    }

    return acc
  }, [])

export const createDuplicateOperations = ({
  tableData,
  selectedRowIndexes,
  updatedRows,
}: {
  tableData: GetTableDataRequestResponse
  selectedRowIndexes: number[]
  updatedRows: TableRowWithType[]
}): ClientOperation[] => {
  const primaryKeyColumns = new Set(tableData.tableMetadata.primaryKeyColumns)
  const columnsToCopy = tableData.tableMetadata.columns.filter(
    (column) => !primaryKeyColumns.has(column.name),
  )

  const sortedRowIndexes = [...selectedRowIndexes].sort((a, b) => a - b)

  return sortedRowIndexes.flatMap((rowIndex) => {
    const rowToDuplicate = updatedRows[rowIndex]

    if (!rowToDuplicate) {
      return []
    }

    const uuid = crypto.randomUUID()

    const values = columnsToCopy.reduce<Record<string, string | null>>(
      (acc, column) => {
        const value = rowToDuplicate.row[column.name]

        if (value === undefined) {
          return acc
        }

        acc[column.name] =
          value === null
            ? null
            : typeof value === 'string'
              ? value
              : String(value)

        return acc
      },
      {},
    )

    return [
      {
        type: 'duplicate',
        uuid,
        values,
      },
    ]
  })
}

export const getEditedCellsByOperations = ({
  operations,
  tableDataRows,
  updatedRows,
}: {
  operations: ClientOperation[]
  tableDataRows: GetTableDataRequestResponse['rows'] | undefined
  updatedRows: TableRowWithType[]
}): Cell[] => {
  if (!tableDataRows) {
    return []
  }

  return operations
    .filter(
      (operation) =>
        operation.type === 'edit' || operation.type === 'editInserted',
    )
    .flatMap((operation) => {
      if (operation.type === 'edit') {
        const targetRowIndex = tableDataRows.findIndex((row) =>
          operation.primaryKeyValues.every(
            (primaryKey) => String(row[primaryKey.key]) === primaryKey.value,
          ),
        )

        if (targetRowIndex === -1) {
          return []
        }

        return {
          type: 'existing',
          rowIndex: targetRowIndex,
          columnId: operation.columnName,
        }
      }

      if (operation.type === 'editInserted') {
        const targetRowIndex = updatedRows.findIndex(
          (row) =>
            row.type === 'inserted' && operation.insertedRowUUID === row.uuid,
        )

        if (targetRowIndex === -1) {
          return []
        }

        return {
          type: 'inserted',
          rowIndex: targetRowIndex,
          columnId: operation.columnName,
          rowUUID: operation.insertedRowUUID,
        }
      }

      return assertNever(operation)
    })
}

export const getDeletedRowIndexesByOperations = ({
  operations,
  tableDataRows,
}: {
  operations: ClientOperation[]
  tableDataRows: GetTableDataRequestResponse['rows'] | undefined
}): number[] => {
  if (!tableDataRows) {
    return []
  }

  return operations
    .filter((operation) => operation.type === 'delete')
    .map((operation) => {
      const targetRowIndex = tableDataRows.findIndex((row) =>
        operation.primaryKeyValues.every(
          (primaryKey) => String(row[primaryKey.key]) === primaryKey.value,
        ),
      )

      return targetRowIndex
    })
}

export const toOperations = (operations: ClientOperation[]): Operation[] => {
  const insertOperations = getInsertOperations(operations)

  const operationsWithoutInserts = operations.filter(
    (operation) =>
      operation.type !== 'insert' &&
      operation.type !== 'duplicate' &&
      operation.type !== 'editInserted' &&
      operation.type !== 'deleteInserted',
  )

  const reducedOperations = reduceOperations(operationsWithoutInserts)

  return [...reducedOperations, ...insertOperations]
}

const reduceOperations = <T extends ClientOperation>(operations: T[]): T[] =>
  operations.reduce<T[]>((acc, operation) => {
    if (operation.type === 'edit') {
      const deduplicated = acc.filter(
        (op) =>
          !(
            op.type === 'edit' &&
            op.primaryKeyValues.every((primaryKeyValue) =>
              operation.primaryKeyValues.some(
                (newPrimaryKeyValue) =>
                  newPrimaryKeyValue.key === primaryKeyValue.key &&
                  newPrimaryKeyValue.value === primaryKeyValue.value,
              ),
            ) &&
            op.columnName === operation.columnName
          ),
      )
      return [...deduplicated, operation]
    }

    acc.push(operation)
    return acc
  }, [])

const getInsertOperations = (
  operations: ClientOperation[],
): Extract<Operation, { type: 'insert' }>[] => {
  type TemporaryInsertedRow =
    | (Extract<ClientOperation, { type: 'insert' }> & {
        row: TableRow
      })
    | (Extract<ClientOperation, { type: 'duplicate' }> & {
        row: TableRow
      })

  const insertedRows = operations.reduce<TemporaryInsertedRow[]>(
    (acc, operation) => {
      if (operation.type === 'insert') {
        acc.push({ ...operation, row: {} })
        return acc
      }

      if (operation.type === 'duplicate') {
        acc.push({ ...operation, row: structuredClone(operation.values) })
        return acc
      }

      if (operation.type === 'editInserted') {
        return acc.map((insertedRow) =>
          insertedRow.uuid === operation.insertedRowUUID
            ? {
                ...insertedRow,
                row: {
                  ...insertedRow.row,
                  [operation.columnName]: operation.newValue,
                },
              }
            : insertedRow,
        )
      }

      if (operation.type === 'deleteInserted') {
        return acc.filter(
          (insertedRow) => insertedRow.uuid !== operation.insertedRowUUID,
        )
      }

      return acc
    },
    [],
  )

  return insertedRows.map(({ row }) => ({ type: 'insert', row }))
}
