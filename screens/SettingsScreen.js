// screens/SettingsScreen.js

import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Switch, 
    ScrollView, 
    Alert 
} from 'react-native';
import Layout from '../Layouts/Layout'; // Adjust the path as necessary
import Icon from 'react-native-vector-icons/Ionicons'; // Ensure you have this library installed
import { useNavigation } from '@react-navigation/native'; // Import navigation if needed
import { useUser } from '../Context/UserContext'; // Import UserContext
import { themes } from './theme'; // Import themes

const SettingsScreen = () => {
    const navigation = useNavigation(); // Initialize navigation
    const { theme, setTheme } = useUser(); 
    const currentTheme = themes[theme] || themes.dark;

    // Function to toggle theme
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    // Placeholder logout function
    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                { 
                    text: "OK", 
                    onPress: () => {
                        // TODO: Add your logout logic here
                        // For example:
                       
                        navigation.replace('Home'); // Navigate to Login screen
                        console.log("User logged out");
                    } 
                }
            ],
            { cancelable: false }
        );
    };

    return (
        <Layout>
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.heading, { color: currentTheme.text }]}>Settings</Text>

                {/* Appearance Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Appearance</Text>
                    <View style={styles.toggleContainer}>
                        <View style={styles.toggleLabelContainer}>
                            <Icon 
                                name={theme === 'dark' ? "moon-outline" : "sunny-outline"} 
                                size={24} 
                                color={currentTheme.iconColor} 
                                style={styles.icon}
                            />
                            <Text style={[styles.toggleLabel, { color: currentTheme.text }]}>Dark Mode</Text>
                        </View>
                        <Switch 
                            value={theme === 'dark'} 
                            onValueChange={toggleTheme} 
                            trackColor={{ false: currentTheme.toggleTrackFalse, true: currentTheme.toggleTrackTrue }}
                            thumbColor={currentTheme.toggleThumb}
                        />
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Notifications</Text>
                    <View style={styles.toggleContainer}>
                        <View style={styles.toggleLabelContainer}>
                            <Icon 
                                name="notifications-outline" 
                                size={24} 
                                color={currentTheme.iconColor} 
                                style={styles.icon}
                            />
                            <Text style={[styles.toggleLabel, { color: currentTheme.text }]}>Daily Quiz Notifications</Text>
                        </View>
                        <Switch 
                            value={true} // Replace with actual notification state
                            onValueChange={() => {}} // Replace with actual handler
                            trackColor={{ false: currentTheme.toggleTrackFalse, true: currentTheme.toggleTrackTrue }}
                            thumbColor={currentTheme.toggleThumb}
                        />
                    </View>
                    <View style={styles.toggleContainer}>
                        <View style={styles.toggleLabelContainer}>
                            <Icon 
                                name="chatbubble-outline" 
                                size={24} 
                                color={currentTheme.iconColor} 
                                style={styles.icon}
                            />
                            <Text style={[styles.toggleLabel, { color: currentTheme.text }]}>New Comment Notifications</Text>
                        </View>
                        <Switch 
                            value={true} // Replace with actual notification state
                            onValueChange={() => {}} // Replace with actual handler
                            trackColor={{ false: currentTheme.toggleTrackFalse, true: currentTheme.toggleTrackTrue }}
                            thumbColor={currentTheme.toggleThumb}
                        />
                    </View>
                </View>

                {/* About Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>About</Text>
                    <TouchableOpacity 
                        style={styles.aboutItem} 
                        onPress={() => {
                            // Navigate to About screen or handle accordingly
                            console.log("Navigate to About");
                        }}
                    >
                        <View style={styles.aboutContent}>
                            <Icon 
                                name="information-circle-outline" 
                                size={24} 
                                color={currentTheme.iconColor} 
                                style={styles.icon}
                            />
                            <Text style={[styles.aboutText, { color: currentTheme.text }]}>About This App</Text>
                        </View>
                        <Icon 
                            name="chevron-forward" 
                            size={24} 
                            color={currentTheme.iconColor} 
                        />
                    </TouchableOpacity>
                </View>

                {/* App Info Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>App Info</Text>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: currentTheme.text }]}>Version</Text>
                        <Text style={[styles.infoValue, { color: currentTheme.text }]}>1.0.0</Text>
                    </View>
                </View>

                {/* Top Donors Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Top Donors</Text>
                    {/* Example Donor Items */}
                    <View style={styles.donorItem}>
                        <Text style={[styles.donorName, { color: currentTheme.text }]}>Alice</Text>
                        <Text style={[styles.donorAmount, { color: currentTheme.text }]}>$100</Text>
                    </View>
                    <View style={styles.donorItem}>
                        <Text style={[styles.donorName, { color: currentTheme.text }]}>Bob</Text>
                        <Text style={[styles.donorAmount, { color: currentTheme.text }]}>$80</Text>
                    </View>
                    <View style={styles.donorItem}>
                        <Text style={[styles.donorName, { color: currentTheme.text }]}>Charlie</Text>
                        <Text style={[styles.donorAmount, { color: currentTheme.text }]}>$60</Text>
                    </View>
                </View>

                {/* Share App Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <TouchableOpacity 
                        style={[styles.shareButton, { backgroundColor: currentTheme.buttonBackground }]} 
                        onPress={() => {
                            // Implement share functionality
                            console.log("Share this app");
                        }}
                    >
                        <View style={styles.shareContent}>
                            <Icon 
                                name="share-social-outline" 
                                size={24} 
                                color={currentTheme.buttonText} 
                                style={styles.icon}
                            />
                            <Text style={[styles.shareText, { color: currentTheme.buttonText }]}>Share This App</Text>
                        </View>
                        <Icon 
                            name="chevron-forward" 
                            size={24} 
                            color={currentTheme.buttonText} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Account Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <TouchableOpacity 
                        style={[styles.logoutButton, { backgroundColor: currentTheme.logoutBackground }]} 
                        onPress={handleLogout}
                    >
                        <View style={styles.logoutContent}>
                            <Icon 
                                name="log-out-outline" 
                                size={24} 
                                color={currentTheme.logoutText} 
                                style={styles.icon}
                            />
                            <Text style={[styles.logoutText, { color: currentTheme.logoutText }]}>Logout</Text>
                        </View>
                        <Icon 
                            name="chevron-forward" 
                            size={24} 
                            color={currentTheme.logoutText} 
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </Layout>
    );

};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flexGrow: 1,
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    section: {
        marginBottom: 30,
        borderRadius: 10,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    toggleLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 16,
        marginLeft: 10,
    },
    icon: {
        width: 24,
        height: 24,
    },
    aboutItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    aboutContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aboutText: {
        fontSize: 16,
        marginLeft: 10,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    infoLabel: {
        fontSize: 16,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    donorItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 8,
    },
    donorName: {
        fontSize: 16,
    },
    donorAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    shareButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    shareContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shareText: {
        fontSize: 16,
        marginLeft: 10,
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        marginLeft: 10,
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
