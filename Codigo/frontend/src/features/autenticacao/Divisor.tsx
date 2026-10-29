/** Linha com um texto no meio, como "Novo no Doapp?" entre o login e o cadastro. */
function Divisor({ children }: { children: string }) {
    return (
        <div className='flex items-center gap-3 text-body text-muted'>
            <span aria-hidden className='h-px flex-1 bg-border/15' />
            <p>{children}</p>
            <span aria-hidden className='h-px flex-1 bg-border/15' />
        </div>
    );
}

export default Divisor;
