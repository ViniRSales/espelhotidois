import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { buttonClasses } from '@/components/Button/buttonStyles';
import PageHeader from '@/components/PageHeader';
import ProgressStepper from '@/components/ProgressStepper/ProgressStepper';

import { useCadastroDoacao } from './useCadastroDoacao';
import { ETAPAS } from './validacao';

interface CadastroLayoutProps {
    children: ReactNode;
    /** Coluna lateral (prévia e dicas); sem ela, o conteúdo ocupa a largura toda. */
    lateral?: ReactNode;
}

/** Moldura do assistente: cabeçalho com "Cancelar", indicador de etapas e as colunas. */
function CadastroLayout({ children, lateral }: CadastroLayoutProps) {
    const { estado, irParaEtapa } = useCadastroDoacao();

    return (
        <div className='mx-auto flex max-w-6xl flex-col gap-8 py-8'>
            <PageHeader
                title='Cadastrar item para doação'
                backTo='/adicionar'
                actions={<Link to='/adicionar' className={buttonClasses('link')}>Cancelar</Link>}
            />
            <ProgressStepper
                steps={[...ETAPAS]}
                currentStep={estado.etapa}
                maxStep={estado.etapaMaxima}
                onStepClick={irParaEtapa}
            />
            {lateral ? (
                <div className='grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]'>
                    <div className='min-w-0'>{children}</div>
                    <div className='flex flex-col gap-6 lg:sticky lg:top-6'>{lateral}</div>
                </div>
            ) : (
                <div className='mx-auto w-full max-w-3xl'>{children}</div>
            )}
        </div>
    );
}

export default CadastroLayout;
