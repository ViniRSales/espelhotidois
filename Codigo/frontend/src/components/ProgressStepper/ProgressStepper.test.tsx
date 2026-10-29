import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ProgressStepper from './ProgressStepper';

const ETAPAS = ['Nome e mídia', 'Categorias', 'Detalhes', 'Localização', 'Revisar e publicar'];

describe('ProgressStepper', () => {
    it('marca a etapa atual e as concluídas', () => {
        render(<ProgressStepper steps={ETAPAS} currentStep={3} />);

        const atual = screen.getByText('Etapa 3 de 5: Detalhes').closest('li');
        expect(atual).toHaveAttribute('aria-current', 'step');
        expect(screen.getByText('Etapa 1 de 5: Nome e mídia, concluída')).toBeInTheDocument();
        expect(screen.getByText('Etapa 4 de 5: Localização')).toBeInTheDocument();
    });

    it('deixa clicar só nas etapas já visitadas', async () => {
        const aoClicar = vi.fn();
        render(<ProgressStepper steps={ETAPAS} currentStep={2} maxStep={4} onStepClick={aoClicar} />);

        await userEvent.click(screen.getByRole('button', { name: /Etapa 1 de 5/ }));
        await userEvent.click(screen.getByRole('button', { name: /Etapa 4 de 5/ }));

        expect(aoClicar.mock.calls).toEqual([[1], [4]]);
        expect(screen.queryByRole('button', { name: /Etapa 2 de 5/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Etapa 5 de 5/ })).not.toBeInTheDocument();
    });

    it('sem onStepClick nenhuma etapa é botão', () => {
        render(<ProgressStepper steps={ETAPAS} currentStep={5} />);

        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
});
