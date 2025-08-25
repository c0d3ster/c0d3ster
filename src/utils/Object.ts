/**
 * Safely pick specific keys from an object
 * @param obj - The source object
 * @param keys - Array of keys to pick
 * @returns A new object with only the specified keys
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: ReadonlyArray<K>
): Pick<T, K> =>
  keys.reduce(
    (acc, k) => (k in obj ? ((acc[k] = obj[k]), acc) : acc),
    {} as Pick<T, K>
  )

/**
 * Safely omit specific keys from an object
 * @param obj - The source object
 * @param keys - Array of keys to omit
 * @returns A new object without the specified keys
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: ReadonlyArray<K>
): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result
}

/**
 * Check if an object has any of the specified keys
 * @param obj - The object to check
 * @param keys - Array of keys to check for
 * @returns True if the object has any of the specified keys
 */
export const hasAny = <T extends object, K extends keyof T>(
  obj: T,
  keys: ReadonlyArray<K>
): boolean => keys.some((key) => key in obj)
