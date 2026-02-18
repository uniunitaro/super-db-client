export const readEventTargetValue = (event: Event | InputEvent): string => {
  const target = event.target as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement

  return target?.value ?? ''
}

export const readEventTargetChecked = (event: Event): boolean => {
  const target = event.target as HTMLInputElement

  return target?.checked ?? false
}
