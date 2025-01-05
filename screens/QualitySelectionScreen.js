// QualitySelectionScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeftIcon, PlayIcon } from 'react-native-heroicons/outline';

const { width } = Dimensions.get('window');

export default function QualitySelectionScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { animeSlug, episodeNumber } = params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [episodeSources, setEpisodeSources] = useState([]);

  useEffect(() => {
    if (!animeSlug) {
      alert('No slug found for this anime.');
      navigation.goBack();
      return;
    }
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const apiUrl = `http://192.168.43.44:4000/watch/${animeSlug}-episode-${episodeNumber}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      setEpisodeSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching episode sources:', error);
      alert('Failed to fetch episode sources.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const openVideoLink = async (sourceUrl) => {
    try {
      if (Platform.OS === 'android') {
        const intentUrl = `intent:${sourceUrl}#Intent;action=android.intent.action.VIEW;type=video/*;end`;
        const canOpen = await Linking.canOpenURL(intentUrl);
        if (canOpen) {
          Linking.openURL(intentUrl);
        } else {
          Linking.openURL(sourceUrl);
        }
      } else {
        Linking.openURL(sourceUrl);
      }
    } catch (err) {
      console.error('Error opening video link:', err);
      alert('Failed to open the video link.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeftIcon size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {animeSlug ? `Choose Quality` : 'Choose Quality'}
          </Text>
          {/* Placeholder for spacing on the right */}
          <View style={styles.headerRightPlaceholder} />
        </View>
        
        {/* Sub-header / meta info */}
        {episodeNumber && (
          <View style={styles.headerSubtitleWrapper}>
            <Text style={styles.headerSubtitle}>
              {`Episode ${episodeNumber}`}
            </Text>
          </View>
        )}
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FFB300" />
        ) : episodeSources.length === 0 ? (
          <Text style={styles.noSourcesText}>No sources available</Text>
        ) : (
          episodeSources.map((source, index) => (
            <TouchableOpacity
              key={`source-${index}`}
              style={styles.qualityOption}
              onPress={() => openVideoLink(source.url)}
            >
              <View style={styles.playIconWrapper}>
                <PlayIcon size={20} color="#ffffff" />
              </View>
              <View style={styles.qualityInfo}>
                <Text style={styles.qualityText}>
                  {source.quality || 'Unknown'}
                  {source.isM3U8 ? ' (M3U8)' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Main container with a dark background */
  container: {
    flex: 1,
    backgroundColor: '#101010'
  },

  /* Header container with a subtle bottom border and slight shadow */
  headerContainer: {
    backgroundColor: '#1F1B24',
    paddingBottom: 10,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    elevation: 5
  },

  /* Header row where the back button and title are located */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 15
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1
  },
  headerRightPlaceholder: {
    width: 40
  },

  /* A small sub-header area to display episode info if needed */
  headerSubtitleWrapper: {
    marginTop: 0,
    alignItems: 'center'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d3d3d3',
    marginTop: 4
  },

  /* Main content container */
  content: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 15
  },

  /* If no sources were found */
  noSourcesText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  },

  /* Each option row for a streaming source */
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292929',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    /* Create a subtle “card-like” effect */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5
  },
  playIconWrapper: {
    backgroundColor: '#5abf75', // accent color
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qualityInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  qualityText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
});
