import { LoaderCircle } from 'lucide-react';

function VerificandoSessao() {
    return (
        <p role='status' className='flex items-center justify-center gap-2 py-16 text-body text-muted'>
            <LoaderCircle size={18} className='animate-spin' aria-hidden />
            Carregando…
        </p>
    );
}

export default VerificandoSessao;
