import ChipGroup from '@/components/ChipGroup';
import FieldGroup from '@/components/Field/FieldGroup';
import TextField from '@/components/Field/TextField';
import OptionCard from '@/components/OptionCard';
import { SOLICITACAO } from '@/config/solicitacao';
import type { Categoria } from '@/services/categorias';
import { URGENCIAS } from '@/types/solicitacao';

import type { AlterarCampo, Erros, Formulario } from './formulario';

interface EtapaCategoriaUrgenciaProps {
    formulario: Formulario;
    erros: Erros;
    alterar: AlterarCampo;
    categorias: Categoria[];
    carregandoCategorias: boolean;
    erroCategorias: string | null;
}

function EtapaCategoriaUrgencia({
    formulario,
    erros,
    alterar,
    categorias,
    carregandoCategorias,
    erroCategorias,
}: EtapaCategoriaUrgenciaProps) {
    return (
        <>
            {carregandoCategorias ? (
                <p role='status' className='text-body text-muted'>Carregando categorias…</p>
            ) : (
                <ChipGroup
                    legend='Categoria'
                    hint='Escolha a categoria principal.'
                    error={erros.categoriaId ?? erroCategorias ?? undefined}
                    name='categoria'
                    options={categorias.map((categoria) => ({ value: categoria.id, label: categoria.nome }))}
                    value={formulario.categoriaId}
                    onChange={(valor) => alterar('categoriaId', valor)}
                />
            )}

            <FieldGroup
                legend='Para quando você precisa?'
                hint='Pedidos urgentes aparecem em destaque. Escolha o que for mais verdadeiro para você.'
                error={erros.urgencia}
                className='grid gap-3 sm:grid-cols-3'
            >
                {URGENCIAS.map((urgencia) => (
                    <OptionCard
                        key={urgencia.valor}
                        type='radio'
                        name='urgencia'
                        value={urgencia.valor}
                        title={urgencia.rotulo}
                        description={urgencia.descricao}
                        checked={formulario.urgencia === urgencia.valor}
                        onChange={() => alterar('urgencia', urgencia.valor)}
                    />
                ))}
            </FieldGroup>

            <FieldGroup
                legend='Onde você está (opcional)'
                hint='Ajuda a encontrar doadores perto de você. Só o bairro e a cidade aparecem, nunca o seu endereço.'
                className='grid gap-4 sm:grid-cols-2'
            >
                <TextField
                    label='Bairro'
                    value={formulario.bairro}
                    onChange={(evento) => alterar('bairro', evento.target.value)}
                    maxLength={SOLICITACAO.localMaximo}
                    error={erros.bairro}
                    autoComplete='address-level3'
                />
                <TextField
                    label='Cidade'
                    value={formulario.cidade}
                    onChange={(evento) => alterar('cidade', evento.target.value)}
                    maxLength={SOLICITACAO.localMaximo}
                    error={erros.cidade}
                    autoComplete='address-level2'
                />
            </FieldGroup>
        </>
    );
}

export default EtapaCategoriaUrgencia;
