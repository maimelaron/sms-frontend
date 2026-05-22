import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('sms-theme') || 'glass';
        // Apply immediately to avoid flash of wrong theme on reload
        document.documentElement.setAttribute('data-theme', saved);
        return saved;
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sms-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'glass' ? 'dark' : 'glass');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
