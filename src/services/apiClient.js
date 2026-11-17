import { API_BASE_URL } from './api.js';

export async function apiFetch (path, options = {})
{
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    let body;

    try
    {
        body = await response.json();
    }
    catch
    {
        throw new Error('서버 응답을 읽지 못했습니다.');
    }

    if (!response.ok || !body.success)
    {
        throw new Error(body.error?.message || '요청에 실패했습니다.');
    }

    return body.data;
}