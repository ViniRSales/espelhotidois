import clsx from 'clsx';
import { MapPin } from 'lucide-react';
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react';

import { buscarBairros, formatarLocal, type LocalSugerido } from '@/services/localizacao';

import Field from './Field';
import { fieldDescriptionIds, inputClasses } from './fieldIds';

/** A busca começa com 3 letras e espera a pessoa parar de digitar, para não sobrecarregar o serviço de mapas. */
const MINIMO_BUSCA = 3;
const ESPERA_BUSCA_MS = 300;

interface LocationFieldProps {
    label: string;
    hint?: string;
    placeholder?: string;
    error?: string;
    /** Bairro escolhido na lista; `null` enquanto a pessoa só digitou. */
    value: LocalSugerido | null;
    onChange: (local: LocalSugerido | null) => void;
    /** Botão na linha do rótulo, à direita (por exemplo, "Usar minha localização"). */
    action?: ReactNode;
}

type Resultado = { termo: string; sugestoes: LocalSugerido[]; falhou: boolean };

/**
 * Campo único de bairro: a pessoa digita e escolhe uma sugestão, que já vem separada em bairro, cidade e UF.
 * Segue o padrão "combobox com lista" da WAI-ARIA: setas para navegar, Enter para escolher, Esc para fechar.
 */
function LocationField({ label, hint, placeholder, error, value, onChange, action }: LocationFieldProps) {
    const id = useId();
    const listaId = `${id}-lista`;
    const { describedBy } = fieldDescriptionIds(id, { hint, error });

    const [texto, setTexto] = useState(value ? formatarLocal(value) : '');
    // Um bairro escolhido de fora (pela localização atual) também aparece escrito no campo.
    const [valorMostrado, setValorMostrado] = useState(value);
    if (value !== valorMostrado) {
        setValorMostrado(value);
        if (value) setTexto(formatarLocal(value));
    }
    const [aberto, setAberto] = useState(false);
    const [ativo, setAtivo] = useState(-1);
    const [resultado, setResultado] = useState<Resultado | null>(null);

    const termo = texto.trim();
    const buscavel = !value && termo.length >= MINIMO_BUSCA;

    useEffect(() => {
        if (!buscavel) return;
        const controle = new AbortController();
        const timer = window.setTimeout(() => {
            buscarBairros(termo, controle.signal)
                .then((sugestoes) => setResultado({ termo, sugestoes, falhou: false }))
                .catch(() => {
                    if (!controle.signal.aborted) setResultado({ termo, sugestoes: [], falhou: true });
                });
        }, ESPERA_BUSCA_MS);
        return () => {
            window.clearTimeout(timer);
            controle.abort();
        };
    }, [buscavel, termo]);

    // Só vale o resultado da busca feita para o texto que está no campo agora.
    const atual = buscavel && resultado?.termo === termo ? resultado : null;
    const sugestoes = atual?.sugestoes ?? [];
    const listaAberta = aberto && sugestoes.length > 0;
    const indiceAtivo = ativo < sugestoes.length ? ativo : -1;

    let situacao: { texto: string; visivel: boolean } | null = null;
    if (aberto && buscavel) {
        if (!atual) situacao = { texto: 'Buscando bairros…', visivel: true };
        else if (atual.falhou) situacao = { texto: 'Não conseguimos buscar agora. Tente de novo em instantes.', visivel: true };
        else if (sugestoes.length === 0) situacao = { texto: 'Nenhum bairro encontrado. Tente só o nome do bairro.', visivel: true };
        else {
            const quantidade = sugestoes.length === 1 ? '1 sugestão' : `${sugestoes.length} sugestões`;
            situacao = { texto: `${quantidade}. Use as setas para escolher.`, visivel: false };
        }
    }

    function escolher(local: LocalSugerido) {
        onChange(local);
        setTexto(formatarLocal(local));
        setAberto(false);
        setAtivo(-1);
    }

    function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
        if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
            evento.preventDefault();
            if (!listaAberta) {
                setAberto(true);
                return;
            }
            const passo = evento.key === 'ArrowDown' ? 1 : -1;
            setAtivo((indiceAtivo + passo + sugestoes.length) % sugestoes.length);
        } else if (evento.key === 'Enter' && listaAberta && indiceAtivo >= 0) {
            // Escolhe a sugestão em vez de enviar o formulário.
            evento.preventDefault();
            escolher(sugestoes[indiceAtivo]);
        } else if (evento.key === 'Escape' && aberto) {
            evento.preventDefault();
            setAberto(false);
        }
    }

    return (
        <Field id={id} label={label} hint={hint} error={error} action={action}>
            <div className='relative'>
                <input
                    id={id}
                    type='text'
                    role='combobox'
                    autoComplete='off'
                    spellCheck={false}
                    aria-autocomplete='list'
                    aria-expanded={listaAberta}
                    aria-controls={listaId}
                    aria-activedescendant={indiceAtivo >= 0 ? `${listaId}-${indiceAtivo}` : undefined}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    placeholder={placeholder}
                    value={texto}
                    onChange={(evento) => {
                        setTexto(evento.target.value);
                        setAberto(true);
                        setAtivo(-1);
                        if (value) onChange(null);
                    }}
                    onKeyDown={aoTeclar}
                    onBlur={() => setAberto(false)}
                    className={inputClasses(error)}
                />
                <ul
                    id={listaId}
                    role='listbox'
                    aria-label={`Sugestões de ${label.toLocaleLowerCase('pt-BR')}`}
                    hidden={!listaAberta}
                    className='absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border/25 bg-surface py-1 shadow-lg'
                >
                    {sugestoes.map((local, indice) => (
                        <li
                            key={formatarLocal(local)}
                            id={`${listaId}-${indice}`}
                            role='option'
                            aria-selected={indice === indiceAtivo}
                            // Mantém o foco no campo ao clicar, para o blur não fechar a lista antes do clique.
                            onMouseDown={(evento) => evento.preventDefault()}
                            onClick={() => escolher(local)}
                            className={clsx(
                                'flex cursor-pointer items-start gap-3 px-4 py-2.5',
                                indice === indiceAtivo ? 'bg-background' : 'hover:bg-background',
                            )}
                        >
                            <MapPin size={18} className='mt-0.5 shrink-0 text-muted' aria-hidden />
                            <span className='flex flex-col'>
                                <span className='text-body-l'>{local.bairro}</span>
                                <span className='text-caption text-muted'>{local.cidade}, {local.uf}</span>
                            </span>
                        </li>
                    ))}
                    <li role='presentation' className='px-4 pt-1.5 text-right text-caption text-muted'>
                        Dados © OpenStreetMap
                    </li>
                </ul>
            </div>
            <p role='status' className={clsx('text-caption leading-snug text-muted', !situacao?.visivel && 'sr-only')}>
                {situacao?.texto}
            </p>
        </Field>
    );
}

export default LocationField;
