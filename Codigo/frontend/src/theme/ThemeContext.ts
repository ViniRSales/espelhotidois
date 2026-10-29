import { createContext } from 'react';

import type { ThemeName, ThemeTokens } from './themes';

export interface ThemeContextValue {
    /** Nome do tema ativo. */
    themeName: ThemeName;
    /** Tokens do tema ativo, para uso em código quando uma classe não basta. */
    tokens: ThemeTokens;
    /** Troca o tema ativo. */
    setTheme: (theme: ThemeName) => void;
}

/** Contexto do tema. Use `useTheme` em vez de ler direto. */
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
