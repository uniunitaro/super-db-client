export const assertNever = (x: never): never => {
  throw new Error(`Unreachable: ${x}`)
}
