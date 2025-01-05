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
} from 'react-native';
import { Bars3CenterLeftIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import TrendingAnime from '../components/trendingAnime';
import AnimeList from '../components/AnimeList';
import Loading from './loading';
import { fetchTrendingAnimes, fetchUpcomingAnimes, fetchTopAnimes, fetchRecommendation } from './api/AnimeDB';
import { Drawer } from 'react-native-drawer-layout';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation ,useFocusEffect} from '@react-navigation/native';

const ios = Platform.OS === 'ios';

export default function HomeScreen() {
    const navigation = useNavigation();

    const [Trending, setTrending] = useState([]);
    const [upComing, setUpcoming] = useState([]);
    const [TopRated, setTopRated] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);



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

    // Placeholder user state
    const [user, setUser] = useState({
        isLoggedIn: false,
        name: 'Login',
        avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
    });

    useEffect(() => {
        getTrandingAnimes();
        getUpcomingAnimes();
        getUpTopAnimes();
        getRecommendationAnimes();
    }, []);

    const getTrandingAnimes = async () => {
        const data = await fetchTrendingAnimes();
        if (data && data.data) setTrending(data.data);
    };

    const getUpcomingAnimes = async () => {
        const data = await fetchUpcomingAnimes();
        if (data && data.data) setUpcoming(data.data);
    };

    const getUpTopAnimes = async () => {
        const data = await fetchTopAnimes();
        if (data && data.data) setTopRated(data.data);
    };

    const getRecommendationAnimes = async () => {
        const data = await fetchRecommendation();
        if (data && data.data) setRecommendations(data.data);
    };

    const renderNavigationView = () => (
        <View style={styles.drawerContainer}>
            {/* User Information Section */}
            <TouchableOpacity
                style={styles.userSection}
                onPress={() => navigation.navigate(user.isLoggedIn ? 'Profile' : 'Login')}
            >
                <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                <Text style={styles.userName}>{user.name}</Text>
            </TouchableOpacity>

            <View style={styles.section}>
            <TouchableOpacity
                    style={styles.sectionItem}
                    onPress={() => navigation.navigate('Seasons')} 
    >
                    <Icon name="calendar-outline" size={24} color="white" />
                    <Text style={styles.sectionText}>Seasons</Text>
            </TouchableOpacity>

                <TouchableOpacity style={styles.sectionItem} onPress={() => {}}>
                    <Icon name="people-outline" size={24} color="white" />
                    <Text style={styles.sectionText}>Top Characters</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionItem} onPress={() => {}}>
                    <Icon name="list-outline" size={24} color="white" />
                    <Text style={styles.sectionText}>My List</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            <View style={styles.section}>
                <TouchableOpacity style={styles.sectionItem} onPress={() => {}}>
                    <Icon name="clipboard-outline" size={24} color="white" />
                    <Text style={styles.sectionText}>Daily Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionItem} onPress={() => {}}>
                    <Icon name="bulb-outline" size={24} color="white" />
                    <Text style={styles.sectionText}>Anime IQ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionItem} onPress={() => {}}>
                    <Icon name="help-circle-outline" size={24} color="white" />
                    <Text style={styles.sectionText}>Quizzes</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            <View style={styles.section}>
                <TouchableOpacity style={styles.sectionItem} onPress={() => {}}>
                    <Icon name="clipboard-outline" size={24} color="white" />
                    <Text style={styles.sectionText}>Character AI</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionItem} onPress={() => {}}>
                    <Icon name="settings-outline" size={24} color="white" />
                    <Text style={styles.sectionText}>Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Drawer
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            drawerPosition="left"
            drawerType="front"
            drawerStyle={{ width: 300 }}
            renderDrawerContent={renderNavigationView}
        >
            <View style={styles.container}>
                <SafeAreaView style={ios ? styles.safeAreaIOS : styles.safeAreaAndroid}>
                    <StatusBar style="light" backgroundColor="#262626" />
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setOpen(true)}>
                            <Bars3CenterLeftIcon size={30} strokeWidth={2} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>
                            <Text style={{ color: '#5abf75' }}>A</Text>nimo
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                            <MagnifyingGlassIcon size={30} strokeWidth={2} color="white" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                {loading ? (
                    <Loading />
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
                        <TrendingAnime data={Trending} />
                        <AnimeList title="Upcoming" data={upComing} />
                        <AnimeList title="Top Rated" data={TopRated} />
                        <AnimeList title="Recommendations" data={recommendations} />
                    </ScrollView>
                )}
            </View>
        </Drawer>
    );
}

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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollViewContent: {
        paddingBottom: 10,
    },
    drawerContainer: {
        flex: 1,
        backgroundColor: '#262626',
        padding: 20,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 10,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    userName: {
        color: 'white',
        fontSize: 18,
    },
    section: {
        marginVertical: 10,
    },
    sectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    sectionText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 10,
    },
    separator: {
        height: 1,
        backgroundColor: '#444',
        marginVertical: 10,
    },
});
