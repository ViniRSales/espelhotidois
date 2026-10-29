import clsx from 'clsx';
import { Check } from 'lucide-react';
import { Fragment } from 'react';

interface ProgressStepperProps {
    steps: string[];
    /** Etapa atual, começando em 1. */
    currentStep: number;
    /** Maior etapa já visitada; até ela as etapas podem ser clicadas. */
    maxStep?: number;
    onStepClick?: (step: number) => void;
}

/** Indicador de progresso de um fluxo em etapas. Até 1024 px, mostra só os círculos e o nome da etapa atual. */
function ProgressStepper({ steps, currentStep, maxStep = currentStep, onStepClick }: ProgressStepperProps) {
    return (
        <nav aria-label='Etapas' className='flex flex-col gap-3'>
            <ol className='flex items-center gap-2 md:gap-3'>
                {steps.map((label, indice) => {
                    const step = indice + 1;
                    const concluida = step < currentStep;
                    const atual = step === currentStep;
                    const clicavel = onStepClick && !atual && step <= maxStep;
                    const conteudo = (
                        <>
                            <span
                                aria-hidden
                                className={clsx(
                                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-label',
                                    concluida || atual
                                        ? 'border-foreground bg-foreground text-surface'
                                        : 'border-border/40 bg-surface text-muted',
                                )}
                            >
                                {concluida ? <Check size={16} strokeWidth={3} /> : step}
                            </span>
                            <span className={clsx('hidden whitespace-nowrap text-label lg:inline', !concluida && !atual && 'text-muted', atual && 'font-semibold')}>
                                {label}
                            </span>
                            <span className='sr-only'>
                                {`Etapa ${step} de ${steps.length}: ${label}${concluida ? ', concluída' : ''}`}
                            </span>
                        </>
                    );

                    return (
                        <Fragment key={label}>
                            {indice > 0 && (
                                <li aria-hidden className={clsx('h-px min-w-3 flex-1', step <= currentStep ? 'bg-foreground' : 'bg-border/25')} />
                            )}
                            <li aria-current={atual ? 'step' : undefined} className='flex items-center'>
                                {clicavel ? (
                                    <button
                                        type='button'
                                        onClick={() => onStepClick(step)}
                                        className='flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
                                    >
                                        {conteudo}
                                    </button>
                                ) : (
                                    <span className='flex items-center gap-2'>{conteudo}</span>
                                )}
                            </li>
                        </Fragment>
                    );
                })}
            </ol>
            <p className='text-label text-muted lg:hidden' aria-hidden>
                Etapa {currentStep} de {steps.length}: <span className='text-foreground'>{steps[currentStep - 1]}</span>
            </p>
        </nav>
    );
}

export default ProgressStepper;
