export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'studymate-theme';
export const ACCENT_STORAGE_KEY = 'studymate-accent-color';

export const accentColors = [
    { name: 'Green', value: '#b6f09c' },
    { name: 'Blue', value: '#82dbf7' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#d0302f' },
];

export const defaultTheme: Theme = 'dark';
export const defaultAccentColor = accentColors[0].value;

export const getStoredTheme = (): Theme => {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === 'light' || theme === 'dark' ? theme : defaultTheme;
};

export const getStoredAccentColor = () => {
    return localStorage.getItem(ACCENT_STORAGE_KEY) || defaultAccentColor;
};

export const applyThemeSettings = (
    theme = getStoredTheme(),
    accentColor = getStoredAccentColor()
) => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent-color', accentColor);
};
