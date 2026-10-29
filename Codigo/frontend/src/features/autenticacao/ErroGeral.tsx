import { CircleAlert } from 'lucide-react';

/**
 * Erro que não é de um campo (senha errada, sem conexão). Anunciado pelo leitor de tela (`role="alert"`)
 * e focável, para o foco ir até ele depois do envio.
 */
function ErroGeral({ mensagem }: { mensagem: string }) {
    return (
        <div
            role='alert'
            tabIndex={-1}
            data-erro-geral
            className='flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/5 p-4 text-body leading-snug text-danger outline-none'
        >
            <CircleAlert size={18} className='mt-px shrink-0' aria-hidden />
            <p>{mensagem}</p>
        </div>
    );
}

export default ErroGeral;
