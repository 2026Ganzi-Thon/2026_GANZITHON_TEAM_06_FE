import { useEffect, useState } from 'react';

// 페이드 인/아웃 시간(ms), 볼륨을 바꾸는 간격(ms)
const MUSIC_FADE_MS = 1500;
const MUSIC_FADE_STEP_MS = 50;

// iOS는 웹에서 볼륨을 바꿀 수 없다(항상 1). 이때는 페이드 대신 바로 바꾸고, 끄기는 muted로 처리한다.
const CAN_SET_VOLUME = (() =>
{
    const probe = new Audio();

    probe.volume = 0.5;

    return probe.volume === 0.5;
})();

// 화면이 바뀌어도 같은 곡이 끊기지 않도록 재생 중인 음악은 모듈에 하나만 둔다.
// (온보딩 → 대기실처럼 이 훅을 쓰는 화면끼리 넘어가면 이어서 재생하고, 새로고침하면 모듈이 새로 만들어져 처음부터 재생한다.)
let music = null;
let musicSrc = null;
let stopTimer = null;
// 현재 화면의 최대 볼륨과, 사용자가 음악을 끈 상태(새로고침해도 유지)
let musicVolume = 0;
let muted = false;
const mutedListeners = new Set();

try
{
    muted = localStorage.getItem('musicMuted') === '1';
}
catch
{
    // 저장소를 못 읽으면 켜진 상태로 둔다.
}

// audio의 볼륨을 target까지 MUSIC_FADE_MS에 걸쳐 서서히 바꾼다. 타이머는 audio마다 따로 둬서 곡이 바뀔 때 서로 겹쳐 페이드할 수 있다.
function fadeTo (audio, target, onDone)
{
    clearInterval(audio.fadeTimer);

    if (!CAN_SET_VOLUME)
    {
        onDone?.();
        return;
    }

    const step = (Math.abs(target - audio.volume) * MUSIC_FADE_STEP_MS) / MUSIC_FADE_MS;

    audio.fadeTimer = setInterval(() =>
    {
        const diff = target - audio.volume;

        if (Math.abs(diff) <= step)
        {
            audio.volume = target;
            clearInterval(audio.fadeTimer);
            onDone?.();
            return;
        }

        audio.volume += Math.sign(diff) * step;
    }, MUSIC_FADE_STEP_MS);
}

// 배경음악을 끄거나 켠다. 켜고 끄는 건 서서히 바뀌며, 훅을 쓰는 모든 화면에 적용된다.
function toggleMusicMuted ()
{
    muted = !muted;

    try
    {
        localStorage.setItem('musicMuted', muted ? '1' : '0');
    }
    catch
    {
        // 저장하지 못해도 이번 접속 동안은 동작한다.
    }

    mutedListeners.forEach((listener) => listener(muted));

    if (music && !CAN_SET_VOLUME)
    {
        music.muted = muted;
    }
    else if (music)
    {
        fadeTo(music, muted ? 0 : musicVolume);
    }
}

// 음악이 꺼져 있는지와 토글 함수를 돌려준다. (음악 끄기/켜기 버튼용)
export function useMusicMuted ()
{
    const [isMuted, setIsMuted] = useState(muted);

    useEffect(() =>
    {
        mutedListeners.add(setIsMuted);

        return () => mutedListeners.delete(setIsMuted);
    }, []);

    return [isMuted, toggleMusicMuted];
}

// 화면에 있는 동안 배경음악을 반복 재생한다. 자동재생이 막히면 첫 터치/클릭/키 입력 때 다시 시도한다.
// volume은 최대 볼륨(0~1)이다.
export function useBackgroundMusic (src, volume)
{
    useEffect(() =>
    {
        // 화면이 넘어가는 중이면 예약돼 있던 정지를 취소하고 같은 음악을 이어 쓴다.
        clearTimeout(stopTimer);
        musicVolume = volume;

        if (!music || musicSrc !== src)
        {
            // 다른 곡으로 넘어가면 이전 곡은 서서히 줄여 멈추고, 새 곡은 서서히 키운다.
            if (music)
            {
                const previous = music;

                fadeTo(previous, 0, () => previous.pause());
            }

            music = new Audio(src);
            music.loop = true;
            music.volume = 0;
            musicSrc = src;

            if (!CAN_SET_VOLUME)
            {
                music.muted = muted;
            }
        }

        const audio = music;

        // 모바일은 click/touchend만 재생 허용 동작으로 인정한다(pointerdown/touchstart는 안 됨). 성공할 때까지 유지한다.
        const events = ['click', 'touchend', 'keydown'];
        const stopListening = () => events.forEach((name) => window.removeEventListener(name, playOnInteract));
        // 재생 약속이 이미 정리(unmount)된 뒤에 풀리면 소리가 새어 나가므로 막는다. (개발 모드 StrictMode의 이중 실행 대비)
        let disposed = false;
        // 이미 재생 중이면 play()가 바로 풀리므로 볼륨만 이 화면 값으로 부드럽게 맞춘다.
        const startMusic = () => audio.play().then(() =>
        {
            if (disposed)
            {
                return;
            }

            stopListening();
            fadeTo(audio, muted ? 0 : volume);
        });
        const playOnInteract = () => startMusic().catch(() => {});

        startMusic().catch(() =>
        {
            events.forEach((name) => window.addEventListener(name, playOnInteract));
        });

        return () =>
        {
            disposed = true;
            stopListening();
            // 곧바로 다음 화면이 같은 음악을 쓰면 위에서 취소된다. 아니면 서서히 줄여 멈춘다.
            stopTimer = setTimeout(() =>
            {
                fadeTo(audio, 0, () =>
                {
                    audio.pause();

                    if (music === audio)
                    {
                        music = null;
                        musicSrc = null;
                    }
                });
            }, 0);
        };
    }, [src, volume]);
}
