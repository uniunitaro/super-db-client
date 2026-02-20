import { readEventTargetValue } from '@/utilities/readEventTarget'
import type { ColumnMetadata } from '@shared-types/sharedTypes'
import {
  VscodeButton,
  VscodeOption,
  VscodeSingleSelect,
  VscodeTextfield,
} from '@vscode-elements/react-elements'
import type { FC, KeyboardEvent } from 'react'
import { css } from 'styled-system/css'
import {
  type EditableFilterCondition,
  FILTER_OPERATOR_OPTIONS,
  createEmptyEditableFilterCondition,
  isBetweenOperator,
  isNoValueOperator,
} from '../domain/filter'

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

  const handleInputEnter = (event: KeyboardEvent<Element>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    onApply()
  }

  return (
    <section
      className={css({
        px: '4',
        py: '2',
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
            display: 'flex',
            gap: '2',
            alignItems: 'center',
            minW: 0,
          })}
        >
          <div className={css({ flex: '1 1 0', minW: 0, maxW: '200px' })}>
            <VscodeSingleSelect
              className={css({ w: 'full', minW: 0 })}
              value={filter.column}
              onChange={(event) =>
                handleFilterChange(
                  filter.id,
                  'column',
                  readEventTargetValue(event),
                )
              }
            >
              <VscodeOption value="">Select column</VscodeOption>
              {columns.map((column) => (
                <VscodeOption key={column.name} value={column.name}>
                  {column.name}
                </VscodeOption>
              ))}
            </VscodeSingleSelect>
          </div>

          <div className={css({ flex: '1 1 0', minW: 0, maxW: '200px' })}>
            <VscodeSingleSelect
              className={css({ w: 'full', minW: 0 })}
              value={filter.operator}
              onChange={(event) =>
                handleFilterChange(
                  filter.id,
                  'operator',
                  readEventTargetValue(
                    event,
                  ) as EditableFilterCondition['operator'],
                )
              }
            >
              {FILTER_OPERATOR_OPTIONS.map((operator) => (
                <VscodeOption key={operator} value={operator}>
                  {operator}
                </VscodeOption>
              ))}
            </VscodeSingleSelect>
          </div>

          <div className={css({ flex: '2 1 0', minW: 0 })}>
            {isNoValueOperator(filter.operator) ? (
              <div
                className={css({
                  color: 'var(--vscode-descriptionForeground)',
                  px: '2',
                  minW: 0,
                })}
              >
                No value required
              </div>
            ) : isBetweenOperator(filter.operator) ? (
              <div
                className={css({
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: '2',
                  minW: 0,
                })}
              >
                <VscodeTextfield
                  className={css({ w: 'full', minW: 0 })}
                  value={filter.value}
                  onInput={(event) =>
                    handleFilterChange(
                      filter.id,
                      'value',
                      readEventTargetValue(event),
                    )
                  }
                  onKeyDown={handleInputEnter}
                  placeholder="Start value"
                />
                <VscodeTextfield
                  className={css({ w: 'full', minW: 0 })}
                  value={filter.valueTo}
                  onInput={(event) =>
                    handleFilterChange(
                      filter.id,
                      'valueTo',
                      readEventTargetValue(event),
                    )
                  }
                  onKeyDown={handleInputEnter}
                  placeholder="End value"
                />
              </div>
            ) : (
              <VscodeTextfield
                className={css({ w: 'full', minW: 0 })}
                value={filter.value}
                onInput={(event) =>
                  handleFilterChange(
                    filter.id,
                    'value',
                    readEventTargetValue(event),
                  )
                }
                onKeyDown={handleInputEnter}
                placeholder={filter.operator === 'IN' ? 'a,b,c' : 'Value'}
              />
            )}
          </div>

          <VscodeButton secondary onClick={() => handleRemoveFilter(filter.id)}>
            Remove
          </VscodeButton>
        </div>
      ))}

      <div
        className={css({
          display: 'flex',
          gap: '2',
          justifyContent: 'flex-end',
        })}
      >
        <VscodeButton secondary onClick={handleAddFilter}>
          Add condition
        </VscodeButton>
        <VscodeButton onClick={() => onApply()}>Apply</VscodeButton>
      </div>
    </section>
  )
}

export default TableFilterBar
