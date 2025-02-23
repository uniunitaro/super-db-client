// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const tuple = <T extends any[]>(...args: T): T => args
