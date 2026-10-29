import clsx from 'clsx';
import { ImagePlus, LoaderCircle, Star, Upload, X } from 'lucide-react';
import { useId, useRef, useState, type DragEvent } from 'react';

import Button from '@/components/Button/Button';
import { DOACAO } from '@/config/doacao';

import { useCadastroDoacao } from './useCadastroDoacao';

/** Envio de fotos: arrastar e soltar ou escolher, com capa (a primeira foto) e remoção. */
function PhotoUploader() {
    const { estado, adicionarFotos, removerFoto, tornarCapa } = useCadastroDoacao();
    const { fotos } = estado.formulario;
    const { enviandoFotos } = estado;
    const erro = estado.erros.fotos;
    const id = useId();
    const seletor = useRef<HTMLInputElement>(null);
    const [arrastando, setArrastando] = useState(false);
    const [removendo, setRemovendo] = useState<string | null>(null);
    const cheio = fotos.length + enviandoFotos >= DOACAO.fotos.maximo;

    function aoSoltar(evento: DragEvent) {
        evento.preventDefault();
        setArrastando(false);
        if (!cheio) void adicionarFotos([...evento.dataTransfer.files]);
    }

    async function remover(fotoId: string) {
        setRemovendo(fotoId);
        await removerFoto(fotoId);
        setRemovendo(null);
    }

    return (
        <div className='flex flex-col gap-3' role='group' aria-labelledby={`${id}-rotulo`} aria-describedby={`${id}-dica`}>
            <div className='flex items-baseline justify-between gap-3'>
                <span id={`${id}-rotulo`} className='text-subtitle'>Fotos</span>
                <span className='text-caption text-muted tabular-nums'>{fotos.length}/{DOACAO.fotos.maximo}</span>
            </div>
            <p id={`${id}-dica`} className='text-caption leading-snug text-muted'>
                Adicione até {DOACAO.fotos.maximo} fotos. A primeira é a capa do anúncio.
            </p>

            {!cheio && (
                <div
                    onDragOver={(evento) => {
                        evento.preventDefault();
                        setArrastando(true);
                    }}
                    onDragLeave={() => setArrastando(false)}
                    onDrop={aoSoltar}
                    className={clsx(
                        'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition',
                        arrastando ? 'border-accent bg-accent/10' : erro ? 'border-danger' : 'border-border/25',
                    )}
                >
                    <Upload size={28} className='text-muted' aria-hidden />
                    <div className='flex flex-col gap-1'>
                        <p className='text-subtitle'>Arraste fotos aqui</p>
                        <p className='text-caption text-muted'>
                            ou escolha do seu aparelho · JPG, PNG ou WEBP de até {DOACAO.fotos.tamanhoMaximoMb} MB
                        </p>
                    </div>
                    <Button variant='outline' icon={<ImagePlus size={18} aria-hidden />} onClick={() => seletor.current?.click()}>
                        Escolher fotos
                    </Button>
                    <input
                        ref={seletor}
                        type='file'
                        accept={DOACAO.fotos.tiposPermitidos.join(',')}
                        multiple
                        hidden
                        data-testid='seletor-fotos'
                        onChange={(evento) => {
                            void adicionarFotos([...(evento.target.files ?? [])]);
                            evento.target.value = '';
                        }}
                    />
                </div>
            )}

            {erro && <p role='alert' className='text-caption-medium leading-snug text-danger'>{erro}</p>}

            {(fotos.length > 0 || enviandoFotos > 0) && (
                <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3' aria-label='Fotos adicionadas'>
                    {fotos.map((foto, indice) => (
                        <li key={foto.id} className='group relative aspect-square overflow-hidden rounded-xl border border-border/15 bg-background'>
                            <img src={foto.url} alt={`Foto ${indice + 1}${indice === 0 ? ' (capa)' : ''}`} className='size-full object-cover' />
                            {indice === 0 && (
                                <span className='absolute bottom-2 left-2 rounded-full bg-foreground px-2.5 py-1 text-caption-bold text-surface'>Capa</span>
                            )}
                            <div className='absolute top-2 right-2 flex gap-1.5'>
                                {indice > 0 && (
                                    <button
                                        type='button'
                                        onClick={() => tornarCapa(foto.id)}
                                        aria-label={`Usar a foto ${indice + 1} como capa`}
                                        title='Usar como capa'
                                        className='rounded-full bg-surface/90 p-1.5 shadow hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent'
                                    >
                                        <Star size={16} aria-hidden />
                                    </button>
                                )}
                                <button
                                    type='button'
                                    onClick={() => remover(foto.id)}
                                    disabled={removendo === foto.id}
                                    aria-label={`Remover a foto ${indice + 1}`}
                                    title='Remover'
                                    className='rounded-full bg-surface/90 p-1.5 shadow hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50'
                                >
                                    {removendo === foto.id ? <LoaderCircle size={16} className='animate-spin' aria-hidden /> : <X size={16} aria-hidden />}
                                </button>
                            </div>
                        </li>
                    ))}
                    {Array.from({ length: enviandoFotos }, (_, i) => (
                        <li key={`enviando-${i}`} className='flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border/15 bg-background text-caption text-muted'>
                            <LoaderCircle size={24} className='animate-spin' aria-hidden />
                            Enviando…
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PhotoUploader;
