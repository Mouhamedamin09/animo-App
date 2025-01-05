// components/Layout.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, Image, Platform, StatusBar, StyleSheet, ActivityIndicator } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Bars3CenterLeftIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { useUser } from '../Context/UserContext';
import axios from 'axios'; // Import Axios

// Import local image as fallback or default avatar
import jamesAvatar from '../assets/james.webp';

const Layout = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [activeScreen, setActiveScreen] = useState('Home');
    const navigation = useNavigation();
    const route = useRoute();
    const isFocused = useIsFocused();
    const { userId, theme, authToken } = useUser(); // Assuming you have authToken in your context

    // New state for fetched user data
    const [fetchedUserName, setFetchedUserName] = useState('');
    const [fetchedAvatar, setFetchedAvatar] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Handler for "My List" navigation
    const handleMyListPress = () => {
        if (userId) {
            navigation.navigate('LoggedHome');
            setActiveScreen('LoggedHome');
        } else {
            navigation.navigate('Home');
            setActiveScreen('Home');
        }
        setOpen(false);
    };

    // Fetch user data from /data endpoint
    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching user data...'+userId);
            const response = await axios.get(`http://192.168.43.44:3000/data?userId=${userId}`, {
    
              
            });

            const { userData } = response.data;
            setFetchedUserName(userData.username);
            setFetchedAvatar(userData.avatar);
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to load user data.');
            // Optionally, you can fallback to useUser() data here
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isFocused) {
            setActiveScreen(route.name);
        }
    }, [isFocused, route]);

    const renderNavigationView = () => (
        <View style={[styles.drawerContainer, { backgroundColor: theme === 'dark' ? '#262626' : '#fff' }]}>
            {loading ? (
                <ActivityIndicator size="large" color="#5abf75" style={{ marginTop: 20 }} />
            ) : error ? (
                <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error}</Text>
            ) : (
                <TouchableOpacity style={styles.userSection} onPress={() => {
                    navigation.navigate('Profile', { userId });
                    setOpen(false);
                }}>
                    {/* Display fetched avatar from API or fallback to default */}
                    <Image 
                        source={fetchedAvatar ? { uri: fetchedAvatar } : jamesAvatar} 
                        style={styles.userAvatar} 
                    />
                    <Text style={[styles.userName, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                        {fetchedUserName}
                    </Text>
                </TouchableOpacity>
            )}
            {/* Sections */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.sectionItem, activeScreen === 'Seasons' && styles.activeItem]}
                    onPress={() => { 
                        navigation.navigate('Seasons'); 
                        setOpen(false); 
                        setActiveScreen('Seasons'); 
                    }}
                >
                    <Icon name="calendar-outline" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Seasons</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                     style={[styles.sectionItem, activeScreen === 'TopCharacters' && styles.activeItem]} 
                    onPress={() => { 
                        navigation.navigate('TopCharacters'); 
                        setOpen(false);
                        setActiveScreen('TopCharacters');
                    }}
                >
                    <Icon name="people-outline" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Top Characters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.sectionItem, (activeScreen === 'Home' || activeScreen === 'LoggedHome') && styles.activeItem]}
                    onPress={handleMyListPress}
                >
                    <Icon name="list-outline" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>My List</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.separator, { backgroundColor: theme === 'dark' ? '#444' : '#ccc' }]} />
            {/* Quizzes */}
            <View style={styles.section}>
                <TouchableOpacity 
                    style={styles.sectionItem} 
                    onPress={() => { 
                        navigation.navigate('DailyQuiz'); 
                        setOpen(false);
                        setActiveScreen('DailyQuiz');
                    }}
                >
                    <Icon name="clipboard-outline" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Daily Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.sectionItem} 
                    onPress={() => { 
                        navigation.navigate('AnimeIQ'); 
                        setOpen(false);
                        setActiveScreen('Anime IQ');
                    }}
                >
                    <Icon name="bulb-outline" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Anime IQ</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.sectionItem} 
                    onPress={() => { 
                        navigation.navigate('Quizzes'); 
                        setOpen(false);
                        setActiveScreen('Quizzes');
                    }}
                >
                    <Icon name="help-circle-outline" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Quizzes</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.separator, { backgroundColor: theme === 'dark' ? '#444' : '#ccc' }]} />
            {/* Settings */}
            <View style={styles.section}>
                <TouchableOpacity 
                    style={styles.sectionItem} 
                    onPress={() => { 
                        navigation.navigate('Settings'); 
                        setOpen(false);
                        setActiveScreen('Settings');
                    }}
                >
                    <Icon name="settings-outline" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>Settings</Text>
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
            <View style={[styles.mainContainer, { backgroundColor: theme === 'dark' ? '#262626' : '#fff' }]}>
                <SafeAreaView style={Platform.OS === "ios" ? styles.safeAreaIOS : styles.safeAreaAndroid}>
                    <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme === 'dark' ? "#262626" : "#fff"} />
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setOpen(true)}>
                            <Bars3CenterLeftIcon size={30} color={theme === 'dark' ? "white" : "black"} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                            {activeScreen === "Home" || activeScreen === "LoggedHome"
                                ? <Text style={{ color: "#5abf75" }}>A</Text> 
                                : <Text style={{ color: "#5abf75" }}>{activeScreen.slice(0,1)}</Text>}
                            {activeScreen === "Home" || activeScreen === "LoggedHome" ? "nimo" : activeScreen.slice(1)}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
                            <MagnifyingGlassIcon size={30} color={theme === 'dark' ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
                {children}
            </View>
        </Drawer>
    );
}

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        padding: 0,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 20,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        marginVertical: 10,
    },
    sectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingLeft: 20,
    },
    sectionText: {
        fontSize: 16,
        marginLeft: 10,
    },
    separator: {
        height: 1,
        marginVertical: 10,
        marginHorizontal: 20,
    },
    activeItem: {
        backgroundColor: '#5abf751f',
    },
    mainContainer: {
        flex: 1,
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
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default Layout;
