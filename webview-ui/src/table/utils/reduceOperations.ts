import type { Operation } from '../types/operation'

export const reduceOperations = (operations: Operation[]): Operation[] =>
  operations.reduce((acc, operation) => {
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
  }, [] as Operation[])
