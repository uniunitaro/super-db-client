export class DatabaseError extends Error {
  readonly kind = 'databaseError'
}

export const toDatabaseError = (e: unknown): DatabaseError => {
  if (e instanceof Error) {
    return new DatabaseError(e.message, { cause: e })
  }

  return new DatabaseError('An unexpected error occurred')
}

export class ValidationError extends Error {
  readonly kind = 'validationError'
}

export const toValidationError = (e: unknown): ValidationError => {
  if (e instanceof Error) {
    return new ValidationError(e.message, { cause: e })
  }

  return new ValidationError('An unexpected error occurred')
}

export class StoreError extends Error {
  readonly kind = 'storeError'
}

export const toStoreError = (e: unknown): StoreError => {
  if (e instanceof Error) {
    return new StoreError(e.message, { cause: e })
  }

  return new StoreError('An unexpected error occurred')
}
