import { API_BASE_URL } from './api.js';
import { clearAuth, readAccessToken } from './auth.js';

// withAuth: false면 저장된 계정 토큰을 보내지 않습니다 (가입/로그인처럼 토큰 없이 부르는 API용).
export async function apiFetch (path, { withAuth = true, ...options } = {})
{
    const token = withAuth ? readAccessToken() : null;
    let response;

    try
    {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers
            }
        });
    }
    catch
    {
        throw new Error('네트워크 연결을 확인해 주세요.');
    }

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
        const error = new Error(body.error?.message || '요청에 실패했습니다.');

        error.code = body.error?.code;
        error.status = response.status;

        // 보낸 토큰이 거절됐으면(만료·잘못된 토큰) 저장된 토큰을 지워 로그아웃 상태로 되돌립니다.
        if (token && response.status === 401)
        {
            clearAuth();
        }

        throw error;
    }

    return body.data;
}