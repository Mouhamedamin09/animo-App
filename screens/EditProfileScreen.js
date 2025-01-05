// EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

// Helper for iOS vs Android safe area
const ios = Platform.OS === 'ios';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    location: '',
    birthDate: '',
    avatarUri: '',
  });

  // New state variables for anime image selection
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [animeImages, setAnimeImages] = useState([]);
  const [animeLoading, setAnimeLoading] = useState(false);

  // Fetch current user data on mount
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No token found. Please log in again.');
        navigation.replace('Login');
        return;
      }

      const response = await axios.get(
        `http://192.168.43.44:3000/data?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const { userData } = response.data;
        setEditData({
          name: userData.username || '',
          location: userData.country || '',
          birthDate: userData.birthDate || '',
          avatarUri: userData.avatar || '',
        });
      } else {
        Alert.alert('Error', 'Failed to fetch user data.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Upload image to Cloudinary
  const uploadToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });
    formData.append('upload_preset', 'default_preset'); // Replace with your Cloudinary preset if required
    formData.append('api_key', '946782977643177');
    formData.append('timestamp', Math.floor(Date.now() / 1000));

    try {
      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dmoclj0ji/image/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.status === 200) {
        const imageUrl = response.data.secure_url;
        return imageUrl; // Return the uploaded image URL
      } else {
        Alert.alert('Error', 'Failed to upload image.');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'An error occurred while uploading the image.');
      return null;
    }
  };

  // Pick an image and upload to Cloudinary
  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need access to your gallery.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaType: 'photo',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) return;

      const selectedAsset = result.assets[0];
      if (selectedAsset.uri) {
        setEditData((prev) => ({ ...prev, avatarUri: selectedAsset.uri }));

        const uploadedUrl = await uploadToCloudinary(selectedAsset.uri);
        if (uploadedUrl) {
          setEditData((prev) => ({ ...prev, avatarUri: uploadedUrl }));
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while picking the image.');
    }
  };

  // Save data to the backend
  const handleSave = async () => {
    try {
      setLoading(true);

      const requestBody = {
        userId,
        username: editData.name,
        country: editData.location,
        birthDate: editData.birthDate,
        avatar: editData.avatarUri, // Save Cloudinary URL or selected anime image URL
      };

      const response = await axios.post(
        `http://192.168.43.44:3000/update-profile`,
        requestBody,
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error during profile update:', error.message);
      Alert.alert('Error', 'An error occurred while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a random anime image from Waifu.pics
  const fetchAnimeImage = async () => {
    try {
      setAnimeLoading(true);
      const categories = ['waifu', 'neko', 'shinobu', 'megumin']; // You can add more categories if needed
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      const response = await axios.get(`https://api.waifu.pics/sfw/${randomCategory}`);

      if (response.status === 200 && response.data.url) {
        setAnimeImages((prev) => [...prev, response.data.url]);
      } else {
        Alert.alert('No Results', 'No images found.');
      }
    } catch (error) {
      console.error('API Error:', error);
      Alert.alert('Error', 'An error occurred while fetching images.');
    } finally {
      setAnimeLoading(false);
    }
  };

  // Function to handle image selection from anime images
  const selectAnimeImage = (imageUrl) => {
    setEditData((prev) => ({ ...prev, avatarUri: imageUrl }));
    setIsModalVisible(false);
  };

  // Function to fetch multiple anime images
  const fetchMultipleAnimeImages = async (count = 12) => {
    setAnimeImages([]); // Clear previous images
    for (let i = 0; i < count; i++) {
      await fetchAnimeImage();
    }
  };

  useEffect(() => {
    if (isModalVisible) {
      fetchMultipleAnimeImages();
    }
  }, [isModalVisible]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={ios ? styles.safeAreaIOS : styles.safeAreaAndroid}>
        <StatusBar barStyle="light-content" backgroundColor="#262626" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 26 }} />
        </View>
      </SafeAreaView>

      <LinearGradient
        colors={['#333333', '#2a2a2a']}
        style={styles.gradientContainer}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#5abf75" />
        ) : (
          <>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                <Image
                  source={{ uri: editData.avatarUri }}
                  style={styles.avatarImage}
                />
                <View style={styles.penContainer}>
                  <Ionicons name="create" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.inputField}
                placeholderTextColor="#888"
                placeholder="Enter your name"
                value={editData.name}
                onChangeText={(text) =>
                  setEditData((prev) => ({ ...prev, name: text }))
                }
              />

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.inputField}
                placeholderTextColor="#888"
                placeholder="Enter your location"
                value={editData.location}
                onChangeText={(text) =>
                  setEditData((prev) => ({ ...prev, location: text }))
                }
              />

              <Text style={styles.inputLabel}>Birth Date</Text>
              <TextInput
                style={styles.inputField}
                placeholderTextColor="#888"
                placeholder="YYYY-MM-DD"
                value={editData.birthDate}
                onChangeText={(text) =>
                  setEditData((prev) => ({ ...prev, birthDate: text }))
                }
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Ionicons
                  name="save-outline"
                  size={20}
                  color="#5abf75"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </LinearGradient>

      {/* Modal for Image Selection */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={ios ? styles.safeAreaIOS : styles.safeAreaAndroid}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <View style={{ width: 30 }} />
            </View>
          </SafeAreaView>

          <View style={styles.modalContent}>
            {/* Option to pick from device */}
            <TouchableOpacity style={styles.optionButton} onPress={pickAvatar}>
              <Ionicons name="image-outline" size={24} color="#5abf75" />
              <Text style={styles.optionText}>Choose from Device</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Option to select from Waifu.pics */}
            <TouchableOpacity style={styles.optionButton} onPress={() => {}}>
              <Ionicons name="logo-apple-appstore" size={24} color="#5abf75" />
              <Text style={styles.optionText} onPress={() => {}}>
                Select from Waifu.pics
              </Text>
            </TouchableOpacity>
          </View>

          {/* Display Fetched Anime Images */}
          <View style={styles.animeImagesContainer}>
            {animeLoading && (
              <ActivityIndicator size="large" color="#5abf75" style={{ marginTop: 20 }} />
            )}

            {!animeLoading && animeImages.length === 0 && (
              <TouchableOpacity style={styles.fetchMoreButton} onPress={fetchMultipleAnimeImages}>
                <Text style={styles.fetchMoreText}>Load More Images</Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={animeImages}
              keyExtractor={(item, index) => `${item}-${index}`}
              numColumns={3}
              contentContainerStyle={styles.imageGrid}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => selectAnimeImage(item)} style={styles.imageWrapper}>
                  <Image source={{ uri: item }} style={styles.animeImage} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !animeLoading && (
                  <Text style={styles.noResultsText}>No images available.</Text>
                )
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262626',
  },
  safeAreaIOS: {
    marginBottom: -2,
  },
  safeAreaAndroid: {
    marginBottom: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  gradientContainer: {
    flex: 1,
    paddingTop: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative', // so pen icon can be positioned absolute
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: '#5abf75',
    borderWidth: 3,
  },
  penContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#5abf75',
    borderRadius: 14,
    padding: 4,
  },
  formFields: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 16,
  },
  inputField: {
    backgroundColor: '#444444',
    color: '#fff',
    fontSize: 16,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444444',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#5abf75',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Modal Styles */
  modalContainer: {
    flex: 1,
    backgroundColor: '#262626',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 10,
  },
  animeImagesContainer: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  imageGrid: {
    paddingHorizontal: 10,
  },
  imageWrapper: {
    flex: 1 / 3,
    aspectRatio: 1, // Square images
    margin: 5,
  },
  animeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  noResultsText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  fetchMoreButton: {
    backgroundColor: '#5abf75',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 10,
  },
  fetchMoreText: {
    color: '#fff',
    fontSize: 16,
  },
});
