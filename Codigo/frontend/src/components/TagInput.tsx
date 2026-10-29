import { X } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';

import Field from './Field/Field';
import { fieldDescriptionIds, inputClasses } from './Field/fieldIds';

interface TagInputProps {
    label: string;
    hint?: string;
    error?: string;
    value: string[];
    onChange: (tags: string[]) => void;
    /** Quantidade máxima de tags. */
    max: number;
    minLength?: number;
    maxLength?: number;
    /** Tags sugeridas; as já adicionadas não aparecem. */
    suggestions?: string[];
    placeholder?: string;
}

const SUGESTOES_VISIVEIS = 4;

/** Normaliza como o back-end: minúsculas, sem espaços nas pontas nem repetidos. */
function normalizar(tag: string) {
    return tag.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

/** Campo de tags: Enter adiciona, o × remove e as sugestões entram com um clique. */
function TagInput({
    label, hint, error, value, onChange, max, minLength = 2, maxLength = 30, suggestions = [], placeholder,
}: TagInputProps) {
    const id = useId();
    const [texto, setTexto] = useState('');
    const [aviso, setAviso] = useState<string>();
    const erro = error ?? aviso;
    const { describedBy } = fieldDescriptionIds(id, { hint, error: erro });
    const cheio = value.length >= max;
    const sugestoes = suggestions
        .map(normalizar)
        .filter((tag, i, todas) => !value.includes(tag) && todas.indexOf(tag) === i)
        .slice(0, SUGESTOES_VISIVEIS);

    function adicionar(bruta: string) {
        const tag = normalizar(bruta);
        if (!tag) return;
        if (value.includes(tag)) {
            setAviso('Essa tag já foi adicionada.');
        } else if (cheio) {
            setAviso(`Você já adicionou ${max} tags.`);
        } else if (tag.length < minLength || tag.length > maxLength) {
            setAviso(`Cada tag precisa ter de ${minLength} a ${maxLength} caracteres.`);
        } else {
            onChange([...value, tag]);
            setTexto('');
            setAviso(undefined);
        }
    }

    function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            adicionar(texto);
        }
    }

    return (
        <Field id={id} label={label} optional hint={hint} counter={`${value.length}/${max}`} error={erro}>
            <input
                id={id}
                type='text'
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                onKeyDown={aoTeclar}
                maxLength={maxLength}
                disabled={cheio}
                placeholder={cheio ? `Limite de ${max} tags` : placeholder}
                aria-invalid={erro ? true : undefined}
                aria-describedby={describedBy}
                className={inputClasses(erro)}
            />

            {value.length > 0 && (
                <ul className='flex flex-wrap gap-2' aria-label='Tags adicionadas'>
                    {value.map((tag) => (
                        <li key={tag} className='inline-flex items-center gap-1 rounded-full bg-foreground py-1.5 pl-3 pr-1.5 text-label text-surface'>
                            {tag}
                            <button
                                type='button'
                                onClick={() => onChange(value.filter((t) => t !== tag))}
                                aria-label={`Remover a tag ${tag}`}
                                className='rounded-full p-0.5 hover:bg-surface/20 focus-visible:outline-2 focus-visible:outline-accent'
                            >
                                <X size={14} aria-hidden />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {!cheio && sugestoes.length > 0 && (
                <div className='flex flex-col gap-2'>
                    <span className='text-caption text-muted'>Sugestões</span>
                    <div className='flex flex-wrap gap-2'>
                        {sugestoes.map((tag) => (
                            <button
                                key={tag}
                                type='button'
                                onClick={() => adicionar(tag)}
                                aria-label={`Adicionar a tag ${tag}`}
                                className='rounded-full border border-border/40 bg-surface px-3 py-1.5 text-label hover:border-border focus-visible:outline-2 focus-visible:outline-accent'
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Field>
    );
}

export default TagInput;
