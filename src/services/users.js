import { apiFetch } from './apiClient.js';
import { saveAuth } from './auth.js';

// 가입/로그인 성공 시 토큰을 저장하고 { nickname, accessToken }을 돌려줍니다.
export async function signup ({ nickname, pin, pinConfirm })
{
    const data = await apiFetch('/api/v1/users', {
        method: 'POST',
        withAuth: false,
        body: JSON.stringify({ nickname, pin, pinConfirm })
    });

    saveAuth(data);

    return data;
}

export async function login ({ nickname, pin })
{
    const data = await apiFetch('/api/v1/users/login', {
        method: 'POST',
        withAuth: false,
        body: JSON.stringify({ nickname, pin })
    });

    saveAuth(data);

    return data;
}

export function fetchMe ()
{
    return apiFetch('/api/v1/users/me');
}

export function updatePublicSetting (isPublic)
{
    return apiFetch('/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ isPublic })
    });
}
