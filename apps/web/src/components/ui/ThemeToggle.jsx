import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);

        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle Dark Mode"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <style>{`
                .theme-toggle {
                    width: 40px; height: 40px;
                    border-radius: var(--radius-full);
                    display: flex; align-items: center; justify-content: center;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-default);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .theme-toggle:hover {
                    background: var(--bg-surface-hover);
                    color: var(--text-primary);
                    border-color: var(--border-focus);
                }
                .dark .theme-toggle {
                    background: var(--bg-surface-sunken);
                    border-color: var(--border-light);
                }
                .dark .theme-toggle:hover {
                    color: var(--brand-saffron);
                    background: var(--bg-surface);
                }
            `}</style>
        </button>
    );
}
