import Button from '@/components/Button/Button';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ConfirmarSaidaDialogProps {
    open: boolean;
    /** Ação em andamento, para mostrar o carregamento no botão certo. */
    ocupado: 'descartar' | 'manter' | null;
    erro?: string | null;
    onCancelar: () => void;
    onDescartar: () => void;
    onManter: () => void;
}

/** Pergunta, ao sair do cadastro, se o rascunho deve ser descartado. */
function ConfirmarSaidaDialog({ open, ocupado, erro, onCancelar, onDescartar, onManter }: ConfirmarSaidaDialogProps) {
    return (
        <ConfirmDialog
            open={open}
            title='Deseja descartar o rascunho?'
            description='Se você mantiver, ele fica salvo para continuar depois.'
            onCancel={onCancelar}
        >
            {erro && <p role='alert' className='text-body leading-snug text-danger sm:mr-auto sm:self-center'>{erro}</p>}
            <Button variant='link' onClick={onCancelar} disabled={ocupado !== null}>Cancelar</Button>
            <Button variant='outline' onClick={onManter} loading={ocupado === 'manter'} disabled={ocupado !== null}>
                Não, manter rascunho
            </Button>
            <Button onClick={onDescartar} loading={ocupado === 'descartar'} disabled={ocupado !== null}>
                Sim, descartar
            </Button>
        </ConfirmDialog>
    );
}

export default ConfirmarSaidaDialog;
