// LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }

    try {
      const response = await axios.post('http://192.168.43.44:3000/login', {
        email: email,
        password: password,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Login successful!');
        console.log('Response:', response.data);

        const { token, user } = response.data;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        console.log('Response:', response.data);
        console.log('userid:', user.id);

        navigation.navigate('LoggedHome', { userId: user.id, userName: user.username });
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to login');
    }
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f1f1f" />
      <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
        <Text style={styles.title}>
          <Text style={{ color: '#5abf75' }}>A</Text>nimo
        </Text>
        <Text style={styles.subtitle}>Sign in to continue your adventure</Text>
      </Animated.View>
      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={email}
          onChangeText={(text) => setEmail(text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#B0B0B0"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={(text) => setPassword(text)}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#B0B0B0"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Added Forgot Password Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotPasswordLink}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('Signup')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>
            Don’t have an account? <Text style={styles.highlight}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles
  forgotPasswordLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#5abf75',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    paddingVertical: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 5,
  },
  form: {
    width: '85%',
    marginTop: 20,
  },
  input: {
    backgroundColor: '#333333',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444444',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 40, // Add padding to make room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 20,
  },
  loginButton: {
    backgroundColor: '#5abf75',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#5abf75',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    elevation: 10,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  registerText: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  highlight: {
    color: '#5abf75',
    fontWeight: 'bold',
  },

});
