import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import Checkbox from './Checkbox';
import PasswordField from './Field/PasswordField';

describe('PasswordField', () => {
    it('liga rótulo, dica e erro ao campo', () => {
        render(<PasswordField label='Senha' hint='Use pelo menos 8 caracteres.' error='Muito curta.' value='' onChange={() => {}} />);

        const campo = screen.getByLabelText('Senha');
        expect(campo).toHaveAttribute('type', 'password');
        expect(campo).toHaveAttribute('aria-invalid', 'true');
        expect(campo).toHaveAccessibleDescription('Use pelo menos 8 caracteres. Muito curta.');
    });

    it('mostra e oculta a senha sem enviar o formulário', async () => {
        let enviado = false;
        render(
            <form onSubmit={(evento) => { evento.preventDefault(); enviado = true; }}>
                <PasswordField label='Senha' defaultValue='segredo123' />
            </form>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
        expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');

        await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
        expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
        expect(enviado).toBe(false);
    });
});

describe('Checkbox', () => {
    function Controlado() {
        const [marcado, setMarcado] = useState(false);
        return <Checkbox label='Manter conectado' description='Por 7 dias.' checked={marcado} onChange={(e) => setMarcado(e.target.checked)} />;
    }

    it('funciona pelo rótulo e pelo teclado, com a descrição ligada', async () => {
        render(<Controlado />);
        const caixa = screen.getByRole('checkbox', { name: 'Manter conectado' });
        expect(caixa).toHaveAccessibleDescription('Por 7 dias.');

        await userEvent.click(screen.getByText('Manter conectado'));
        expect(caixa).toBeChecked();

        caixa.focus();
        await userEvent.keyboard(' ');
        expect(caixa).not.toBeChecked();
    });
});
