// TopCharacters.js
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator, 
    RefreshControl,
    Dimensions,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { fetchTopCharacters } from './api/AnimeDB'; // Adjust the path based on your project structure
import Icon from 'react-native-vector-icons/Ionicons';
import Layout from '../Layouts/Layout'; // Adjust the path based on your project structure

const { width } = Dimensions.get('window');

const TopCharacters = () => {
    const navigation = useNavigation(); // Access navigation object
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadCharacters();
    }, [page]);

    const loadCharacters = async () => {
        if (page === 1) {
            setLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const data = await fetchTopCharacters(page);
            if (data.data && data.data.length > 0) {
                setCharacters(prev => [...prev, ...data.data]);
            } else {
                setHasMore(false); // No more data to load
            }
        } catch (error) {
            console.error('Error fetching top characters:', error);
            // Optionally, show an alert or a message to the user
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setCharacters([]);
        setPage(1);
        setHasMore(true);
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    };

    const getBadge = (rank) => {
        switch(rank) {
            case 1:
                return { color: '#FFD700', icon: 'star' }; // Gold
            case 2:
                return { color: '#C0C0C0', icon: 'star-outline' }; // Silver
            case 3:
                return { color: '#CD7F32', icon: 'star-half' }; // Bronze
            default:
                return null;
        }
    };

    const renderTopThree = () => {
        const topThree = characters.slice(0, 3);
        return (
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.topThreeContainer}
                contentContainerStyle={{ paddingHorizontal: 10 }}
            >
                {topThree.map((item, index) => {
                    const badge = getBadge(index + 1);
                    return (
                        <TouchableOpacity 
                            key={item.mal_id} 
                            style={styles.topCard}
                            onPress={() => navigation.navigate('Character', { character: item })} // Navigate to CharacterScreen
                            activeOpacity={0.8}
                        >
                            <View style={[styles.badge, { backgroundColor: badge.color }]}>
                                <Icon name={badge.icon} size={16} color="#ffffff" />
                                <Text style={styles.badgeText}>{index + 1}</Text>
                            </View>
                            <Image 
                                source={{ uri: item.images.jpg.image_url }} 
                                style={styles.topAvatar} 
                                PlaceholderContent={<ActivityIndicator />}
                            />
                            <Text style={styles.topName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.topFavoritesContainer}>
                                <Icon name="heart" size={14} color="#ff6b6b" />
                                <Text style={styles.topFavoritesText}>{item.favorites}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    const renderItem = ({ item, index }) => {
        if (index < 3) {
            return null; // Top three are rendered separately
        }
        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => navigation.navigate('Character', { character: item })} // Navigate to CharacterScreen
                activeOpacity={0.8}
            >
                <Image 
                    source={{ uri: item.images.jpg.image_url }} 
                    style={styles.avatar} 
                    PlaceholderContent={<ActivityIndicator />}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.favoritesContainer}>
                        <Icon name="heart" size={16} color="#ff6b6b" />
                        <Text style={styles.favoritesText}>{item.favorites}</Text>
                    </View>
                </View>
                <Icon name="chevron-forward" size={24} color="#ffffff" />
            </TouchableOpacity>
        );
    };

    const keyExtractor = (item) => item.mal_id.toString();

    const ListHeaderComponent = () => {
        if (characters.length > 0) {
            return renderTopThree();
        }
        return null;
    };

    if (loading && page === 1) {
        return (
            <Layout>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            <FlatList
                data={characters}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={handleRefresh} 
                        colors={['#5abf75']}
                        tintColor="#5abf75"
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="sad-outline" size={50} color="#b0b0b0" />
                        <Text style={styles.emptyText}>No characters found.</Text>
                    </View>
                }
                // Remove top three from the main list to prevent duplication
                extraData={characters}
            />
        </Layout>
    );
};

const styles = StyleSheet.create({
    list: {
        padding: 10,
    },
    topThreeContainer: {
        marginVertical: 10,
    },
    topCard: {
        width: width * 0.6,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 15,
        marginRight: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 10,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: 'bold',
    },
    topAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3a3a3a',
    },
    topName: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
        textAlign: 'center',
    },
    topFavoritesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    topFavoritesText: {
        color: '#ff6b6b',
        fontSize: 14,
        marginLeft: 5,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3a3a3a',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    name: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    favoritesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    favoritesText: {
        color: '#ff6b6b',
        fontSize: 14,
        marginLeft: 5,
    },
    footer: {
        paddingVertical: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        color: '#b0b0b0',
        fontSize: 16,
        marginTop: 10,
    },
});

export default TopCharacters;
