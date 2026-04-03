"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Theme provider for dark mode / light mode / system default.
 *
 * How it works:
 *   - Theme preference is stored in localStorage so it persists across visits
 *   - The selected theme sets a data-theme attribute on <html>
 *   - CSS variables in globals.css change based on [data-theme="dark"] / [data-theme="light"]
 *   - "system" mode reads the user's OS preference via prefers-color-scheme
 */

type Theme = "light" | "dark" | "system";

// Context so any component can read/change the theme
const ThemeContext = createContext<{
    theme: Theme;
    setTheme: (t: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

export function useTheme() {
    return useContext(ThemeContext);
}

/**
 * ThemeProvider — wraps the admin layout.
 * Reads the saved theme from localStorage on mount, then applies it
 * by setting data-theme on the <html> element.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("system");

    // Load saved theme preference on mount
    useEffect(() => {
        const saved = localStorage.getItem("theme") as Theme | null;
        if (saved) setTheme(saved);
    }, []);

    // Apply theme to the document whenever it changes
    useEffect(() => {
        localStorage.setItem("theme", theme);
        const root = document.documentElement;
        root.removeAttribute("data-theme");

        if (theme === "system") {
            // Use the OS preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.setAttribute("data-theme", prefersDark ? "dark" : "light");
        } else {
            root.setAttribute("data-theme", theme);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * ThemeToggle — three buttons in the sidebar footer to switch themes.
 */
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const options: Theme[] = ["light", "dark", "system"];

    return (
        <div className="theme-toggle">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => setTheme(opt)}
                    className={`theme-btn ${theme === opt ? "active" : ""}`}
                >
                    {opt === "light" ? "Light" : opt === "dark" ? "Dark" : "System"}
                </button>
            ))}
        </div>
    );
}
