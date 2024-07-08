import { defineConfig } from '@pandacss/dev'
import { TABLE_ROW_PADDING_PX } from './src/table/constants/constants'

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
          tableRowPadding: { value: `${TABLE_ROW_PADDING_PX}px` },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: 'styled-system',

  // jsxFramework: 'react',

  globalVars: {
    '--vscode-foreground': {},
    '--vscode-editor-background': {},
    '--vscode-editor-foreground': {},
    '--vscode-editor-font-family': {},
    '--vscode-editor-font-size': {},
    '--vscode-keybindingTable-headerBackground': {},
    '--vscode-keybindingTable-rowsBackground': {},
    '--vscode-focusBorder': {},
    '--vscode-list-activeSelectionBackground': {},
    '--vscode-list-activeSelectionForeground': {},
    '--vscode-list-focusOutline': {},
    '--vscode-input-background': {},
    '--vscode-input-foreground': {},
    '--vscode-input-border': {},
    '--vscode-gitDecoration-addedResourceForeground': {},
    '--vscode-gitDecoration-modifiedResourceForeground': {},
    '--vscode-gitDecoration-deletedResourceForeground': {},
  },
})
