import TextArea from '@/components/Field/TextArea';
import TextField from '@/components/Field/TextField';
import { SOLICITACAO } from '@/config/solicitacao';

import type { AlterarCampo, Erros, Formulario } from './formulario';
import SeletorFoto from './SeletorFoto';

interface EtapaOQuePrecisaProps {
    formulario: Formulario;
    erros: Erros;
    alterar: AlterarCampo;
}

function EtapaOQuePrecisa({ formulario, erros, alterar }: EtapaOQuePrecisaProps) {
    return (
        <>
            <TextField
                label='Título'
                value={formulario.titulo}
                onChange={(evento) => alterar('titulo', evento.target.value)}
                maxLength={SOLICITACAO.tituloMaximo}
                showCounter
                error={erros.titulo}
                hint='Ex.: “casaco infantil tamanho 8” ajuda mais que “roupas”.'
            />
            <TextArea
                label='Descrição'
                optional
                rows={5}
                value={formulario.descricao}
                onChange={(evento) => alterar('descricao', evento.target.value)}
                maxLength={SOLICITACAO.descricaoMaximo}
                showCounter
                error={erros.descricao}
                hint='Para quem é, tamanho, quantidade… Não escreva telefone nem endereço: a conversa acontece pelo Doapp.'
            />
            <SeletorFoto foto={formulario.foto} erro={erros.foto} aoMudar={(foto) => alterar('foto', foto)} />
        </>
    );
}

export default EtapaOQuePrecisa;
