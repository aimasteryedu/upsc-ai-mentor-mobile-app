import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  icons: string; // e.g., parliament icon name
}

interface SubjectTheme {
  [key: string]: Theme;
}

const defaultTheme: Theme = {
  colors: {
    primary: '#FF9933', // Saffron
    secondary: '#138808', // Green
    background: '#FFFFFF',
    text: '#000000',
    accent: '#000080' // Navy for democracy
  },
  fonts: {
    heading: 'Roboto-Bold',
    body: 'Roboto-Regular'
  },
  icons: 'md-home'
};

const subjectThemes: SubjectTheme = {
  parliament: {
    ...defaultTheme,
    colors: {
      primary: '#228B22', // Forest green
      secondary: '#FFD700', // Gold
      background: '#F5F5DC', // Beige
      text: '#000000',
      accent: '#8B0000' // Dark red
    },
    fonts: {
      heading: 'Roboto-Bold',
      body: 'Roboto-Regular'
    },
    icons: 'md-people'
  },
  // Add more: constitution: blue-white, etc.
  default: defaultTheme
};

interface ThemeContextType {
  theme: Theme;
  setSubject: (subject: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [subject, setSubject] = useState('default');
  const [theme, setTheme] = useState(defaultTheme);

  const updateTheme = (newSubject: string) => {
    setSubject(newSubject);
    const newTheme = subjectThemes[newSubject] || defaultTheme;
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setSubject: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
