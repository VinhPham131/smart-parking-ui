export interface HttpErrorResponse {
  status: number
  message: string
  data?: unknown
}

export class HttpError extends Error {
    status: number
    data?: unknown

    constructor(status: number, message: string, data?: unknown) {
      super(message)
      this.status = status
      this.data = data
    }
}

// Global error handler callback
let errorHandler: ((error: HttpError) => Promise<void>) | null = null

export function setHttpErrorHandler(
  handler: (error: HttpError) => Promise<void>,
) {
  errorHandler = handler
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new HttpError(
      response.status,
      isJson && typeof data === 'object' && 'message' in data
        ? data.message
        : data || `HTTP error! status: ${response.status}`,
      data,
    )

    // Call global error handler if set
    if (errorHandler) {
      await errorHandler(error)
    }

    throw error
  }

  return data as T
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

type FetchExtra = Omit<RequestInit, 'method' | 'headers' | 'body'>

export const httpClient = {
  async get<T>(
    url: string,
    headers?: HeadersInit,
    init?: FetchExtra,
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...getAuthHeaders(), ...headers },
      cache: 'no-store',
      ...init,
    })
    return handleResponse<T>(response)
  },

  async post<T>(
    url: string,
    body?: unknown,
    headers?: HeadersInit,
    init?: FetchExtra,
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...getAuthHeaders(), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      ...init,
    })
    return handleResponse<T>(response)
  },

  async patch<T>(
    url: string,
    body?: unknown,
    headers?: HeadersInit,
    init?: FetchExtra,
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      ...init,
    })
    return handleResponse<T>(response)
  },

  async put<T>(
    url: string,
    body?: unknown,
    headers?: HeadersInit,
    init?: FetchExtra,
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      ...init,
    })
    return handleResponse<T>(response)
  },

  async delete<T>(
    url: string,
    body?: unknown,
    headers?: HeadersInit,
    init?: FetchExtra,
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
      ...init,
    })
    return handleResponse<T>(response)
  },
}
