import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { supabase } from './src/services/supabase';
import UserPanel from './src/screens/UserPanel';
import AdminDashboard from './src/screens/AdminDashboard';
import { useAuth } from './src/contexts/AuthContext';
import { useAdmin } from './src/hooks/useAdmin';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { isAdmin } = useAdmin();

  return (
    <NavigationContainer>
      <Tab.Navigator>
        {/* Other tabs: Home, Study, etc. */}
        <Tab.Screen name="Profile" component={UserPanel} />
        {isAdmin && <Tab.Screen name="Admin" component={AdminDashboard} options={{ title: 'Admin Panel' }} />}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
