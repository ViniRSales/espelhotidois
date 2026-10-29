import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import Adicionar from './Adicionar';

describe('Adicionar', () => {
    it('leva ao cadastro de item e ao de pedido', () => {
        render(<MemoryRouter><Adicionar /></MemoryRouter>);

        expect(screen.getByRole('heading', { level: 1, name: 'O que você quer fazer?' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Cadastrar item' })).toHaveAttribute('href', '/adicionar/item');
        expect(screen.getByRole('link', { name: 'Cadastrar pedido' })).toHaveAttribute('href', '/adicionar/pedido');
        expect(screen.getAllByRole('listitem').filter((item) => item.closest('ol'))).toHaveLength(3);
    });
});
