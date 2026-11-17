export default function MongsilDialogue ({ children, actions })
{
    return (
        <section className="mongsil-dialogue">
            <div className="mongsil-dialogue-frame">
                <img src="/assets/ui/dialogue.png" alt="몽실 역장" />
                <div className="mongsil-dialogue-text">{children}</div>
                <div className="mongsil-dialogue-actions">{actions}</div>
            </div>
        </section>
    );
}
