import clsx from 'clsx';
import { ImagePlus, X } from 'lucide-react';
import { useId, useRef } from 'react';

import Button from '@/components/Button/Button';
import { SOLICITACAO } from '@/config/solicitacao';

import type { FotoFormulario } from './formulario';

interface SeletorFotoProps {
    foto: FotoFormulario | null;
    erro?: string;
    aoMudar: (foto: FotoFormulario | null) => void;
}

/** Escolha da foto de referência (opcional, uma só), no mesmo visual do envio de fotos do cadastro de doação. */
function SeletorFoto({ foto, erro, aoMudar }: SeletorFotoProps) {
    const id = useId();
    const seletor = useRef<HTMLInputElement>(null);
    const { tamanhoMaximoMb, tiposPermitidos } = SOLICITACAO.fotos;

    function escolher(arquivos: FileList | null) {
        const arquivo = arquivos?.[0];
        if (arquivo) aoMudar({ arquivo, url: URL.createObjectURL(arquivo) });
    }

    function remover() {
        if (foto?.arquivo) URL.revokeObjectURL(foto.url);
        aoMudar(null);
    }

    return (
        <div
            role='group'
            aria-labelledby={`${id}-rotulo`}
            aria-describedby={clsx(`${id}-dica`, erro && `${id}-erro`)}
            className='flex flex-col gap-3'
        >
            <span id={`${id}-rotulo`} className='text-subtitle'>
                Foto de referência<span className='text-body text-muted'> (opcional)</span>
            </span>
            <p id={`${id}-dica`} className='text-caption leading-snug text-muted'>
                Mostra o tipo de item que você procura. JPG, PNG ou WEBP de até {tamanhoMaximoMb} MB.
            </p>

            {foto ? (
                <div className='relative aspect-square w-40 overflow-hidden rounded-xl border border-border/15 bg-background'>
                    <img src={foto.url} alt='Foto de referência escolhida' className='size-full object-cover' />
                    <button
                        type='button'
                        onClick={remover}
                        aria-label='Remover a foto'
                        title='Remover'
                        className='absolute top-2 right-2 rounded-full bg-surface/90 p-1.5 shadow hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent'
                    >
                        <X size={16} aria-hidden />
                    </button>
                </div>
            ) : (
                <div
                    className={clsx(
                        'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center',
                        erro ? 'border-danger' : 'border-border/25',
                    )}
                >
                    <Button variant='outline' icon={<ImagePlus size={18} aria-hidden />} onClick={() => seletor.current?.click()}>
                        Escolher foto
                    </Button>
                    <input
                        ref={seletor}
                        type='file'
                        accept={tiposPermitidos.join(',')}
                        hidden
                        data-testid='seletor-foto'
                        onChange={(evento) => {
                            escolher(evento.target.files);
                            evento.target.value = '';
                        }}
                    />
                </div>
            )}

            {erro && <p id={`${id}-erro`} role='alert' className='text-caption-medium leading-snug text-danger'>{erro}</p>}
        </div>
    );
}

export default SeletorFoto;
