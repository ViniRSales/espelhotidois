import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import TagInput from './TagInput';

function Exemplo({ inicial = [] as string[], sugestoes = [] as string[] }) {
    const [tags, setTags] = useState(inicial);
    return <TagInput label='Tags' value={tags} onChange={setTags} max={3} suggestions={sugestoes} />;
}

describe('TagInput', () => {
    it('adiciona com Enter, em minúsculas e sem espaços sobrando', async () => {
        render(<Exemplo />);

        await userEvent.type(screen.getByRole('textbox'), '  Inverno  {Enter}');

        expect(screen.getByRole('list', { name: 'Tags adicionadas' })).toHaveTextContent('inverno');
        expect(screen.getByRole('textbox')).toHaveValue('');
        expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('não repete tag e avisa', async () => {
        render(<Exemplo inicial={['lã']} />);

        await userEvent.type(screen.getByRole('textbox'), 'LÃ{Enter}');

        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        expect(screen.getByText('Essa tag já foi adicionada.')).toBeInTheDocument();
    });

    it('recusa tag curta demais', async () => {
        render(<Exemplo />);

        await userEvent.type(screen.getByRole('textbox'), 'a{Enter}');

        expect(screen.queryByRole('list', { name: 'Tags adicionadas' })).not.toBeInTheDocument();
        expect(screen.getByText('Cada tag precisa ter de 2 a 30 caracteres.')).toBeInTheDocument();
    });

    it('remove pelo botão da tag', async () => {
        render(<Exemplo inicial={['inverno', 'lã']} />);

        await userEvent.click(screen.getByRole('button', { name: 'Remover a tag inverno' }));

        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        expect(screen.getByText('lã')).toBeInTheDocument();
    });

    it('adiciona sugestão com um clique e esconde as já usadas', async () => {
        render(<Exemplo inicial={['frio']} sugestoes={['frio', 'Cachecol']} />);

        expect(screen.queryByRole('button', { name: 'Adicionar a tag frio' })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Adicionar a tag cachecol' }));

        expect(screen.getByRole('list', { name: 'Tags adicionadas' })).toHaveTextContent('cachecol');
    });

    it('desativa o campo ao chegar no limite', () => {
        render(<Exemplo inicial={['a1', 'b2', 'c3']} sugestoes={['d4']} />);

        expect(screen.getByRole('textbox')).toBeDisabled();
        expect(screen.queryByText('Sugestões')).not.toBeInTheDocument();
    });
});
