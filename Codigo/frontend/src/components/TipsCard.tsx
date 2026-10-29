import { Lightbulb } from 'lucide-react';

interface TipsCardProps {
    title?: string;
    tips: string[];
}

/** Cartão de dicas da coluna lateral. */
function TipsCard({ title = 'Dicas', tips }: TipsCardProps) {
    return (
        <aside className='flex flex-col gap-3 rounded-2xl bg-highlight/15 p-5' aria-label={title}>
            <p className='flex items-center gap-2 text-subtitle'>
                <Lightbulb size={18} aria-hidden />
                {title}
            </p>
            <ul className='flex list-disc flex-col gap-2 pl-5 text-body leading-snug'>
                {tips.map((dica) => (
                    <li key={dica}>{dica}</li>
                ))}
            </ul>
        </aside>
    );
}

export default TipsCard;
