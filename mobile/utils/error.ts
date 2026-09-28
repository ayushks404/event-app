import axios from 'axios';

export interface AppApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  status?: number;
  isNetwork?: boolean;
}

export function normalizeError(err: unknown): AppApiError {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return { code: 'TIMEOUT', message: 'The server is waking up. Please try again in a moment.', isNetwork: true };
    }
    if (!err.response) {
      return { code: 'NETWORK', message: 'No internet connection', isNetwork: true };
    }
    const s = err.response.status;
    if (s >= 500) {
      return { code: 'SERVER_ERROR', message: 'Something went wrong on our side. Please try again.', status: s };
    }
    const e = err.response.data?.error;
    return { code: e?.code ?? 'UNKNOWN', message: e?.message ?? 'Request failed', details: e?.details, status: s };
  }
  return { code: 'UNKNOWN', message: 'Unexpected error' };
}
