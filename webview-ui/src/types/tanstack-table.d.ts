import type { ColumnMetadata } from '@shared-types/sharedTypes'
import '@tanstack/react-table' //or vue, svelte, solid, qwik, etc.

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    columnMetadata: ColumnMetadata
  }
}
