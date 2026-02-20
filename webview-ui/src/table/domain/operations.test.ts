import type { GetTableDataRequestResponse } from '@shared-types/message'
import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { describe, expect, test } from 'vitest'
import {
  type ClientOperation,
  createDeleteOperations,
  createEditOperation,
  getEditedCellsByOperations,
  getUpdatedRowsByOperations,
  toOperations,
} from './operations'

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
  {
    name: 'name',
    dataType: 'varchar',
    default: null,
    isNullable: true,
    isBinaryType: false,
    isTextType: true,
    comment: '',
    extra: '',
  },
]

const tableData: GetTableDataRequestResponse = {
  rows: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  tableMetadata: {
    columns,
    columnKeys: [],
    name: 'users',
    primaryKeyColumns: ['id'],
    totalRows: 2,
  },
}

describe('table domain: operations', () => {
  test('編集操作を生成できる', () => {
    expect(
      createEditOperation({
        tableData,
        selectedCell: {
          type: 'existing',
          rowIndex: 0,
          columnId: 'id',
          columnIndex: 0,
        },
        newValue: '',
      }),
    ).toEqual({
      type: 'edit',
      primaryKeyValues: [{ key: 'id', value: '1' }],
      columnName: 'id',
      newValue: null,
    })

    expect(
      createEditOperation({
        tableData,
        selectedCell: {
          type: 'inserted',
          rowIndex: 2,
          rowUUID: 'row-1',
          columnId: 'name',
          columnIndex: 1,
        },
        newValue: 'new',
      }),
    ).toEqual({
      type: 'editInserted',
      insertedRowUUID: 'row-1',
      columnName: 'name',
      newValue: 'new',
    })
  })

  test('操作から更新後行と編集セルを導出できる', () => {
    const operations: ClientOperation[] = [
      {
        type: 'insert',
        uuid: 'row-1',
      },
      {
        type: 'editInserted',
        insertedRowUUID: 'row-1',
        columnName: 'name',
        newValue: 'Charlie',
      },
      {
        type: 'edit',
        primaryKeyValues: [{ key: 'id', value: '2' }],
        columnName: 'name',
        newValue: 'Bobby',
      },
    ]

    const updatedRows = getUpdatedRowsByOperations({
      tableDataRows: tableData.rows,
      operations,
    })

    expect(updatedRows).toEqual([
      { type: 'existing', row: { id: 1, name: 'Alice' } },
      { type: 'existing', row: { id: 2, name: 'Bobby' } },
      { type: 'inserted', uuid: 'row-1', row: { name: 'Charlie' } },
    ])

    expect(
      getEditedCellsByOperations({
        operations,
        tableDataRows: tableData.rows,
        updatedRows,
      }),
    ).toEqual([
      {
        type: 'inserted',
        rowIndex: 2,
        rowUUID: 'row-1',
        columnId: 'name',
      },
      {
        type: 'existing',
        rowIndex: 1,
        columnId: 'name',
      },
    ])
  })

  test('削除操作を生成できる', () => {
    const updatedRows = [
      { type: 'existing', row: { id: 1, name: 'Alice' } },
      { type: 'inserted', uuid: 'row-1', row: { name: 'Charlie' } },
    ] as const

    expect(
      createDeleteOperations({
        tableData,
        selectedRowIndexes: [0, 1],
        updatedRows: [...updatedRows],
      }),
    ).toEqual([
      {
        type: 'delete',
        primaryKeyValues: [{ key: 'id', value: '1' }],
      },
      {
        type: 'deleteInserted',
        insertedRowUUID: 'row-1',
      },
    ])
  })

  test('保存用のOperationへ正規化できる', () => {
    const operations: ClientOperation[] = [
      {
        type: 'edit',
        primaryKeyValues: [{ key: 'id', value: '1' }],
        columnName: 'name',
        newValue: 'Alice A',
      },
      {
        type: 'edit',
        primaryKeyValues: [{ key: 'id', value: '1' }],
        columnName: 'name',
        newValue: 'Alice B',
      },
      {
        type: 'insert',
        uuid: 'row-1',
      },
      {
        type: 'editInserted',
        insertedRowUUID: 'row-1',
        columnName: 'name',
        newValue: 'Charlie',
      },
      {
        type: 'deleteInserted',
        insertedRowUUID: 'row-1',
      },
    ]

    expect(toOperations(operations)).toEqual([
      {
        type: 'edit',
        primaryKeyValues: [{ key: 'id', value: '1' }],
        columnName: 'name',
        newValue: 'Alice B',
      },
    ])
  })
})
