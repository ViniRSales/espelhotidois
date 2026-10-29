import clsx from 'clsx';
import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

/** Busca do cabeçalho: leva a `/buscar?q=`. */
function SearchBar({ className }: { className?: string }) {
    const navigate = useNavigate();
    const [parametros] = useSearchParams();
    const [texto, setTexto] = useState(parametros.get('q') ?? '');

    function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        const termo = texto.trim();
        if (!termo) return;
        navigate(`/buscar?${new URLSearchParams({ q: termo })}`);
    }

    return (
        <form
            role='search'
            aria-label='Doações e pedidos'
            onSubmit={enviar}
            className={clsx(
                'flex h-13 min-w-0 items-center gap-3 rounded-xl bg-background px-4',
                'focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent',
                className,
            )}
        >
            <Search size={24} className='shrink-0' aria-hidden />
            <label htmlFor='busca-cabecalho' className='sr-only'>Pesquisar</label>
            <input
                id='busca-cabecalho'
                type='search'
                name='q'
                enterKeyHint='search'
                autoComplete='off'
                maxLength={100}
                placeholder='Pesquisar'
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                className='min-w-0 flex-1 bg-transparent text-body-l text-foreground outline-none placeholder:text-muted'
            />
        </form>
    );
}

export default SearchBar;
