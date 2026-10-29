import { CircleAlert } from 'lucide-react';
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';

import Button from '@/components/Button/Button';

interface StepCardProps {
    etapa: number;
    total: number;
    titulo: string;
    descricao: string;
    children?: ReactNode;
    /** Botão principal ("Continuar" ou "Publicar"); também roda ao apertar Enter num campo. */
    rotuloAvancar: string;
    onAvancar: () => void;
    /** Sem `onVoltar`, o botão Voltar não aparece (primeira etapa). */
    onVoltar?: () => void;
    onSalvarRascunho: () => void;
    ocupado: boolean;
    /** Confirmação curta, como "Rascunho salvo." */
    status?: string | null;
    erroGeral?: string | null;
}

/** Cartão de uma etapa do assistente: cabeçalho, campos e rodapé com as ações. */
function StepCard({
    etapa, total, titulo, descricao, children, rotuloAvancar, onAvancar, onVoltar, onSalvarRascunho, ocupado, status, erroGeral,
}: StepCardProps) {
    const tituloRef = useRef<HTMLHeadingElement>(null);
    const primeiraEtapaExibida = useRef(etapa);

    // Ao trocar de etapa, o foco vai para o título, para quem usa teclado ou leitor de tela saber onde está.
    useEffect(() => {
        if (etapa !== primeiraEtapaExibida.current) {
            tituloRef.current?.focus();
            primeiraEtapaExibida.current = -1;
        }
    }, [etapa]);

    function aoEnviar(evento: FormEvent) {
        evento.preventDefault();
        onAvancar();
    }

    return (
        <form noValidate onSubmit={aoEnviar} className='flex flex-col gap-8 rounded-2xl border border-border/15 bg-surface p-5 md:p-8'>
            <header className='flex flex-col gap-2'>
                <p className='text-caption text-muted'>Etapa {etapa} de {total}</p>
                <h2 ref={tituloRef} tabIndex={-1} className='text-title-3 leading-tight outline-none'>{titulo}</h2>
                <p className='text-body leading-snug text-muted'>{descricao}</p>
            </header>

            {children}

            {erroGeral && (
                <p role='alert' className='flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-body leading-snug text-danger'>
                    <CircleAlert size={18} className='mt-0.5 shrink-0' aria-hidden />
                    {erroGeral}
                </p>
            )}

            <footer className='flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                    <Button variant='link' onClick={onSalvarRascunho} disabled={ocupado}>Salvar rascunho</Button>
                    <span role='status' className='text-caption text-muted'>{status}</span>
                </div>
                <div className='flex flex-col-reverse gap-3 sm:flex-row'>
                    {onVoltar && <Button variant='outline' onClick={onVoltar} disabled={ocupado}>Voltar</Button>}
                    <Button type='submit' loading={ocupado}>{rotuloAvancar}</Button>
                </div>
            </footer>
        </form>
    );
}

export default StepCard;
