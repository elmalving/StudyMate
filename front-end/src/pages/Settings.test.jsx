import { render, screen, fireEvent } from '@testing-library/react';
import Settings from './Settings';
import { THEME_STORAGE_KEY, ACCENT_STORAGE_KEY } from '../theme';

describe('Settings Page', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.style.removeProperty('--accent-color');
    });

    test('renders Settings page header and options', () => {
        render(<Settings />);

        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Choose how StudyMate looks on this device.')).toBeInTheDocument();
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByText('Accent color')).toBeInTheDocument();

        // Check options are rendered
        expect(screen.getByLabelText('Light mode')).toBeInTheDocument();
        expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Green/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Blue/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Purple/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Red/i })).toBeInTheDocument();
    });

    test('updates theme to light and stores it in localStorage', () => {
        render(<Settings />);

        const lightRadio = screen.getByLabelText('Light mode');
        fireEvent.click(lightRadio);

        expect(lightRadio).toBeChecked();
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    test('updates accent color and stores it in localStorage', () => {
        render(<Settings />);

        const purpleButton = screen.getByRole('button', { name: /Purple/i });
        fireEvent.click(purpleButton);

        expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('#8b5cf6');
        expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe('#8b5cf6');
    });
});
