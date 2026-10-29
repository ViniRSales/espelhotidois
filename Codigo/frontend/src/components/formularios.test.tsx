import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ChipGroup from './ChipGroup';
import ConfirmDialog from './ConfirmDialog';
import TextField from './Field/TextField';
import OptionCard from './OptionCard';
import Toggle from './Toggle';

describe('TextField', () => {
    it('liga rótulo, contador e erro ao campo', () => {
        render(<TextField label='Nome do item' value='Cachecol' onChange={() => {}} maxLength={90} showCounter error='Nome curto' />);

        const campo = screen.getByLabelText('Nome do item');
        expect(campo).toHaveAttribute('aria-invalid', 'true');
        expect(campo).toHaveAccessibleDescription('Nome curto');
        expect(screen.getByText('8/90')).toBeInTheDocument();
    });
});

describe('ChipGroup', () => {
    it('escolhe uma opção', async () => {
        const aoMudar = vi.fn();
        render(
            <ChipGroup legend='Categoria' name='categoria' value='a' onChange={aoMudar}
                options={[{ value: 'a', label: 'Roupas' }, { value: 'b', label: 'Móveis' }]} />,
        );

        expect(screen.getByRole('radio', { name: 'Roupas' })).toBeChecked();
        await userEvent.click(screen.getByText('Móveis'));

        expect(aoMudar).toHaveBeenCalledWith('b');
    });
});

describe('OptionCard', () => {
    it('funciona como checkbox com título e descrição', async () => {
        const aoMudar = vi.fn();
        render(<OptionCard type='checkbox' name='entrega' value='A_COMBINAR' title='A combinar'
            description='Vocês decidem pelo bate-papo' checked={false} onChange={aoMudar} />);

        await userEvent.click(screen.getByRole('checkbox', { name: /A combinar/ }));

        expect(aoMudar).toHaveBeenCalledWith(true);
    });
});

describe('Toggle', () => {
    it('alterna o estado', async () => {
        const aoMudar = vi.fn();
        render(<Toggle label='Não perecível' checked={false} onChange={aoMudar} />);

        const interruptor = screen.getByRole('switch', { name: 'Não perecível' });
        expect(interruptor).toHaveAttribute('aria-checked', 'false');
        await userEvent.click(interruptor);

        expect(aoMudar).toHaveBeenCalledWith(true);
    });
});

describe('ConfirmDialog', () => {
    it('abre como modal e chama onCancel no Esc', () => {
        const aoCancelar = vi.fn();
        const { rerender } = render(
            <ConfirmDialog open title='Deseja descartar o rascunho?' onCancel={aoCancelar}>
                <button type='button'>Sim</button>
            </ConfirmDialog>,
        );

        const dialogo = screen.getByRole('dialog', { name: 'Deseja descartar o rascunho?' });
        expect(dialogo).toHaveAttribute('open');
        fireEvent(dialogo, new Event('cancel', { cancelable: true }));
        expect(aoCancelar).toHaveBeenCalled();

        rerender(
            <ConfirmDialog open={false} title='Deseja descartar o rascunho?' onCancel={aoCancelar}>
                <button type='button'>Sim</button>
            </ConfirmDialog>,
        );
        expect(dialogo).not.toHaveAttribute('open');
    });
});
