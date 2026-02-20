import {
  VscodeTextfield,
  VscodeToolbarButton,
} from '@vscode-elements/react-elements'
import {
  type ComponentRef,
  type FC,
  type KeyboardEvent,
  type RefObject,
  useImperativeHandle,
  useRef,
} from 'react'
import { css, cx } from 'styled-system/css'
import { hstack } from 'styled-system/patterns/hstack'

export type TableFindBarRef = {
  focusInput: () => void
}

const TableFindBar: FC<{
  ref: RefObject<TableFindBarRef | null> | undefined
  isOpen: boolean
  findQuery: string
  findMatchCountText: string
  hasMatch: boolean
  onFindInput: (event: Event) => void
  onFindInputKeyDown: (event: KeyboardEvent<Element>) => void
  onMoveFindPrevious: () => void
  onMoveFindNext: () => void
  onCloseFind: () => void
}> = ({
  ref,
  isOpen,
  findQuery,
  findMatchCountText,
  hasMatch,
  onFindInput,
  onFindInputKeyDown,
  onMoveFindPrevious,
  onMoveFindNext,
  onCloseFind,
}) => {
  const inputRef = useRef<ComponentRef<typeof VscodeTextfield> | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      focusInput: () => {
        inputRef.current?.updateComplete.then(() => {
          inputRef.current?.focus()
        })
      },
    }),
    [],
  )

  if (!isOpen) {
    return null
  }

  return (
    <section
      className={hstack({
        pos: 'absolute',
        top: '2',
        right: '4',
        zIndex: 'tableFindBar',
        gap: '0.5',
        px: '2',
        py: '1',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--vscode-widget-border)',
        bgColor: 'var(--vscode-editorWidget-background)',
        boxShadow: 'lg',
        borderRadius: 'lg',
      })}
    >
      <VscodeTextfield
        ref={inputRef}
        value={findQuery}
        placeholder="Find"
        className={css({ w: '48' })}
        onInput={onFindInput}
        onKeyDown={onFindInputKeyDown}
      />

      <span
        className={css({
          color: 'var(--vscode-editor-foreground)',
          minW: '14',
          textAlign: 'center',
        })}
      >
        {findMatchCountText}
      </span>

      <VscodeToolbarButton
        aria-label="Previous match"
        disabled={!hasMatch}
        onClick={onMoveFindPrevious}
      >
        <div className={cx(css({ px: '0' }), 'codicon codicon-arrow-up')} />
      </VscodeToolbarButton>

      <VscodeToolbarButton
        aria-label="Next match"
        disabled={!hasMatch}
        onClick={onMoveFindNext}
      >
        <div className={cx(css({ px: '0' }), 'codicon codicon-arrow-down')} />
      </VscodeToolbarButton>

      <VscodeToolbarButton aria-label="Close find" onClick={onCloseFind}>
        <div className={cx(css({ px: '0' }), 'codicon codicon-close')} />
      </VscodeToolbarButton>
    </section>
  )
}

export default TableFindBar
