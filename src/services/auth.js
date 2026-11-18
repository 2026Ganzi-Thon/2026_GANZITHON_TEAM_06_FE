const ACCESS_TOKEN_KEY = 'accessToken';
const NICKNAME_KEY = 'nickname';

export function readAccessToken ()
{
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAuth ({ accessToken, nickname })
{
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(NICKNAME_KEY, nickname);
}

export function clearAuth ()
{
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(NICKNAME_KEY);
}
