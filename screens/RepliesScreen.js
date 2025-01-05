import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUser } from '../Context/UserContext'; // Adjust the path as needed
import { XMarkIcon } from 'react-native-heroicons/outline';
import { ChevronDownIcon, ChevronUpIcon } from 'react-native-heroicons/solid';

const formatTimeDifference = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};

export default function RepliesScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { userId } = useUser();

  const { parentCommentId, animeId, parentUsername } = params;

  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    fetchReplies();
  }, [sortOrder]);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://192.168.43.44:3000/reply?parentCommentId=${parentCommentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('Failed to fetch replies:', response.status);
        Alert.alert('Error', 'Failed to load replies.');
        return;
      }

      const data = await response.json();
      let fetchedReplies = data.replies || [];

      fetchedReplies.sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
      });

      setReplies(fetchedReplies);
    } catch (error) {
      console.error('Error fetching replies:', error);
      Alert.alert('Error', 'An error occurred while fetching replies.');
    } finally {
      setLoading(false);
    }
  };

  const postReply = async () => {
    if (replyText.trim() === '') {
      Alert.alert('Empty Reply', 'Please enter a reply before posting.');
      return;
    }

    setPosting(true);
    try {
      const response = await fetch('http://192.168.43.44:3000/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          animeId,
          parentCommentId,
          replyText: replyText.trim(),
        }),
      });

      if (!response.ok) {
        console.log('Failed to post reply:', response.status);
        Alert.alert('Error', 'Failed to post reply.');
        return;
      }

      const data = await response.json();
      if (data && data.reply) {
        const reply = data.reply;
        if (reply._id && reply.replyText) {
          if (sortOrder === 'newest') {
            setReplies([reply, ...replies]);
          } else {
            setReplies([...replies, reply]);
          }
          setReplyText('');
        } else {
          console.error('Reply structure is invalid:', reply);
          Alert.alert('Error', 'Invalid reply data received from the server.');
        }
      } else {
        console.error('Unexpected response format:', data);
        Alert.alert('Error', 'Unexpected response from the server.');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'An error occurred while posting your reply.');
    } finally {
      setPosting(false);
    }
  };

  const deleteReply = async (replyId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingReplyId(replyId);
            try {
              const response = await fetch(
                `http://192.168.43.44:3000/reply/${replyId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (!response.ok) {
                console.log('Failed to delete reply:', response.status);
                Alert.alert('Error', 'Failed to delete reply.');
                return;
              }

              const data = await response.json();
              console.log('Delete Reply Response:', data);

              if (data.message === 'Reply deleted successfully.') {
                setReplies(replies.filter((reply) => reply._id !== replyId));
              } else {
                console.error('Unexpected delete reply response:', data);
                Alert.alert('Error', 'Unexpected response from the server.');
              }
            } catch (error) {
              console.error('Error deleting reply:', error);
              Alert.alert('Error', 'An error occurred while deleting the reply.');
            } finally {
              setDeletingReplyId(null);
            }
          },
        },
      ]
    );
  };

  const renderReply = ({ item }) => {
    const { userId: user, replyText, createdAt, _id } = item;
    const isAuthor = user._id === userId;

    return (
      <View style={styles.replyContainer}>
        <View style={styles.replyHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {user.username[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.replyUser}>{user.username}</Text>
          </View>
          {isAuthor && (
            <TouchableOpacity
              onPress={() => deleteReply(_id)}
              style={styles.deleteButton}
            >
              <XMarkIcon size={20} color="#ff4d4d" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.replyText}>{replyText}</Text>
        <Text style={styles.replyDate}>{formatTimeDifference(createdAt)}</Text>
      </View>
    );
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'newest' ? 'oldest' : 'newest'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <XMarkIcon size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Replies to {parentUsername}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={toggleSortOrder} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </Text>
          {sortOrder === 'newest' ? (
            <ChevronDownIcon size={20} color="#ffffff" />
          ) : (
            <ChevronUpIcon size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5abf75" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={replies}
          renderItem={renderReply}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.repliesList}
          ListEmptyComponent={
            <Text style={styles.noRepliesText}>
              No replies yet. Be the first to reply!
            </Text>
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 60, android: 78 })}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Add a reply..."
            placeholderTextColor="#888"
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity
            style={styles.postButton}
            onPress={postReply}
            disabled={posting}
          >
            {posting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.postButtonText}>Reply</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#262626',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  filterContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginRight: 5,
  },
  repliesList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  replyContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5abf75',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarPlaceholderText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  replyUser: {
    color: '#5abf75',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 5,
  },
  replyText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  replyDate: {
    color: '#b0b0b0',
    fontSize: 12,
    textAlign: 'right',
  },
  noRepliesText: {
    color: '#b0b0b0',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    padding: 10,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: '#5abf75',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
