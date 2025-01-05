import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    StatusBar,
    Platform,
    TouchableOpacity,
    ScrollView,
    Image,
    BackHandler,
    Alert,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../Context/UserContext';
import axios from 'axios';

// Import custom components
import TrendingAnime from '../components/trendingAnime';
import AnimeList from '../components/AnimeList';
import Loading from './loading';
import NewEpisodes from '../components/NewEpisodes';

// Import API functions
import { fetchTrendingAnimes, fetchUpcomingAnimes, fetchTopAnimes, fetchRecommendation } from './api/AnimeDB';

// Import Layout
import Layout from '../Layouts/Layout'; // Adjust the path as necessary

const ios = Platform.OS === 'ios';
const { width, height } = Dimensions.get('window');

export default function LoggedHomeScreen() { 
    const navigation = useNavigation();
    const route = useRoute();
    const { userName, userId, setUserId, setUserName, avatar, setAvatar } = useUser();

    const [Trending, setTrending] = useState([]);
    const [upComing, setUpcoming] = useState([]);
    const [TopRated, setTopRated] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [newEpisodes, setNewEpisodes] = useState([]);

    // Generate a random avatar URL
    function getRandomAvatar() {
        const randomSeed = Math.floor(Math.random() * 1000);
        return `https://robohash.org/${randomSeed}.png?set=set5`;
    }

    // Fetch and set user information from route params
    useEffect(() => {
        const { userName: routeUserName, userId: routeUserId } = route.params || {};
        if (routeUserId) {
            setUserId(routeUserId);
        }
        if (routeUserName) {
            setUserName(routeUserName);
        }
        if (!avatar) {
            const newAvatar = getRandomAvatar();
            setAvatar(newAvatar);
            updateUserAvatar(newAvatar);
        }
    }, [route.params]);

    // Fetch anime data on component mount
    useEffect(() => {
        fetchAllAnimeData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAllAnimeData();
        setRefreshing(false);
    };

    // Function to fetch all anime lists
    const fetchAllAnimeData = async () => {
        setLoading(true);
        try {
            const trendingData = await fetchTrendingAnimes();
            if (trendingData && trendingData.data) setTrending(trendingData.data);

            const upcomingData = await fetchUpcomingAnimes();
            if (upcomingData && upcomingData.data) setUpcoming(upcomingData.data);

            const topRatedData = await fetchTopAnimes();
            if (topRatedData && topRatedData.data) setTopRated(topRatedData.data);

            const recommendationData = await fetchRecommendation();
            if (recommendationData && recommendationData.data) setRecommendations(recommendationData.data);

           
        } catch (error) {
            console.error('Error fetching anime data:', error);
            Alert.alert('Error', 'Failed to fetch anime data.');
        } finally {
            setLoading(false);
        }
    };

   


    // Handle Android back button to confirm exit
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                Alert.alert('Exit App', 'Are you sure you want to exit?', [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Yes',
                        onPress: () => BackHandler.exitApp(),
                    },
                ]);
                return true; // Prevent default back action
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [])
    );

    // Function to update user avatar in backend
    const updateUserAvatar = async (avatarUrl) => {
        try {
           

           

            console.log('userId:', userId, 'avatar:', avatarUrl);

            const response = await axios.post(
                'http://192.168.43.44:3000/avatar', // Replace with your backend URL
                { userId: userId, avatar: avatarUrl },
              
            );

            if (response.status === 200) {
                console.log('Avatar updated with:', response.data.avatar);
                setAvatar(response.data.avatar); // Update avatar from response if different
            }
        } catch (error) {
            console.error('Error updating avatar:', error.response?.data?.message || error.message);
            Alert.alert('Error', 'Failed to update avatar. Please try again.');
        }
    };

    return (
        <Layout>
            {loading ? (
                <Loading />
            ) : (
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    
                    {/* Trending Anime Section */}
                    <TrendingAnime data={Trending} />

                   

                    {/* Upcoming Anime Section */}
                    <AnimeList title="Upcoming" data={upComing} />

                    {/* Top Rated Anime Section */}
                    <AnimeList title="Top Rated" data={TopRated} />

                    {/* Recommendations Anime Section */}
                    <AnimeList title="Recommendations" data={recommendations} />
                </ScrollView>
            )}
        </Layout>
    );
}

// Stylesheet
const styles = StyleSheet.create({
    scrollViewContent: {
        paddingBottom: 20,
    },
});
