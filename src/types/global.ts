/**
 * A generic type that represents the result of an operation that can either succeed with a value of type T or fail with an error of type U.
 *
 * @template T The type of the successful result.
 * @template E The type of the error result.
 */
export type Result<T, E> =
  | (T & { error?: undefined })
  | ({ [K in keyof T]?: undefined } & { error: E })
