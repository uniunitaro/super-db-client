import { defineConfig } from '@pandacss/dev'
import {
  CELL_BORDER_WIDTH,
  TABLE_LINE_HEIGHT,
  TABLE_ROW_PADDING_X_PX,
  TABLE_ROW_PADDING_Y_PX,
} from './src/table/constants/constants'

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        spacing: {
          tableRowPaddingX: { value: `${TABLE_ROW_PADDING_X_PX}px` },
          tableRowPaddingY: { value: `${TABLE_ROW_PADDING_Y_PX}px` },
        },
        lineHeights: {
          table: { value: `${TABLE_LINE_HEIGHT}` },
        },
        borderWidths: {
          cellBorderWidth: { value: `${CELL_BORDER_WIDTH}px` },
        },
      },
      keyframes: {
        progress: {
          '0%': {
            backgroundSize: '200% 100%',
            backgroundPosition: 'left -31.25% top 0%',
          },
          '50%': {
            backgroundSize: '800% 100%',
            backgroundPosition: 'left -49% top 0%',
          },
          '100%': {
            backgroundSize: '400% 100%',
            backgroundPosition: 'left -102% top 0%',
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: 'styled-system',

  // jsxFramework: 'react',

  globalVars: {
    '--vscode-foreground': {},
    '--vscode-descriptionForeground': {},
    '--vscode-editor-background': {},
    '--vscode-editor-foreground': {},
    '--vscode-editor-placeholder\\.foreground': {},
    '--vscode-editor-font-family': {},
    '--vscode-editor-font-size': {},
    '--vscode-keybindingTable-headerBackground': {},
    '--vscode-keybindingTable-rowsBackground': {},
    '--vscode-focusBorder': {},
    '--vscode-list-activeSelectionBackground': {},
    '--vscode-list-activeSelectionForeground': {},
    '--vscode-list-inactiveSelectionBackground': {},
    '--vscode-list-inactiveSelectionForeground': {},
    '--vscode-list-hoverBackground': {},
    '--vscode-list-hoverForeground': {},
    '--vscode-list-focusOutline': {},
    '--vscode-tree-tableColumnsBorder': {},
    '--vscode-input-background': {},
    '--vscode-input-foreground': {},
    '--vscode-input-border': {},
    '--vscode-gitDecoration-addedResourceForeground': {},
    '--vscode-gitDecoration-modifiedResourceForeground': {},
    '--vscode-gitDecoration-deletedResourceForeground': {},
    '--vscode-progressBar-background': {},
    '--vscode-sash-hoverBorder': {},
  },
})
