import type { ColumnMetadata } from '@shared-types/sharedTypes'
import {
  VSCodeButton,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeTextField,
} from '@vscode/webview-ui-toolkit/react'
import type { ChangeEvent, FC, KeyboardEvent } from 'react'
import { css } from 'styled-system/css'
import {
  type EditableFilterCondition,
  FILTER_OPERATOR_OPTIONS,
  createEmptyEditableFilterCondition,
  isBetweenOperator,
  isNoValueOperator,
} from '../model/filter'

type Props = {
  columns: ColumnMetadata[]
  filters: EditableFilterCondition[]
  onFiltersChange: (filters: EditableFilterCondition[]) => void
  onApply: (nextFilters?: EditableFilterCondition[]) => void
}

const TableFilterBar: FC<Props> = ({
  columns,
  filters,
  onFiltersChange,
  onApply,
}) => {
  const updateFilters = (
    nextFilters: EditableFilterCondition[],
    shouldApply = false,
  ) => {
    onFiltersChange(nextFilters)

    if (shouldApply) {
      onApply(nextFilters)
    }
  }

  const handleFilterChange = (
    targetId: string,
    key: 'column' | 'operator' | 'value' | 'valueTo',
    value: string,
  ) => {
    const nextFilters = filters.map((filter) =>
      filter.id === targetId ? { ...filter, [key]: value } : filter,
    )

    updateFilters(nextFilters, key === 'column' || key === 'operator')
  }

  const handleRemoveFilter = (targetId: string) => {
    const removedFilters = filters.filter((filter) => filter.id !== targetId)
    const nextFilters =
      removedFilters.length > 0
        ? removedFilters
        : [createEmptyEditableFilterCondition()]

    updateFilters(nextFilters, true)
  }

  const handleAddFilter = () => {
    onFiltersChange([...filters, createEmptyEditableFilterCondition()])
  }

  const handleInputEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    onApply()
  }

  return (
    <section
      className={css({
        p: '2',
        pos: 'relative',
        zIndex: 'tableFilterBar',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'var(--vscode-editorGroup-border)',
        display: 'grid',
        gap: '2',
      })}
    >
      {filters.map((filter) => (
        <div
          key={filter.id}
          className={css({
            display: 'grid',
            gap: '2',
            gridTemplateColumns:
              'minmax(140px, 1fr) minmax(120px, 1fr) minmax(220px, 2fr) auto',
            alignItems: 'center',
          })}
        >
          <VSCodeDropdown
            value={filter.column}
            onChange={(event) =>
              handleFilterChange(
                filter.id,
                'column',
                (event as ChangeEvent<HTMLSelectElement>).target.value,
              )
            }
          >
            <VSCodeOption value="">Select column</VSCodeOption>
            {columns.map((column) => (
              <VSCodeOption key={column.name} value={column.name}>
                {column.name}
              </VSCodeOption>
            ))}
          </VSCodeDropdown>

          <VSCodeDropdown
            value={filter.operator}
            onChange={(event) =>
              handleFilterChange(
                filter.id,
                'operator',
                (event as ChangeEvent<HTMLSelectElement>).target
                  .value as EditableFilterCondition['operator'],
              )
            }
          >
            {FILTER_OPERATOR_OPTIONS.map((operator) => (
              <VSCodeOption key={operator} value={operator}>
                {operator}
              </VSCodeOption>
            ))}
          </VSCodeDropdown>

          {isNoValueOperator(filter.operator) ? (
            <div
              className={css({
                color: 'var(--vscode-descriptionForeground)',
                px: '2',
              })}
            >
              No value required
            </div>
          ) : isBetweenOperator(filter.operator) ? (
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2',
              })}
            >
              <VSCodeTextField
                value={filter.value}
                onInput={(event) =>
                  handleFilterChange(
                    filter.id,
                    'value',
                    (event as ChangeEvent<HTMLInputElement>).target.value,
                  )
                }
                onKeyDown={handleInputEnter}
                placeholder="Start value"
              />
              <VSCodeTextField
                value={filter.valueTo}
                onInput={(event) =>
                  handleFilterChange(
                    filter.id,
                    'valueTo',
                    (event as ChangeEvent<HTMLInputElement>).target.value,
                  )
                }
                onKeyDown={handleInputEnter}
                placeholder="End value"
              />
            </div>
          ) : (
            <VSCodeTextField
              value={filter.value}
              onInput={(event) =>
                handleFilterChange(
                  filter.id,
                  'value',
                  (event as ChangeEvent<HTMLInputElement>).target.value,
                )
              }
              onKeyDown={handleInputEnter}
              placeholder={filter.operator === 'IN' ? 'a,b,c' : 'Value'}
            />
          )}

          <VSCodeButton
            appearance="secondary"
            onClick={() => handleRemoveFilter(filter.id)}
          >
            Remove
          </VSCodeButton>
        </div>
      ))}

      <div
        className={css({
          display: 'flex',
          gap: '2',
          justifyContent: 'flex-end',
        })}
      >
        <VSCodeButton appearance="secondary" onClick={handleAddFilter}>
          Add condition
        </VSCodeButton>
        <VSCodeButton onClick={() => onApply()}>Apply</VSCodeButton>
      </div>
    </section>
  )
}

export default TableFilterBar
