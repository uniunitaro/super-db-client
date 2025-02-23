export type StrictPick<T, K extends keyof T> = {
  [P in keyof T as K & P]: T[P]
}

// Optional: Add 'extends keyof T' constraint to K
export type StrictOmit<T, K> = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [P in keyof T as Exclude<P, K & keyof any>]: T[P]
}
