import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: ReactNode;
    /** Chamado ao apertar Esc; os botões ficam em `children`. */
    onCancel: () => void;
    children: ReactNode;
}

/** Diálogo modal sobre o `<dialog>` nativo: prende o foco e fecha com Esc. */
function ConfirmDialog({ open, title, description, onCancel, children }: ConfirmDialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const id = useId();

    useEffect(() => {
        const dialogo = ref.current;
        if (!dialogo) return;
        if (open && !dialogo.open) dialogo.showModal();
        if (!open && dialogo.open) dialogo.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-labelledby={`${id}-titulo`}
            aria-describedby={description ? `${id}-descricao` : undefined}
            onCancel={(evento) => {
                evento.preventDefault();
                onCancel();
            }}
            className='m-auto w-[min(34rem,calc(100%-2rem))] rounded-2xl bg-surface p-6 text-foreground shadow-xl backdrop:bg-foreground/40'
        >
            <h2 id={`${id}-titulo`} className='text-title-3 leading-tight'>{title}</h2>
            {description && <div id={`${id}-descricao`} className='mt-3 text-body-l leading-snug text-muted'>{description}</div>}
            <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>{children}</div>
        </dialog>
    );
}

export default ConfirmDialog;
