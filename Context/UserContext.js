// Context/UserContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme(); // 'light' or 'dark'
  const [userId, setUserId] = useState(null); // Default userId is null
  const [userName, setUserName] = useState('Guest');
  const [avatar, setAvatar] = useState(null);
  const [theme, setTheme] = useState('dark'); // Default to 'dark'
  const [notifications, setNotifications] = useState({
    dailyQuiz: true,
    newComments: true,
  });

  // Load theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('@user_theme');
        if (storedTheme !== null) {
          setTheme(storedTheme);
        } else {
          // If no theme is stored, use the system preference
          setTheme(colorScheme || 'dark');
        }
      } catch (e) {
        console.error('Failed to load theme.', e);
      }
    };

    loadTheme();
  }, [colorScheme]);

  // Save theme to AsyncStorage whenever it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('@user_theme', theme);
      } catch (e) {
        console.error('Failed to save theme.', e);
      }
    };

    saveTheme();
  }, [theme]);

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        userName,
        setUserName,
        avatar,
        setAvatar,
        theme,
        setTheme,
        notifications,
        setNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
