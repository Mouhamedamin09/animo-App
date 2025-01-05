// CommentsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUser } from '../Context/UserContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XMarkIcon, TrashIcon } from 'react-native-heroicons/outline';
import { ChevronDownIcon, ChevronUpIcon } from 'react-native-heroicons/solid';
import { HeartIcon as HeartOutline } from 'react-native-heroicons/outline';
import { HeartIcon as HeartSolid } from 'react-native-heroicons/solid';

// Utility function to format time differences
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

export default function CommentsScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { userId } = useUser();

  const { animeId, title } = params;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // State for sort order
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing
    await fetchComments(); // Reload the comments
    setRefreshing(false); // Stop refreshing
  };

  useEffect(() => {
    fetchComments();
  }, [sortOrder]);

  // Fetch comments from the server
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://192.168.43.44:3000/comment?animeId=${animeId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('Failed to fetch comments:', response.status);
        Alert.alert('Error', 'Failed to load comments.');
        return;
      }

      const data = await response.json();
      let fetchedComments = data.comments || [];

      // Process comments to include likedByUser
      fetchedComments = fetchedComments.map((comment) => ({
        ...comment,
        // Ensure likedBy is an array before calling includes
        likedByUser: Array.isArray(comment.likedBy) ? comment.likedBy.includes(userId) : false,
        // Optionally, set likedBy to an empty array if undefined
        likedBy: Array.isArray(comment.likedBy) ? comment.likedBy : [],
      }));

      // Sort comments based on sortOrder
      if (sortOrder === 'newest') {
        fetchedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        fetchedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'An error occurred while fetching comments.');
    } finally {
      setLoading(false);
    }
  };

  // Post a new comment
  const postComment = async () => {
    if (commentText.trim() === '') {
      Alert.alert('Empty Comment', 'Please enter a comment before posting.');
      return;
    }

    setPosting(true);
    try {
      const response = await fetch('http://192.168.43.44:3000/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          animeId,
          commentText: commentText.trim(),
        }),
      });

      if (!response.ok) {
        console.log('Failed to post comment:', response.status);
        Alert.alert('Error', 'Failed to post comment.');
        return;
      }

      const data = await response.json();
      if (data && data.comment) {
        const comment = data.comment;
        if (comment._id && comment.commentText) {
          // Ensure likedBy is an array before calling includes
          const likedByArray = Array.isArray(comment.likedBy) ? comment.likedBy : [];
          const likedByUser = likedByArray.includes(userId);
          const newComment = { ...comment, likedByUser, likedBy: likedByArray };

          // Depending on sortOrder, decide where to add the new comment
          if (sortOrder === 'newest') {
            setComments([newComment, ...comments]);
          } else {
            setComments([...comments, newComment]);
          }
          setCommentText('');
        } else {
          console.error('Comment structure is invalid:', comment);
          Alert.alert('Error', 'Invalid comment data received from the server.');
        }
      } else {
        console.error('Unexpected response format:', data);
        Alert.alert('Error', 'Unexpected response from the server.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'An error occurred while posting your comment.');
    } finally {
      setPosting(false);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingCommentId(commentId);
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Authentication Error', 'Please log in again.');
                navigation.replace('Login');
                return;
              }

              const response = await fetch(
                `http://192.168.43.44:3000/comment/${commentId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    userId: userId,
                  }),
                }
              );

              if (!response.ok) {
                console.log('Failed to delete comment:', response.status);
                Alert.alert('Error', 'Failed to delete comment.');
                return;
              }

              setComments(comments.filter((comment) => comment._id !== commentId));
              Alert.alert('Success', 'Comment deleted successfully.');
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'An error occurred while deleting the comment.');
            } finally {
              setDeletingCommentId(null);
            }
          },
        },
      ]
    );
  };

  // Handle Like/Unlike
  const handleLikePress = async (commentId) => {
    if (!userId) {
      Alert.alert('Unauthorized', 'You must be logged in to like comments.');
      return;
    }

    try {
      const response = await fetch(
        `http://192.168.43.44:3000/comment/${commentId}/${userId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('Failed to like/unlike comment:', response.status);
        Alert.alert('Error', 'Failed to like/unlike comment.');
        return;
      }

      const data = await response.json();
      const { likesCount, likedByUser } = data;

      // Update the local state
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === commentId
            ? { ...comment, likesCount, likedByUser }
            : comment
        )
      );
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
      Alert.alert('Error', 'An error occurred while liking/unliking the comment.');
    }
  };

  // Render each comment
  const renderComment = ({ item }) => {
    const isAuthor = item.userId._id === userId;

    const handleReplyPress = () => {
      navigation.navigate('Replies', {
        parentCommentId: item._id,
        animeId: animeId,
        parentUsername: item.userId.username,
      });
    };

    const handleDeletePress = () => {
      deleteComment(item._id);
    };

    const handleProfilePress = () => {
      navigation.navigate('OthersProfile', { userId: item.userId._id });
    };

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileTouchable}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.userId.avatar ? (
                <Image source={{ uri: item.userId.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {item.userId.username[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.commentUser}>{item.userId.username}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.commentText}>{item.commentText}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikePress(item._id)}
          >
            {item.likedByUser ? (
              <HeartSolid size={20} color="#ff4d4d" />
            ) : (
              <HeartOutline size={20} color="#ffffff" />
            )}
            <Text style={styles.actionText}>{item.likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReplyPress}>
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
          {isAuthor && (
            <TouchableOpacity style={styles.actionButton} onPress={handleDeletePress}>
              <TrashIcon size={20} color="#ff4d4d" />
              <Text style={styles.actionText}></Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.commentDate}>{formatTimeDifference(item.createdAt)}</Text>
      </View>
    );
  };

  // Toggle sort order between 'newest' and 'oldest'
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'newest' ? 'oldest' : 'newest'));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <XMarkIcon size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Anime Title */}
      <Text style={styles.animeTitle}>{title}</Text>

      {/* Filter Button */}
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

      {/* Comments List */}
      {loading ? (
        <ActivityIndicator size="large" color="#5abf75" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.commentsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          } 
          ListEmptyComponent={
            <Text style={styles.noCommentsText}>
              No comments yet. Be the first to comment!
            </Text>
          }
        />
      )}

      {/* Comment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 60, android: 78 })}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Add a comment..."
            placeholderTextColor="#888"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={styles.postButton}
            onPress={postComment}
            disabled={posting}
          >
            {posting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  animeTitle: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
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
  commentsList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  commentContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  profileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
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
  commentUser: {
    color: '#5abf75',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: '#b0b0b0',
    fontSize: 14,
    marginLeft: 5,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 5,
  },
  commentText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  commentDate: {
    color: '#b0b0b0',
    fontSize: 12,
    textAlign: 'right',
  },
  noCommentsText: {
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
