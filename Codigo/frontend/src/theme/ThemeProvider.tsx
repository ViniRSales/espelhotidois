import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

import { ThemeContext, type ThemeContextValue } from './ThemeContext';
import { defaultTheme, themes, type ThemeName } from './themes';

interface ThemeProviderProps {
    /** Árvore de componentes que terá acesso ao tema. */
    children: ReactNode;
}

/** Converte o nome de um token em variável CSS. Ex.: `fontDisplay` vira `--theme-font-display`. */
function toCssVariable(token: string): string {
    return `--theme-${token.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;
}

/**
 * Mantém o tema ativo e aplica os tokens dele como variáveis CSS no elemento raiz,
 * além do `color-scheme` e do atributo `data-theme`.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
    const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
    const { colorScheme, tokens } = themes[themeName];

    // Efeito de layout: evita um frame com o tema antigo ao trocar de tema.
    useLayoutEffect(() => {
        const root = document.documentElement;

        for (const [token, value] of Object.entries(tokens)) {
            root.style.setProperty(toCssVariable(token), value);
        }

        root.style.colorScheme = colorScheme;
        root.dataset.theme = themeName;
    }, [colorScheme, themeName, tokens]);

    const value = useMemo<ThemeContextValue>(
        () => ({ themeName, tokens, setTheme: setThemeName }),
        [themeName, tokens]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
