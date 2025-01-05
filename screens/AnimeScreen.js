// AnimeScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  Image,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  ScrollView,
  ActivityIndicator // Import ActivityIndicator for loaders
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import axios from 'axios';

import {
  ChevronLeftIcon,
  StarIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
  ChatBubbleLeftIcon
} from 'react-native-heroicons/outline';

import { HeartIcon } from 'react-native-heroicons/mini';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Loading from './loading';
import { fetchAnimeById, fetchAnimeCharecters } from './api/AnimeDB';
import Cast from '../components/cast';
import { useUser } from '../Context/UserContext';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const topMargin = isIOS ? 20 : 25;

const STATUS_OPTIONS = [
  { label: 'Want to Watch', value: 'want_to_watch' },
  { label: 'Watching Now', value: 'watching_now' },
  { label: 'Done Watching', value: 'done_watching' },
  { label: 'Complete it Later', value: 'complete_later' },
  { label: "I Don't Want to Complete It", value: 'dont_want' }
];

export default function AnimeScreen() {
  const { params: item } = useRoute();
  const navigation = useNavigation();
  const { userId } = useUser();

  // Basic states
  const [animeDetails, setAnimeDetails] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState('Description');
  const [showAll, setShowAll] = useState(false);

  // "My List" feature
  const [myListStatus, setMyListStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  /**
   * Watched-episodes are stored in a dictionary:
   * {
   *   '12345': [1, 2, 3],  // animeId => list of watched eps
   *   '67890': [1, 2],
   *   ...
   * }
   */
  const [watchedEpisodesMap, setWatchedEpisodesMap] = useState({});
  const animeIdKey = String(item?.mal_id); // We'll use this as the key

  // Favorite animation (optional)
  const [heartScale] = useState(new Animated.Value(1));

  // Local server (HiAnime) episodes
  const [localEpisodes, setLocalEpisodes] = useState([]);
  const [slugFetching, setSlugFetching] = useState(false);

  // Loader state for episode selection
  const [isEpisodeLoading, setIsEpisodeLoading] = useState(false);

  // Subtitle selection modal state
  const [isSubtitleModalVisible, setIsSubtitleModalVisible] = useState(false);
  const [availableSubtitles, setAvailableSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);

  // Current HLS Source
  const [currentHlsSource, setCurrentHlsSource] = useState(null);

  // -----------------------------------------------------------
  // INIT LOAD
  // -----------------------------------------------------------
  useEffect(() => {
    fetchData();
    loadWatchedEpisodesMap(); // loads entire mapping from AsyncStorage
    fetchMyListStatus();
    fetchUserWatchedEpisodes();

    // Fallback to Retry button if it takes too long
    const timer = setTimeout(() => {
      if (loading) {
        setRetry(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // Once we have animeDetails, fetch local episodes from your server
  useEffect(() => {
    if (animeDetails?.title) {
      fetchLocalEpisodes(animeDetails.title);
    }
  }, [animeDetails]);

  // -----------------------------------------------------------
  // 1) FETCH ANIME DETAILS (from MAL or from item if pre-loaded)
  // -----------------------------------------------------------
  const fetchData = async () => {
    setLoading(true);
    setRetry(false);
    try {
      const displayItem = item?.approved
        ? item
        : await fetchAnimeById(item?.mal_id).then((res) => res.data);

      setAnimeDetails(displayItem);

      // fetch cast
      const characterData = await fetchAnimeCharecters(displayItem.mal_id);
      if (characterData && characterData.data) {
        setCast(characterData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch anime details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  // 2) FETCH EPISODES FROM YOUR LOCAL SERVER (/fetchEpisodes)
  // -----------------------------------------------------------
  const fetchLocalEpisodes = async (animeTitle) => {
    try {
      setSlugFetching(true);

      const response = await axios.get(
        `http://192.168.43.44:3000/fetchEpisodes?name=${encodeURIComponent(animeTitle)}&mal_id=${item?.mal_id}`
      );

      if (response.data.success) {
        /**
         * shape:
         * {
         *   success: true,
         *   data: {
         *       totalEpisodes: number,
         *       episodes: [
         *         {
         *           title: "Episode 1",
         *           episodeId: "jojos-bizarre-...-?ep=72086",
         *           number: 1,
         *           isFiller: false
         *         },
         *         ...
         *       ]
         *   }
         * }
         */
        const episodesData = response.data.data.episodes || [];

        setLocalEpisodes(episodesData);
      } else {
        console.warn('Local server returned success=false for /fetchEpisodes');
      }
    } catch (error) {
      console.error('Error fetching local episodes:', error);
    } finally {
      setSlugFetching(false);
    }
  };

  // -----------------------------------------------------------
  // 3) LOAD & SAVE WATCHED EPISODES (PER ANIME)
  // -----------------------------------------------------------
  const loadWatchedEpisodesMap = async () => {
    try {
      const stored = await AsyncStorage.getItem('ANIME_WATCHED_MAP');
      if (stored) {
        setWatchedEpisodesMap(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load watched episodes map:', err);
    }
  };

  const saveWatchedEpisodesMap = async (updatedMap) => {
    try {
      await AsyncStorage.setItem('ANIME_WATCHED_MAP', JSON.stringify(updatedMap));
    } catch (err) {
      console.error('Failed to save watched episodes map:', err);
    }
  };

  // For the local UI, see if we have any for this anime
  const getLocalWatchedSet = () => {
    return new Set(watchedEpisodesMap[animeIdKey] || []);
  };

  // -----------------------------------------------------------
  // 4) FETCH USER’S WATCHED EPISODES FROM YOUR SERVER (OPTIONAL)
  // -----------------------------------------------------------
  const fetchUserWatchedEpisodes = async () => {
    if (!userId) return; // If user is not logged in, skip
    try {
      const response = await axios.get(
        `http://192.168.43.44:3000/data?userId=${userId}`
      );
      const { userData } = response.data;
      if (userData?.watchedEpisodes) {
        /**
         * userData.watchedEpisodes might be:
         * [
         *   { animeId: '12345', episodes: [1,2,3] },
         *   { animeId: '67890', episodes: [1,2] }
         * ]
         */
        const serverMap = {};
        userData.watchedEpisodes.forEach((entry) => {
          serverMap[entry.animeId] = entry.episodes || [];
        });

        // merge server data with local data
        setWatchedEpisodesMap((prevMap) => {
          const merged = { ...prevMap };
          Object.keys(serverMap).forEach((id) => {
            const serverEpisodes = new Set(serverMap[id]);
            const localEpisodes = new Set(merged[id] || []);
            const combined = new Set([...serverEpisodes, ...localEpisodes]);
            merged[id] = Array.from(combined);
          });
          saveWatchedEpisodesMap(merged);
          return merged;
        });
      }
    } catch (err) {
      console.error('Failed to fetch user’s watched episodes:', err);
    }
  };

  // -----------------------------------------------------------
  // 5) HANDLE EPISODE CLICK => GET STREAM => MARK AS WATCHED
  // -----------------------------------------------------------
  const handleEpisodePress = async (episodeItem) => {
    const episodeNumber = episodeItem.number;
    const episodeId = episodeItem.episodeId;

    setIsEpisodeLoading(true); // Show loader

    try {
      // (a) If user is logged in, update “watched” on your server
      if (userId) {
        await axios.post('http://192.168.43.44:3000/watched', {
          userId,
          animeId: item?.mal_id,
          episodeNumber
        });
      }

      // (b) Update local watched map
      setWatchedEpisodesMap((prevMap) => {
        const updated = { ...prevMap };
        const currentList = new Set(updated[animeIdKey] || []);
        currentList.add(episodeNumber);
        updated[animeIdKey] = Array.from(currentList);
        saveWatchedEpisodesMap(updated);
        return updated;
      });

      // (c) fetch servers from /fetchEpisode?episodeId=...
      const serverRes = await axios.get(
        `http://192.168.43.44:3000/fetchEpisode?episodeId=${encodeURIComponent(episodeId)}`
      );

      if (!serverRes.data.success) {
        Alert.alert('Error', 'Failed to fetch servers for this episode.');
        setIsEpisodeLoading(false);
        return;
      }

      const serversData = serverRes.data.data;

      const hlsSource = serversData.sources[0]?.url;
      if (!hlsSource) {
        Alert.alert('Error', 'No HLS source found');
        setIsEpisodeLoading(false);
        return;
      }

      // Extract caption tracks (kind: 'captions')
      const captionTracks = serversData.tracks.filter(
        (track) => track.kind === 'captions'
      );

      if (captionTracks.length === 0) {
        Alert.alert('No Subtitles', 'No subtitles available for this episode.');
        setIsEpisodeLoading(false);
        return;
      }

      // Prepare available subtitles
      const subtitles = captionTracks.map((track, index) => ({
        id: index.toString(),
        label: track.label,
        file: track.file
      }));

      setAvailableSubtitles(subtitles);
      setCurrentHlsSource(hlsSource); // Set the HLS source in state

      if (subtitles.length === 1) {
        // If only one subtitle is available, proceed directly
        openVideoWithStreamScreen(hlsSource, subtitles[0].file);
      } else {
        // Show subtitle selection modal
        setIsSubtitleModalVisible(true);
      }
    } catch (err) {
      console.error('Error in handleEpisodePress:', err);
      Alert.alert('Error', 'Failed to fetch episode sources');
    } finally {
      setIsEpisodeLoading(false); // Hide loader
    }
  };

  // -----------------------------------------------------------
  // 6) OPEN VIDEO + SUBTITLES IN STREAM SCREEN
  // -----------------------------------------------------------
  const openVideoWithStreamScreen = (videoUrl, subtitleUrl) => {
    try {
      if (!videoUrl || !subtitleUrl) {
        console.warn('Video URL or Subtitle URL is missing.');
        Alert.alert('Error', 'Video URL or Subtitle URL is missing.');
        return;
      }

      // Navigate to the StreamScreen with the provided URLs
      navigation.navigate('Stream', { videoUrl, subtitleUrl });
    } catch (err) {
      console.error('Error navigating to StreamScreen:', err);
      Alert.alert('Error', 'Failed to navigate to the video player.');
    }
  };

  // -----------------------------------------------------------
  // 7) MY LIST LOGIC
  // -----------------------------------------------------------
  const fetchMyListStatus = async () => {
    try {
      const response = await fetch(
        `http://192.168.43.44:3000/list?userId=${userId}&animeId=${item?.mal_id}`,
        { method: 'GET' }
      );
      if (!response.ok) {
        console.log('Failed to fetch My List status:', response.status);
        return;
      }
      const data = await response.json();
      const foundAnime = data.animeStatus;
      if (foundAnime && foundAnime.status) {
        setMyListStatus(foundAnime.status);
      }
    } catch (error) {
      console.error('Error fetching My List status:', error);
    }
  };

  const updateMyListStatus = async (status) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No token found. Please log in again.');
        navigation.replace('Login');
        return;
      }
      const response = await fetch('http://192.168.43.44:3000/list', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          animeId: item?.mal_id,
          status
        })
      });
      if (!response.ok) {
        console.log('Failed to update My List status:', response.status);
      } else {
        setMyListStatus(status);
      }
    } catch (error) {
      console.error('Error updating My List status:', error);
    }
  };

  const handleStatusSelection = (status) => {
    updateMyListStatus(status);
    setIsModalVisible(false);
  };

  const getMyListLabel = () => {
    const statusOption = STATUS_OPTIONS.find(
      (option) => option.value === myListStatus
    );
    return statusOption ? statusOption.label : 'Add to My List';
  };

  const getStatusColor = () => {
    switch (myListStatus) {
      case 'want_to_watch':
        return '#fbc02d';
      case 'watching_now':
        return '#42a5f5';
      case 'done_watching':
        return '#66bb6a';
      case 'complete_later':
        return '#ab47bc';
      case 'dont_want':
        return '#ef5350';
      default:
        return '#ffffff';
    }
  };

  // -----------------------------------------------------------
  // RENDERING
  // -----------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {retry ? (
          <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : (
          <Loading />
        )}
      </View>
    );
  }

  if (!animeDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Anime details not available.</Text>
      </View>
    );
  }

  const {
    title,
    images,
    aired,
    duration,
    genres = [],
    episodes,
    synopsis,
    trailer,
    score,
    scored_by
  } = animeDetails;

  const AnimeProp = {
    name: title,
    background: images?.jpg?.large_image_url,
    Airing: {
      status: aired ? 'Aired' : 'Not released',
      Time: aired?.from?.slice(0, 4) || ''
    },
    duration,
    genres,
    ep: episodes || 0,
    story: synopsis
  };

  // We'll rely on localEpisodes from the local server, not MAL's "episodes"
  const currentAnimeWatchedSet = getLocalWatchedSet();

  // Episode item
  const renderEpisodeItem = ({ item }) => {
    const episodeNumber = item.number;
    const isCompleted = currentAnimeWatchedSet.has(episodeNumber);

    return (
      <TouchableOpacity
        style={[
          styles.episodeCard,
          isCompleted && styles.episodeCardCompleted
        ]}
        onPress={() => handleEpisodePress(item)}
        disabled={isEpisodeLoading} // Disable button while loading
      >
        <View style={styles.episodeInfo}>
          <EyeIcon
            size={24}
            color={isCompleted ? '#4caf50' : '#ffffff'}
            style={{ marginRight: 10 }}
          />
          <Text
            style={[
              styles.episodeText,
              isCompleted && styles.episodeTextCompleted
            ]}
          >
            Episode {episodeNumber} {item.isFiller ? '(Filler)' : ''}
          </Text>
        </View>
        <View style={styles.playIconContainer}>
          <PlayIcon size={20} color="#ffffff" />
        </View>
      </TouchableOpacity>
    );
  };

  // Shared Header
  const renderHeader = () => {
    return (
      <>
        {/* Top Image */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: AnimeProp.background }}
            style={{ width, height: height * 0.55 }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(23,23,23,0.8)', 'rgba(23,23,23,1)']}
            style={{
              width,
              height: height * 0.4,
              position: 'absolute',
              bottom: 0
            }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Top row (Back + Comments) */}
          <View
            style={{
              position: 'absolute',
              zIndex: 20,
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              top: topMargin
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ChevronLeftIcon size={28} strokeWidth={2.5} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('comments', {
                  animeId: AnimeProp?.Airing?.Time || '',
                  title: AnimeProp?.name || ''
                })
              }
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <ChatBubbleLeftIcon size={35} color="#5abf75" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Container */}
        <View style={styles.infoContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{AnimeProp.name}</Text>

            {/* My List Button */}
            <View style={styles.myListContainer}>
              <TouchableOpacity
                onPress={() => {
                  if (!userId) {
                    Alert.alert(
                      'Login Required',
                      'Please log in to add anime to your list.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Login', onPress: () => navigation.navigate('Login') }
                      ]
                    );
                  } else {
                    setIsModalVisible(true);
                  }
                }}
                style={[
                  styles.myListButton,
                  myListStatus && { backgroundColor: getStatusColor() }
                ]}
              >
                <PlusIcon
                  size={20}
                  color={myListStatus ? '#ffffff' : '#000000'}
                />
                <Text
                  style={[
                    styles.myListText,
                    myListStatus && { color: '#ffffff' }
                  ]}
                >
                  {myListStatus ? getMyListLabel() : 'Add to My List'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subInfoText}>
              {AnimeProp.Airing.status} • {AnimeProp.Airing.Time} •{' '}
              {AnimeProp.ep} episodes
            </Text>

            {/* Genres */}
            <View style={styles.genresContainer}>
              {AnimeProp.genres.map((genre, idx) => (
                <View key={idx} style={styles.genreBadge}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </View>

            {/* Score + Duration */}
            <View style={styles.scoreDurationContainer}>
              <StarIcon size={22} color="#FFD700" />
              <Text style={styles.scoreText}>
                {score == null ? '?' : score} ({scored_by} ratings)
              </Text>
            </View>
            <View style={styles.scoreDurationContainer}>
              <ClockIcon size={22} color="#90ee90" />
              <Text style={styles.durationText}>{duration || 'N/A'}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'Description' && styles.activeTab
              ]}
              onPress={() => setActiveTab('Description')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Description' && styles.activeTabText
                ]}
              >
                Description
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'Watch' && styles.activeTab
              ]}
              onPress={() => setActiveTab('Watch')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Watch' && styles.activeTabText
                ]}
              >
                Watch
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    )};

  // Description tab content
  const renderDescriptionTab = () => {
    return (
      <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
        {/* Synopsis */}
        <TouchableOpacity onPress={() => setShowAll(!showAll)}>
          <Text style={styles.synopsisText}>
            {showAll
              ? AnimeProp.story
              : AnimeProp.story?.length > 450
              ? AnimeProp.story.slice(0, 450) + '...'
              : AnimeProp.story}
          </Text>
          {AnimeProp.story?.length > 450 && (
            <Text style={styles.showMoreText}>
              {showAll ? 'Show Less' : 'Show More'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Trailer */}
        {trailer?.embed_url ? (
          <View style={styles.trailerContainer}>
            <Text style={styles.sectionTitle}>Trailer</Text>
            <WebView
              source={{ uri: trailer.embed_url }}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>
        ) : null}

        {/* Cast */}
        <Cast cast={cast} navigation={navigation} />
      </View>
    );
  };

  // Watch tab content (episodes list from local server)
  const renderWatchTab = () => {
    return (
      <FlatList
        data={localEpisodes} // from your local server
        keyExtractor={(ep) => ep.number.toString()}
        renderItem={renderEpisodeItem}
        contentContainerStyle={styles.episodesList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View>{renderHeader()}</View>}
      />
    );
  };

  // Subtitle Selection Modal
  const renderSubtitleSelectionModal = () => {
    return (
      <Modal
        visible={isSubtitleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSubtitleModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSubtitleModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.subtitleModalContainer}>
          <View style={styles.subtitleModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subtitle Language</Text>
              <TouchableOpacity onPress={() => setIsSubtitleModalVisible(false)}>
                <XMarkIcon size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableSubtitles}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.statusOption}
                  onPress={() => {
                    if (currentHlsSource) { // Ensure hlsSource is available
                      setSelectedSubtitle(item);
                      setIsSubtitleModalVisible(false);
                      openVideoWithStreamScreen(currentHlsSource, item.file);
                    } else {
                      Alert.alert('Error', 'Streaming source is not available.');
                    }
                  }}
                >
                  <Text style={styles.statusText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(option) => option.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // -----------------------------------------
  // RETURN: Conditionally render each tab
  // -----------------------------------------
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171717" />
      <SafeAreaView style={styles.container}>
        {activeTab === 'Description' ? (
          <ScrollView style={{ backgroundColor: '#171717' }}>
            {renderHeader()}
            {renderDescriptionTab()}
          </ScrollView>
        ) : (
          renderWatchTab()
        )}

        {/* Subtitle Selection Modal */}
        {renderSubtitleSelectionModal()}

        {/* Loading Indicator for Episode Selection */}
        {isEpisodeLoading && (
          <View style={styles.episodeLoadingOverlay}>
            <ActivityIndicator size="large" color="#5abf75" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* My List Status Modal */}
        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Status</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <XMarkIcon size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={STATUS_OPTIONS}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.statusOption}
                    onPress={() => handleStatusSelection(item.value)}
                  >
                    <Text style={styles.statusText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(option) => option.value}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ----------------------------------
// STYLES
// ----------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingContainer: {
    position: 'absolute',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#262626',
    width: '100%',
    height: '100%'
  },
  retryButton: {
    padding: 15,
    backgroundColor: '#5abf75',
    borderRadius: 30
  },
  retryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: { color: '#ffffff', fontSize: 18, textAlign: 'center' },

  backButton: {
    borderRadius: 25,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 10
  },
  titleContainer: {
    marginTop: -height * 0.09,
    marginBottom: 20
  },
  titleText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5
  },
  myListContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  myListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  myListText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000000'
  },
  subInfoText: {
    color: '#b0b0b0',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10
  },
  genresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  genreBadge: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    marginVertical: 3
  },
  genreText: { color: '#b0b0b0', fontSize: 14, fontWeight: '600' },
  scoreDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 5
  },
  durationText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 5
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  },
  tabButton: {
    marginHorizontal: 20,
    paddingBottom: 5
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5abf75'
  },
  tabText: {
    color: '#ffffff',
    fontSize: 18
  },
  activeTabText: {
    opacity: 1
  },
  synopsisText: {
    color: '#b0b0b0',
    fontSize: 16,
    lineHeight: 22
  },
  showMoreText: {
    color: '#5abf75',
    marginTop: 5,
    fontSize: 16,
    fontWeight: '600'
  },
  trailerContainer: {
    marginTop: 20
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10
  },
  webView: {
    width: '100%',
    height: 200,
    borderRadius: 10
  },
  episodesList: {
    paddingBottom: 20,
    backgroundColor: '#171717'
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 10
  },
  episodeCardCompleted: {
    backgroundColor: '#3a3a3a'
  },
  episodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  episodeText: {
    color: '#ffffff',
    fontSize: 16
  },
  episodeTextCompleted: {
    color: '#4caf50',
    textDecorationLine: 'line-through'
  },
  playIconContainer: {
    backgroundColor: '#5abf75',
    borderRadius: 20,
    padding: 5
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    position: 'absolute',
    top: height / 4,
    left: width * 0.1,
    right: width * 0.1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 5
  },
  subtitleModalContainer: {
    position: 'absolute',
    top: height / 3,
    left: width * 0.05,
    right: width * 0.05,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 5
  },
  modalContent: {},
  subtitleModalContent: {},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000'
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 10
  },
  statusText: {
    fontSize: 16,
    color: '#000000'
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0'
  },

  // Loader for episode selection
  episodeLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  },
  loadingText: {
    color: '#5abf75',
    marginTop: 10,
    fontSize: 16
  },
});
