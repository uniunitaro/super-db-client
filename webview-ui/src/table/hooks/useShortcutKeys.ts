import { useHotkeys } from 'react-hotkeys-hook'
import { Key } from 'ts-key-enum'

export const useShortcutKeys = ({
  deleteRow,
  moveSelectedCell,
  toggleSelectedCellInputFocus,
  exitSelectedCellInput,
}: {
  deleteRow: () => void
  moveSelectedCell: (direction: 'up' | 'down' | 'left' | 'right') => void
  toggleSelectedCellInputFocus: () => void
  exitSelectedCellInput: () => void
}) => {
  useHotkeys([Key.Backspace, Key.Delete], deleteRow)

  useHotkeys(
    [Key.ArrowUp, Key.ArrowDown],
    (event) => {
      // デフォルトのスクロール動作を無効化
      event.preventDefault()

      moveSelectedCell(event.key === Key.ArrowUp ? 'up' : 'down')
    },
    // 上下移動の場合は入力中でも動作させる
    // が、複数行の場合に行を変えるのが不可能になるので要検討
    { enableOnFormTags: true },
  )
  useHotkeys([Key.ArrowLeft, Key.ArrowRight], (event) => {
    // デフォルトのスクロール動作を無効化
    event.preventDefault()

    moveSelectedCell(event.key === Key.ArrowLeft ? 'left' : 'right')
  })

  useHotkeys(
    [Key.Enter],
    (event) => {
      if (event.isComposing) {
        // IME入力中は無視
        return
      }

      toggleSelectedCellInputFocus()
    },
    {
      enableOnFormTags: true,
    },
  )
  useHotkeys([Key.Escape], exitSelectedCellInput, { enableOnFormTags: true })
}