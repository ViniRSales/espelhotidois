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
