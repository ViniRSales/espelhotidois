import { Heart, ImageOff, MapPin } from 'lucide-react';

interface ItemCardProps {
    title?: string;
    description?: string;
    photoUrl?: string;
    /** Chips abaixo da descrição, como categoria, condição ou entrega. */
    chips?: string[];
    location?: string;
    likes?: number;
}

/** Cartão de um item doado, como aparece para outras pessoas. Também serve de pré-visualização no cadastro. */
function ItemCard({ title, description, photoUrl, chips = [], location, likes = 0 }: ItemCardProps) {
    return (
        <article className='overflow-hidden rounded-2xl border border-border/15 bg-surface'>
            <div className='flex aspect-[16/10] items-center justify-center bg-border/5'>
                {photoUrl
                    ? <img src={photoUrl} alt='' className='size-full object-cover' />
                    : <ImageOff size={32} className='text-muted' aria-label='Sem foto' />}
            </div>
            <div className='flex flex-col gap-3 p-4'>
                <h3 className='text-card-title leading-snug'>{title || 'Nome do item'}</h3>
                <p className='line-clamp-3 text-body leading-snug text-muted'>
                    {description || 'A descrição do item aparece aqui.'}
                </p>
                {chips.length > 0 && (
                    <ul className='flex flex-wrap gap-2'>
                        {chips.map((chip) => (
                            <li key={chip} className='rounded-md bg-background px-2 py-1 text-caption-medium'>{chip}</li>
                        ))}
                    </ul>
                )}
                <div className='flex items-center justify-between text-caption text-muted'>
                    <span className='flex items-center gap-1'>
                        <MapPin size={16} aria-hidden />
                        {location || 'Seu bairro'}
                    </span>
                    <span className='flex items-center gap-1' aria-label={`${likes} curtidas`}>
                        <Heart size={16} aria-hidden />
                        {likes}
                    </span>
                </div>
            </div>
        </article>
    );
}

export default ItemCard;
