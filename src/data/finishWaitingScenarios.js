// 기다림 마치기: 선택지(1~3번)별로 '다음'을 누를 때마다 보여줄 몽실 역장의 대사

export const INTRO_STEP = {
    portrait: 'portrait04',
    message: '기다림을 내려놓을 시간이 되었나요?\n지금 마음에 가까운 걸 골라 주세요.',
};

const THANKS = '기다리는 동안 곁에 있어서 좋았어요.\n마음 챙겨 주셔서 고마워요.';

// 인덱스 0 = 1번 버튼, 1 = 2번 버튼, 2 = 3번 버튼
export const SCENARIOS = [
    [
        { portrait: 'portrait03', message: '기다리던 소식이 도착했군요.\n지금 마음은 어떤 모양일까요?' },
        { portrait: 'portrait03', message: '기다리는 동안 마음 한쪽에 가장 오래 머문 건 뭐였을까요?' },
        { portrait: 'portrait03', message: THANKS },
    ],
    [
        { portrait: 'portrait04', message: '바라던 모습과는 달랐군요.\n지금 마음이 어떤지 천천히 살펴봐요.' },
        { portrait: 'portrait04', message: '기다린 시간 동안 마음이 잠깐 쉬어 간 순간이 있었을까요?' },
        { portrait: 'portrait03', message: THANKS },
    ],
    [
        { portrait: 'portrait02', message: '들고 있던 마음을 여기에 내려놓았어요.\n지금은 어떤 기분일까요?' },
        { portrait: 'portrait02', message: '내려놓는 것도 하나의 선택이에요.\n이 선택을 하기까지 마음은 어땠나요?' },
        { portrait: 'portrait03', message: THANKS },
    ],
];
