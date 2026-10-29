/** Nomes dos temas disponíveis. Cada nome precisa ter um tema em `themes`. */
export const themeNames = ['light'] as const;

export type ThemeName = (typeof themeNames)[number];

/** Vocabulário do CSS (`color-scheme`): informa ao navegador se o tema é claro ou escuro. */
export type ColorScheme = 'light' | 'dark';

export interface ThemeTokens {
    /** Background da página. */
    background: string;
    /** Cards, painéis e outras áreas de destaque. */
    surface: string;
    /** Bordas e linhas divisórias. */
    border: string;
    /** Cor do texto principal. */
    foreground: string;
    /** Cor do texto secundário. */
    muted: string;
    /** Cor da marca para links, highlights e botões primários. */
    accent: string;
    /** Cor de texto para ser usada em conjunto com `accent`. */
    accentForeground: string;
    /** Elementos de destaque pequenos, como badges. */
    highlight: string;
    /** Mensagens de erro e campos inválidos. */
    danger: string;
    /** Família de fontes para títulos e o nome. */
    fontDisplay: string;
    /** Família de fontes para navegação e rótulos pequenos. */
    fontLabel: string;
}

/** Definição de um tema: o esquema de cor nativo e os tokens de design. */
export interface ThemeDefinition {
    colorScheme: ColorScheme;
    tokens: ThemeTokens;
}

/** Cores brutas da marca. Os componentes não usam estas cores direto, apenas os tokens. */
const palette = {
    // Neutros
    cream: '#F7F5F0',
    white: '#FFFFFF',
    forest: '#2C3531',
    graphite: '#5B6560',
    silver: '#A9B2AD',
    mist: '#E6E8E4',

    // Marca
    sage: '#7C9A89',
    orange: '#D96B43',
    navy: '#244360',
    amber: '#F2A539',

    // Feedback
    danger: '#B3261E',
} as const;

/** Famílias de fonte disponíveis para os tokens. */
const fonts = {
    display: '"Inter Variable", system-ui, Arial, sans-serif',
    label: '"Inter Variable", system-ui, Arial, sans-serif',
} as const;

/** Todos os temas, indexados pelo nome. */
export const themes = {
    [themeNames[0]]: {
        colorScheme: 'light',
        tokens: {
            background: palette.cream,
            surface: palette.white,
            border: palette.forest,
            foreground: palette.forest,
            muted: palette.graphite,
            accent: palette.orange,
            accentForeground: palette.forest,
            highlight: palette.amber,
            danger: palette.danger,
            fontDisplay: fonts.display,
            fontLabel: fonts.label,
        },
    },
} satisfies Record<ThemeName, ThemeDefinition>;

/** Tema aplicado quando o usuário ainda não escolheu nenhum. */
export const defaultTheme = themeNames[0];

/** Verifica se um valor desconhecido (ex.: vindo do `localStorage`) é um nome de tema válido. */
export function isThemeName(value: unknown): value is ThemeName {
    return typeof value === 'string' && Object.hasOwn(themes, value);
}
