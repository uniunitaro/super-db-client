import type { Operation, TableRow } from '@shared-types/sharedTypes'
import type { ClientOperation } from '../types/operation'

export const convertClientOperationToOperation = (
  operations: ClientOperation[],
): Operation[] => {
  const insertOperations = getInsertOperations(operations)

  const operationsWithoutInserts = operations.filter(
    (operation) =>
      operation.type !== 'insert' &&
      operation.type !== 'editInserted' &&
      operation.type !== 'deleteInserted',
  )

  const reducedOperations = reduceOperations(operationsWithoutInserts)

  return [...reducedOperations, ...insertOperations]
}

const reduceOperations = <T extends ClientOperation>(operations: T[]): T[] =>
  operations.reduce<T[]>((acc, operation) => {
    if (operation.type === 'edit') {
      const existingOperationIndex = acc.findIndex(
        (op) =>
          op.type === 'edit' &&
          op.primaryKeyValues.every((primaryKeyValue) =>
            operation.primaryKeyValues.some(
              (newPrimaryKeyValue) =>
                newPrimaryKeyValue.key === primaryKeyValue.key &&
                newPrimaryKeyValue.value === primaryKeyValue.value,
            ),
          ) &&
          op.columnName === operation.columnName,
      )

      if (existingOperationIndex !== -1) {
        acc.splice(existingOperationIndex, 1)
      }
    }

    acc.push(operation)
    return acc
  }, [])

const getInsertOperations = (
  operations: ClientOperation[],
): Extract<Operation, { type: 'insert' }>[] => {
  const insertedRows: (Extract<ClientOperation, { type: 'insert' }> & {
    row: TableRow
  })[] = operations
    .filter((operation) => operation.type === 'insert')
    .map((operation) => ({
      ...operation,
      row: {},
    }))

  for (const operation of operations) {
    if (operation.type === 'editInserted') {
      const insertedRow = insertedRows.find(
        (insertedRow) => insertedRow.uuid === operation.insertedRowUUID,
      )

      if (insertedRow) {
        insertedRow.row[operation.columnName] = operation.newValue
      }
    }
    if (operation.type === 'deleteInserted') {
      const insertedRowIndex = insertedRows.findIndex(
        (insertedRow) => insertedRow.uuid === operation.insertedRowUUID,
      )

      if (insertedRowIndex !== -1) {
        insertedRows.splice(insertedRowIndex, 1)
      }
    }
  }

  return insertedRows
}
