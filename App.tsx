import React from 'react';
import { View, StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { ThemeProvider, useTheme } from './src/ThemeContext';

function AppContent() {
  const { C, isDark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.canvas} />
      <HomeScreen />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
