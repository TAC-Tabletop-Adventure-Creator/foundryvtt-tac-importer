import { TAC_API_URL } from '../settings';

export async function fetchAsset<T>(endpoint: string, id: string, params = ''): Promise<T> {
  const url = `${TAC_API_URL}${endpoint}?id=${id}${params ? '&' + params : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) throw new Error('Asset not found');
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
