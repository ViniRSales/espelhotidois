import { LoaderCircle } from 'lucide-react';

import ChipGroup from '@/components/ChipGroup';
import TextField from '@/components/Field/TextField';
import TagInput from '@/components/TagInput';
import Toggle from '@/components/Toggle';
import { DOACAO } from '@/config/doacao';

import { sugestoesDeTags } from '../sugestoesTags';
import { useCadastroDoacao } from '../useCadastroDoacao';
import { hojeLocal } from '../validacao';

/** Etapa 2: categoria, tags e, para alimentos, a validade. */
function EtapaCategorias() {
    const { estado, alterar, categorias, carregandoCategorias, categoriaEscolhida, ehAlimento } = useCadastroDoacao();
    const { formulario, erros } = estado;

    return (
        <div className='flex flex-col gap-8'>
            {carregandoCategorias ? (
                <p role='status' className='flex items-center gap-2 text-body text-muted'>
                    <LoaderCircle size={18} className='animate-spin' aria-hidden />
                    Carregando categorias…
                </p>
            ) : (
                <ChipGroup
                    legend='Categoria'
                    hint='Escolha a categoria principal.'
                    name='categoria'
                    options={categorias.map((categoria) => ({ value: categoria.id, label: categoria.nome }))}
                    value={formulario.categoriaId}
                    onChange={(categoriaId) => alterar({ categoriaId })}
                    error={erros.categoriaId}
                />
            )}

            {ehAlimento && (
                <section aria-label='Validade' className='flex flex-col gap-4 rounded-xl bg-highlight/15 p-4'>
                    <Toggle
                        label='Não perecível'
                        description='Ligue para itens que não estragam, como grãos e enlatados lacrados.'
                        checked={formulario.naoPerecivel}
                        onChange={(naoPerecivel) => alterar({ naoPerecivel, ...(naoPerecivel && { validade: '' }) })}
                    />
                    <TextField
                        type='date'
                        label='Data de validade'
                        hint={formulario.naoPerecivel ? 'Não é preciso informar para itens não perecíveis.' : 'Alimentos perecíveis precisam da validade.'}
                        min={hojeLocal()}
                        value={formulario.validade}
                        onChange={(evento) => alterar({ validade: evento.target.value })}
                        disabled={formulario.naoPerecivel}
                        error={erros.validade}
                    />
                </section>
            )}

            <TagInput
                label='Tags'
                hint='Palavras que descrevem o item. Aperte Enter para adicionar.'
                placeholder='Digite uma tag…'
                value={formulario.tags}
                onChange={(tags) => alterar({ tags })}
                max={DOACAO.tagsMaximo}
                minLength={DOACAO.tagMinimo}
                maxLength={DOACAO.tagMaximo}
                suggestions={sugestoesDeTags(categoriaEscolhida?.nome)}
                error={erros.tags}
            />
        </div>
    );
}

export default EtapaCategorias;
