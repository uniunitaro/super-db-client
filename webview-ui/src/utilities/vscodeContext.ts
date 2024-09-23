type VSCodeContext = {
  preventDefaultContextMenuItems?: boolean
  webviewSection?: 'row'
  canSetAsNull?: boolean
  canSetAsEmpty?: boolean
}

export const serializeVSCodeContext = (context: VSCodeContext) =>
  JSON.stringify(context)
