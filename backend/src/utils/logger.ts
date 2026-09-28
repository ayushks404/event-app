/* eslint-disable no-console */
export const logger = {
  info: (...a: unknown[]) => console.log(...a),
  error: (...a: unknown[]) => console.error(...a),
};
