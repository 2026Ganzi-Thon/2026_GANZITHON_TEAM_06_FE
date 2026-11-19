// 최소 STOMP 클라이언트 (CONNECT / SUBSCRIBE / SEND만 지원). 라이브러리를 추가하지 않으려고 직접 구현했습니다.
// ponytail: ACK, 트랜잭션 미지원. 하트비트는 보내기만 하고 서버 무응답은 감지하지 않는다. 필요해지면 @stomp/stompjs 도입을 팀과 상의한다.

const NULL = '\0';
const HEART_BEAT_MS = 10_000;

function encodeFrame (command, headers = {}, body = '')
{
    const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);

    return `${command}\n${headerLines.join('\n')}\n\n${body}${NULL}`;
}

function decodeFrame (raw)
{
    const [head, ...rest] = raw.split('\n\n');
    const [command, ...headerLines] = head.split('\n');
    const headers = {};

    headerLines.forEach((line) =>
    {
        const index = line.indexOf(':');

        if (index > 0)
        {
            headers[line.slice(0, index)] = line.slice(index + 1);
        }
    });

    return { command, headers, body: rest.join('\n\n') };
}

// onConnect: 연결(CONNECTED) 직후, onClose: 연결이 끊긴 뒤, onError: 서버가 ERROR 프레임으로 거부했을 때(토큰 오류 등) 호출됩니다.
export function createStompClient ({ url, headers, onConnect, onClose, onError })
{
    const subscriptions = new Map();
    let socket = null;
    let nextId = 0;
    let heartBeatTimer = null;

    const send = (command, frameHeaders, body) =>
    {
        if (socket?.readyState === WebSocket.OPEN)
        {
            socket.send(encodeFrame(command, frameHeaders, body));
        }
    };

    const handleMessage = (event) =>
    {
        // 한 번에 프레임이 여러 개 올 수 있고, 빈 줄(하트비트)은 무시한다.
        event.data.split(NULL).forEach((raw) =>
        {
            const text = raw.replace(/^\n+/, '');

            if (!text)
            {
                return;
            }

            const frame = decodeFrame(text);

            if (frame.command === 'CONNECTED')
            {
                onConnect?.();
            }
            else if (frame.command === 'ERROR')
            {
                onError?.(frame.headers.message ?? frame.body);
            }
            else if (frame.command === 'MESSAGE')
            {
                subscriptions.get(frame.headers.subscription)?.(frame);
            }
        });
    };

    return {
        connect ()
        {
            socket = new WebSocket(url);
            socket.onopen = () => send('CONNECT', { 'accept-version': '1.2', 'heart-beat': `${HEART_BEAT_MS},${HEART_BEAT_MS}`, ...headers });
            socket.onmessage = handleMessage;
            socket.onclose = () =>
            {
                clearInterval(heartBeatTimer);
                onClose?.();
            };
            // 서버가 10초마다 하트비트를 기대하므로 줄바꿈 하나를 보낸다.
            heartBeatTimer = setInterval(() =>
            {
                if (socket?.readyState === WebSocket.OPEN)
                {
                    socket.send('\n');
                }
            }, HEART_BEAT_MS);
        },

        subscribe (destination, callback)
        {
            const id = `sub-${nextId += 1}`;

            subscriptions.set(id, callback);
            send('SUBSCRIBE', { id, destination });
        },

        publish (destination, payload)
        {
            send('SEND', { destination, 'content-type': 'application/json' }, JSON.stringify(payload));
        },

        disconnect ()
        {
            clearInterval(heartBeatTimer);

            if (socket)
            {
                socket.onclose = null;
                send('DISCONNECT', {});
                socket.close();
                socket = null;
            }

            subscriptions.clear();
        }
    };
}
