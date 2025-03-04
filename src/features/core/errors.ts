export class DatabaseError extends Error {}

export const toDatabaseError = (e: unknown): DatabaseError => {
  if (e instanceof Error) {
    return new DatabaseError(e.message, { cause: e })
  }

  return new DatabaseError('An unexpected error occurred')
}

export class ValidationError extends Error {}

export const toValidationError = (e: unknown): ValidationError => {
  if (e instanceof Error) {
    return new ValidationError(e.message, { cause: e })
  }

  return new ValidationError('An unexpected error occurred')
}
