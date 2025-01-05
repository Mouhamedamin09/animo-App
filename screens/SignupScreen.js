import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; 
import axios from 'axios';

const { width } = Dimensions.get('window');
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // State to track loading

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
  
    setLoading(true); // Start loading
  
    try {
      const response = await axios.post('http://192.168.43.44:3000/register', {
        username,
        email,
        password,
      });
  
      if (response.status === 201) {
        const { token, user } = response.data; // Destructure token and user from response
        Alert.alert('Success', 'Account created successfully!');
        console.log('Response:', response.data);
        console.log('userid:', user._id);
  
        // Store the token and user data in AsyncStorage
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
  
        // Navigate to the PreferenceScreen after successful signup
        navigation.replace('Preference', { userId: user._id, userName: user.username });
      } else {
        Alert.alert('Error', response.data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f1f1f" />
      
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.title}>
          <Text style={{ color: '#5abf75' }}>A</Text>nimo
        </Text>
        <Text style={styles.subtitle}>
          Create an account to start your journey
        </Text>
      </View>

      {/* Form Section */}
      <View style={styles.form}>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={username}
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        
        {/* Password Input */}
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#B0B0B0"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={(text) => setPassword(text)}
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

        {/* Signup Button */}
        <TouchableOpacity
          onPress={handleSignup}
          style={[styles.signupButton, loading && styles.signupButtonDisabled]}
          disabled={loading} // Disable button during loading
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.signupButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Navigate to Login */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.highlight}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  
  // Top section
  topSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: width * 0.8,
    lineHeight: 22,
  },

  // Form section
  form: {
    width: '85%',
    marginTop: 20,
  },

  // Inputs
  input: {
    backgroundColor: '#333333',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444444',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  // Password container
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 45, // leave room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 18,
  },

  // Signup button
  signupButton: {
    backgroundColor: '#5abf75',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
    elevation: 5,
    shadowColor: '#5abf75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  signupButtonDisabled: {
    opacity: 0.6, // Visually indicate button is disabled
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Login navigation
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  highlight: {
    color: '#5abf75',
    fontWeight: 'bold',
  },
});
