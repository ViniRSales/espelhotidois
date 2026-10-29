import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as localizacao from '@/services/localizacao';
import type { LocalSugerido } from '@/services/localizacao';

import LocationField from './LocationField';

vi.mock('@/services/localizacao', async (original) => ({
    ...(await original<typeof import('@/services/localizacao')>()),
    buscarBairros: vi.fn(),
}));

const buscarBairros = vi.mocked(localizacao.buscarBairros);

const SAVASSI = { bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG' };
const SAVASSI_DIVINOPOLIS = { bairro: 'Savassi', cidade: 'Divinópolis', uf: 'MG' };

function Exemplo({ aoMudar }: { aoMudar: (local: LocalSugerido | null) => void }) {
    const [local, setLocal] = useState<LocalSugerido | null>(null);
    return (
        <LocationField
            label='Bairro'
            value={local}
            onChange={(novo) => {
                setLocal(novo);
                aoMudar(novo);
            }}
        />
    );
}

function abrir() {
    const aoMudar = vi.fn();
    render(<Exemplo aoMudar={aoMudar} />);
    return { campo: screen.getByRole('combobox', { name: 'Bairro' }), aoMudar };
}

describe('LocationField', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        buscarBairros.mockResolvedValue([SAVASSI, SAVASSI_DIVINOPOLIS]);
    });

    it('só busca a partir de 3 letras', async () => {
        const { campo } = abrir();

        await userEvent.type(campo, 'Sa');
        await new Promise((resolver) => setTimeout(resolver, 400));

        expect(buscarBairros).not.toHaveBeenCalled();
        expect(campo).toHaveAttribute('aria-expanded', 'false');
    });

    it('mostra as sugestões e escolhe com o mouse, separando bairro, cidade e UF', async () => {
        const { campo, aoMudar } = abrir();

        await userEvent.type(campo, 'Sava');
        await userEvent.click(await screen.findByRole('option', { name: /Divinópolis/ }));

        expect(aoMudar).toHaveBeenLastCalledWith(SAVASSI_DIVINOPOLIS);
        expect(campo).toHaveValue('Savassi, Divinópolis - MG');
        expect(campo).toHaveAttribute('aria-expanded', 'false');
        expect(buscarBairros).toHaveBeenCalledWith('Sava', expect.any(AbortSignal));
    });

    it('navega pelas sugestões com as setas e escolhe com Enter', async () => {
        const { campo, aoMudar } = abrir();

        await userEvent.type(campo, 'Sava');
        await screen.findByRole('option', { name: /Belo Horizonte/ });
        expect(screen.getByRole('status')).toHaveTextContent('2 sugestões');

        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(screen.getByRole('option', { name: /Divinópolis/ })).toHaveAttribute('aria-selected', 'true');
        expect(campo.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: /Divinópolis/ }).id);

        await userEvent.keyboard('{Enter}');
        expect(aoMudar).toHaveBeenLastCalledWith(SAVASSI_DIVINOPOLIS);
    });

    it('Esc fecha a lista', async () => {
        const { campo } = abrir();

        await userEvent.type(campo, 'Sava');
        await screen.findByRole('option', { name: /Belo Horizonte/ });
        await userEvent.keyboard('{Escape}');

        expect(campo).toHaveAttribute('aria-expanded', 'false');
    });

    it('editar depois de escolher desfaz a escolha', async () => {
        const { campo, aoMudar } = abrir();

        await userEvent.type(campo, 'Sava');
        await userEvent.click(await screen.findByRole('option', { name: /Belo Horizonte/ }));
        await userEvent.type(campo, '{Backspace}');

        expect(aoMudar).toHaveBeenLastCalledWith(null);
    });

    it('avisa quando não encontra nenhum bairro', async () => {
        buscarBairros.mockResolvedValue([]);
        const { campo } = abrir();

        await userEvent.type(campo, 'xyzw');

        expect(await screen.findByText('Nenhum bairro encontrado. Tente só o nome do bairro.')).toBeInTheDocument();
    });

    it('avisa quando o serviço de mapas falha', async () => {
        buscarBairros.mockRejectedValue(new Error('fora do ar'));
        const { campo } = abrir();

        await userEvent.type(campo, 'Sava');

        expect(await screen.findByText('Não conseguimos buscar agora. Tente de novo em instantes.')).toBeInTheDocument();
    });
});
