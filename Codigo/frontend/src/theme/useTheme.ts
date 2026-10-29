import { useContext } from 'react';

import { ThemeContext, type ThemeContextValue } from './ThemeContext';

/**
 * Lê o tema ativo e a função para trocá-lo.
 *
 * @returns O valor do contexto do tema.
 * @throws Se for chamado fora do `ThemeProvider`.
 */
export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
    }

    return context;
}
