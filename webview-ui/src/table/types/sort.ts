export type Sort =
  | {
      order: 'asc' | 'desc'
      orderBy: string
    }
  | undefined
