/**
 * Checks if an error is a 401 Unauthorized error.
 */
export function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || /^401: .*Unauthorized/.test(error?.message || "");
}
