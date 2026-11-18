import { apiFetch } from './apiClient.js';

export async function fetchBlanketPieces ()
{
    const data = await apiFetch('/api/v1/blanket-pieces');

    return data.blanketPieces;
}

export function fetchBlanketPiece (pieceId)
{
    return apiFetch(`/api/v1/blanket-pieces/${encodeURIComponent(pieceId)}`);
}
