export class DatabaseError extends Error {}

export const toDatabaseError = (e: unknown): DatabaseError => {
  if (e instanceof Error) {
    return new DatabaseError(e.message, { cause: e })
  }

  return new DatabaseError('An unexpected error occurred')
}
