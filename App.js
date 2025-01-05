import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AppNavigation from './navigation/AppNavigation';
import { UserProvider } from './Context/UserContext';



export default function App() {
  return ( 
    <UserProvider>
      <AppNavigation />
    </UserProvider>
      
  );
}

