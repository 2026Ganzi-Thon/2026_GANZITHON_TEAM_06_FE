
import PageLinks from '../components/common/PageLinks';

// 배경은 기다림 마치기 화면과 같아서 finish-waiting-page 클래스를 함께 씁니다.
export default function FinishSavePage()
{


    return (
        <main className="finish-waiting-page">
            <section className="finish-save-panel">
                <h1 className="finish-save-title">담요 조각을 계정에 저장할까요?</h1>
                <p className="finish-save-desc">저장하고 완성된 나의 담요를 확인하세요.</p>
                <img className="finish-save-gift" src="/assets/storage/gift.png" alt="선물 상자" />
                <button type="button" className="finish-save-btn finish-save-btn-primary">저장할래요.</button>
                <button type="button" className="finish-save-btn finish-save-btn-later">나중에 할게요.</button>
            </section>
            <PageLinks />
        </main>
    );
}
