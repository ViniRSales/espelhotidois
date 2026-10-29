import type { ReactNode, Ref } from 'react';

interface CartaoAutenticacaoProps {
    titulo: string;
    descricao?: ReactNode;
    /** Para levar o foco ao título quando a tela muda sem trocar de rota (ex.: "Confira seu e-mail"). */
    tituloRef?: Ref<HTMLHeadingElement>;
    children: ReactNode;
}

/** Título centralizado e coluna estreita do formulário, igual em todas as telas de autenticação. */
function CartaoAutenticacao({ titulo, descricao, tituloRef, children }: CartaoAutenticacaoProps) {
    return (
        <section aria-labelledby='titulo-autenticacao' className='flex w-full max-w-100 flex-col gap-6'>
            <div className='flex flex-col gap-3 text-center'>
                <h1 id='titulo-autenticacao' ref={tituloRef} tabIndex={-1} className='text-title-1 leading-tight outline-none'>
                    {titulo}
                </h1>
                {descricao && <p className='text-body-l leading-snug text-muted'>{descricao}</p>}
            </div>
            {children}
        </section>
    );
}

export default CartaoAutenticacao;
