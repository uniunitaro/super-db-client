import { useHotkeys } from 'react-hotkeys-hook'
import { Key } from 'ts-key-enum'

export const useShortcutKeys = ({
  deleteRow,
  moveSelectedCell,
  toggleSelectedCellInputFocus,
  exitSelectedCellInput,
  resetMultiSelection,
  undoOperation,
  redoOperation,
}: {
  deleteRow: () => void
  moveSelectedCell: ({
    direction,
    isShiftPressed,
  }: {
    direction: 'up' | 'down' | 'left' | 'right'
    isShiftPressed: boolean
  }) => void
  toggleSelectedCellInputFocus: () => void
  exitSelectedCellInput: () => void
  resetMultiSelection: () => void
  undoOperation: () => void
  redoOperation: () => void
}) => {
  useHotkeys([Key.Backspace, Key.Delete], deleteRow)

  useHotkeys(
    [
      Key.ArrowUp,
      Key.ArrowDown,
      `${Key.Shift}+${Key.ArrowUp}`,
      `${Key.Shift}+${Key.ArrowDown}`,
    ],
    (event, handler) => {
      // デフォルトのスクロール動作を無効化
      event.preventDefault()

      const isShiftPressed = event.shiftKey
      if (isShiftPressed && !handler.shift) {
        // Shiftありバージョンとなしバージョンを両方受け取ってしまって選択スピードが速くなるので、
        // Shiftキーが押されているがショートカットキーにShiftが含まれていない場合は無視
        return
      }

      moveSelectedCell({
        direction: handler.keys?.includes('up') ? 'up' : 'down',
        isShiftPressed,
      })
    },
    // 上下移動の場合は入力中でも動作させる
    // が、複数行の場合に行を変えるのが不可能になるので要検討
    { enableOnFormTags: true },
  )

  useHotkeys([Key.ArrowLeft, Key.ArrowRight], (event, handler) => {
    // デフォルトのスクロール動作を無効化
    event.preventDefault()

    moveSelectedCell({
      direction: handler.keys?.includes('left') ? 'left' : 'right',
      isShiftPressed: false,
    })
  })

  useHotkeys(
    Key.Enter,
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
  useHotkeys(
    Key.Escape,
    () => {
      exitSelectedCellInput()
      resetMultiSelection()
    },
    { enableOnFormTags: true },
  )

  useHotkeys('mod+z', undoOperation)
  useHotkeys(['mod+shift+z', 'mod+y'], redoOperation)
}
