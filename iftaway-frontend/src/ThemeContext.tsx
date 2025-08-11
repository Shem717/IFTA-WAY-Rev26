        import { createContext, useContext, useState, useEffect } from 'react';

        const ThemeContext = createContext({
            theme: 'dark',
            setTheme: (theme: 'dark' | 'light') => {},
        });

        export const ThemeProvider = ({ children }) => {
            const [theme, setTheme] = useState(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');

            useEffect(() => {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(theme);
                localStorage.setItem('theme', theme);
            }, [theme]);

            return (
                <ThemeContext.Provider value={{ theme, setTheme }}>
                    {children}
                </ThemeContext.Provider>
            );
        };

        export const useTheme = () => useContext(ThemeContext);
