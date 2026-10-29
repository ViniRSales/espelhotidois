const colors = [
    ['bg-background', 'background'],
    ['bg-surface', 'surface'],
    ['bg-accent text-accent-foreground', 'accent'],
    ['bg-highlight', 'highlight'],
    ['bg-foreground text-background', 'foreground'],
    ['bg-muted text-background', 'muted'],
];

const texts = [
    'text-display', 'text-title-1', 'text-title-2', 'text-title-3',
    'text-section', 'text-subtitle-l', 'text-body-l', 'text-subtitle',
    'text-card-title', 'text-button', 'text-body', 'text-label',
    'text-subtitle-s', 'text-link', 'text-caption',
    'text-caption-medium', 'text-caption-bold',
];

function ThemeDisplay() {
    return (
        <main className="space-y-8 p-8">
            <section className="grid grid-cols-3 gap-4">
                {colors.map(([classes, name]) => (
                    <div key={name} className={`${classes} flex h-24 items-end border border-border p-3 text-label`}>
                        {name}
                    </div>
                ))}
            </section>

            <section className="space-y-3 rounded border border-border bg-surface p-6">
                {texts.map((cls) => (
                    <p key={cls} className={`${cls} font-label`}>
                        {cls} — Doapp
                    </p>
                ))}
                <p className="font-display text-title-1">Título com font-display</p>
            </section>
        </main>
    );
}

export default ThemeDisplay;