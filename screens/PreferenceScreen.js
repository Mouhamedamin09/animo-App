import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Thriller',
  'Mecha',
  'Mystery',
  'Supernatural',
  'Psychological',
];

const SAMPLE_ANIME_LIST = [
  'Naruto',
  'One Piece',
  'Attack on Titan',
  'My Hero Academia',
  'Fullmetal Alchemist',
  'Death Note',
  'Demon Slayer',
  'Jujutsu Kaisen',
  'Haikyuu!!',
  'Tokyo Ghoul',
  'Black Clover',
  'Hunter x Hunter',
  'Bleach',
  'Dragon Ball Z',
  'Sword Art Online',
  'Other...',
];

const RECOMMENDED_FEATURES = [
  'Newsletters',
  'Spoiler Alerts',
  'New Release Updates',
  'Manga Recommendations',
];

// 1. Create an icon mapping for each genre
const GENRE_ICONS = {
  Action: 'flame-outline',
  Adventure: 'compass-outline',
  Comedy: 'happy-outline',
  Drama: 'sad-outline',
  Fantasy: 'planet-outline',
  Horror: 'skull-outline',
  Romance: 'heart-outline',
  'Sci-Fi': 'rocket-outline',
  'Slice of Life': 'cafe-outline',
  Sports: 'american-football-outline',
  Thriller: 'alert-circle-outline',
  Mecha: 'hardware-chip-outline',
  Mystery: 'help-circle-outline',
  Supernatural: 'flash-outline',
  Psychological: 'bandage-outline',
};

export default function PreferenceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName } = route.params; // Get userId from navigation params
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [favoriteAnimes, setFavoriteAnimes] = useState([]);
  const [recommendedFeatureSelections, setRecommendedFeatureSelections] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenrePress = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleAnimePress = (anime) => {
    if (favoriteAnimes.includes(anime)) {
      setFavoriteAnimes(favoriteAnimes.filter((a) => a !== anime));
    } else {
      setFavoriteAnimes([...favoriteAnimes, anime]);
    }
  };

  const handleRecommendedFeaturePress = (feature) => {
    if (recommendedFeatureSelections.includes(feature)) {
      setRecommendedFeatureSelections(
        recommendedFeatureSelections.filter((f) => f !== feature)
      );
    } else {
      setRecommendedFeatureSelections([...recommendedFeatureSelections, feature]);
    }
  };

  const handleContinue = async () => {
    if (!selectedGenres.length || !favoriteAnimes.length) {
      Alert.alert('Hold on', 'Please select at least one genre and anime.');
      return;
    }
  
    if (!userId) {
      Alert.alert('Error', 'User ID is missing. Please try logging in again.');
      return;
    }
  
    setLoading(true);
  
    try {
      const userPreferences = {
        userId,
        selectedGenres,
        favoriteAnimes,
        recommendedFeatures: recommendedFeatureSelections,
      };
      const response = await axios.post('http://192.168.43.44:3000/save-preferences', userPreferences);
  
      if (response.status === 200) {
        Alert.alert('Success', 'Preferences saved successfully!');
  
        // Navigate to HomeScreen with user data
        navigation.replace('LoggedHome', { userName: userName, userId });
      } else {
        Alert.alert('Error', 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Preference Save Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Unable to save preferences');
    } finally {
      setLoading(false);
    }
  };
  
  // 2. Modify the renderGenre function to display the icon
  const renderGenre = (genre) => {
    const isSelected = selectedGenres.includes(genre);
    const iconName = GENRE_ICONS[genre] || 'help-outline'; // Fallback icon if not found

    return (
      <TouchableOpacity
        key={genre}
        style={[styles.genreItem, isSelected && styles.genreItemSelected]}
        onPress={() => handleGenrePress(genre)}
      >
        <View style={styles.genreItemRow}>
          <Icon
            name={iconName}
            size={16}
            color={isSelected ? '#5abf75' : '#B0B0B0'}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.genreText, isSelected ? styles.selectedText : styles.unselectedText]}>
            {genre}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAnime = (anime) => {
    const isFavorite = favoriteAnimes.includes(anime);
    return (
      <TouchableOpacity
        key={anime}
        style={[styles.animeItem, isFavorite && styles.animeItemSelected]}
        onPress={() => handleAnimePress(anime)}
      >
        <Text style={[styles.animeText, isFavorite ? styles.selectedText : styles.unselectedText]}>
          {anime}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRecommendedFeature = (feature) => {
    const isSelected = recommendedFeatureSelections.includes(feature);
    return (
      <TouchableOpacity
        key={feature}
        style={[styles.featureItem, isSelected && styles.featureItemSelected]}
        onPress={() => handleRecommendedFeaturePress(feature)}
      >
        <View style={styles.featureItemRow}>
          <Icon
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={isSelected ? '#5abf75' : '#B0B0B0'}
          />
          <Text
            style={[styles.featureText, isSelected ? styles.selectedText : styles.unselectedText]}
          >
            {feature}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f1f1f" />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            <Text style={{ color: '#5abf75' }}>A</Text>nimo
          </Text>
          <Text style={styles.headerSubtitle}>Tell us more about your anime preferences</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Your Favorite Genres</Text>
          <View style={styles.genreContainer}>{GENRES.map(renderGenre)}</View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Your Favorite Animes</Text>
          <View style={styles.animeContainer}>{SAMPLE_ANIME_LIST.map(renderAnime)}</View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Additional Features</Text>
          <Text style={styles.sectionSubtitle}>Choose what you’d like to receive from us</Text>
          <View style={styles.featureContainer}>
            {RECOMMENDED_FEATURES.map(renderRecommendedFeature)}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.buttonContinue, loading && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.buttonContinueText}>{loading ? 'Saving...' : 'Continue'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: width * 0.8,
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 10,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreItem: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#333333',
  },
  genreItemSelected: {
    borderColor: '#5abf75',
    backgroundColor: '#2d2d2d',
  },
  // 3. Add a row style to align the icon and text
  genreItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreText: {
    fontSize: 14,
  },
  animeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  animeItem: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#333333',
  },
  animeItemSelected: {
    borderColor: '#5abf75',
    backgroundColor: '#2d2d2d',
  },
  animeText: {
    fontSize: 14,
  },
  selectedText: {
    color: '#5abf75',
  },
  unselectedText: {
    color: '#B0B0B0',
  },
  featureContainer: {
    marginTop: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#333333',
  },
  featureItemSelected: {
    borderColor: '#5abf75',
    backgroundColor: '#2d2d2d',
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
  },
  buttonContinue: {
    backgroundColor: '#5abf75',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#5abf75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContinueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
