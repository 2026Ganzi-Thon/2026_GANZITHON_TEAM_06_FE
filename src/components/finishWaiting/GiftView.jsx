export default function GiftView({ onReceive })
{
    return (
        <div className="finish-gift-content">
            <img className="finish-gift-illust" src="/assets/storage/gift-illust.png" alt="" />
            <p className="finish-gift-message">
                담요 조각 한 칸이에요.<br />
                기다린 시간을 한 칸에 담았어요.
            </p>
            <img className="finish-gift-box" src="/assets/storage/gift.png" alt="선물 상자" />
            <button type="button" className="finish-gift-btn" onClick={onReceive}>
                <img src="/assets/storage/icon-gift.png" alt="" />
                담요 조각 받기
            </button>
        </div>
    );
}
