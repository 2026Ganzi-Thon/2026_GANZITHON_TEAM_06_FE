// receivedImage: 받은 담요 조각 이미지. 있으면 상자에서 조각이 튀어나오는 연출을 보여 줍니다.
export default function GiftView({ onReceive, receivedImage, disabled })
{
    return (
        <div className="finish-gift-content">
            <img className="finish-gift-illust" src="/assets/storage/gift-illust.png" alt="" />
            <p className="finish-gift-message">
                담요 조각 한 칸이에요.<br />
                기다린 시간을 한 칸에 담았어요.
            </p>
            <div className="finish-gift-stage">
                <img className="finish-gift-box" src="/assets/storage/gift.png" alt="선물 상자" />
                {receivedImage && <img className="finish-gift-piece" src={receivedImage} alt="받은 담요 조각" />}
            </div>
            <button type="button" className="finish-gift-btn" disabled={disabled} onClick={onReceive}>
                <img src="/assets/storage/icon-gift.png" alt="" />
                담요 조각 받기
            </button>
        </div>
    );
}
