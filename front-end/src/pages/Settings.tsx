import React, { useState } from 'react';
import {
    ACCENT_STORAGE_KEY,
    THEME_STORAGE_KEY,
    Theme,
    accentColors,
    applyThemeSettings,
    getStoredAccentColor,
    getStoredTheme,
} from '../theme';
import '../css/settings.css';

const Settings = () => {
    const [theme, setTheme] = useState<Theme>(getStoredTheme);
    const [accentColor, setAccentColor] = useState(getStoredAccentColor);

    const updateTheme = (value: Theme) => {
        setTheme(value);
        localStorage.setItem(THEME_STORAGE_KEY, value);
        applyThemeSettings(value, accentColor);
    };

    const updateAccentColor = (value: string) => {
        setAccentColor(value);
        localStorage.setItem(ACCENT_STORAGE_KEY, value);
        applyThemeSettings(theme, value);
    };

    return (
        <div className="content">
            <div className="settings-page">
                <div className="settings-header">
                    <h1>Settings</h1>
                    <p>Choose how StudyMate looks on this device.</p>
                </div>

                <section className="settings-section">
                    <h2>Theme</h2>
                    <div className="settings-options">
                        {(['light', 'dark'] as Theme[]).map((option) => (
                            <label
                                className={`settings-option${
                                    theme === option ? ' selected' : ''
                                }`}
                                key={option}
                            >
                                <input
                                    type="radio"
                                    name="theme"
                                    value={option}
                                    checked={theme === option}
                                    onChange={() => updateTheme(option)}
                                />
                                <span>
                                    {option === 'light' ? 'Light' : 'Dark'} mode
                                </span>
                            </label>
                        ))}
                    </div>
                </section>

                <section className="settings-section">
                    <h2>Accent color</h2>
                    <div className="accent-options">
                        {accentColors.map((color) => (
                            <button
                                className={`accent-option${
                                    accentColor === color.value
                                        ? ' selected'
                                        : ''
                                }`}
                                key={color.value}
                                type="button"
                                onClick={() => updateAccentColor(color.value)}
                            >
                                <span
                                    className="accent-swatch"
                                    style={{ backgroundColor: color.value }}
                                />
                                {color.name}
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
