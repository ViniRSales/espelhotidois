import TextArea from '@/components/Field/TextArea';
import TextField from '@/components/Field/TextField';
import { DOACAO } from '@/config/doacao';

import PhotoUploader from '../PhotoUploader';
import { useCadastroDoacao } from '../useCadastroDoacao';

/** Etapa 1: nome, descrição e fotos do item. */
function EtapaNomeMidia() {
    const { estado, alterar } = useCadastroDoacao();
    const { formulario, erros } = estado;

    return (
        <div className='flex flex-col gap-6'>
            <TextField
                label='Nome do item'
                placeholder='Ex.: Cachecol vermelho'
                value={formulario.titulo}
                onChange={(evento) => alterar({ titulo: evento.target.value })}
                maxLength={DOACAO.tituloMaximo}
                showCounter
                autoComplete='off'
                error={erros.titulo}
            />
            <TextArea
                label='Descrição'
                placeholder='Conte como ele é, o tamanho e se tem algum detalhe ou defeito.'
                value={formulario.descricao}
                onChange={(evento) => alterar({ descricao: evento.target.value })}
                maxLength={DOACAO.descricaoMaximo}
                showCounter
                error={erros.descricao}
            />
            <PhotoUploader />
        </div>
    );
}

export default EtapaNomeMidia;
