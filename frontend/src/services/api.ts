const API_BASE = '/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data.data !== undefined ? data.data : data;
}

export async function uploadApi<T>(endpoint: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Upload failed with status ${res.status}`);
  }
  return data.data !== undefined ? data.data : data;
}
