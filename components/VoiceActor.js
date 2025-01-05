import React from 'react';
import { View, Text, Image, Dimensions, ActivityIndicator } from 'react-native';
import { TouchableOpacity, GestureHandlerRootView, ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

var { width, height } = Dimensions.get('window');

export default function VoiceActor({ title, data, hideSeeAll }) {
  const navigation = useNavigation();

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5abf75" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <View className="mb-8 space-y-4">
        <View className="mx-4 flex-row justify-between items-center">
          <Text className="text-white text-xl">{title}</Text>
          <TouchableOpacity>
            {!hideSeeAll && <Text style={{ color: '#5abf75' }} className="text-lg">See All</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}>
          {data.slice(0, 10).map((item, index) => (
            <TouchableWithoutFeedback key={index} onPress={() => navigation.push('VoiceActor', { actorId: item.person.mal_id })}>
              <View className="space-y-1 mr-4">
                <Image
                  source={{ uri: item.person.images ? item.person.images.jpg.image_url : null }}
                  className="rounded-3xl"
                  style={{ width: width * 0.33, height: height * 0.22 }}
                />
                <Text className="text-neutral-300 ml-1 mt-2">{item.person.name?.length > 14 ? item.person.name.slice(0, 14) + '...' : item.person.name}</Text>
              </View>
            </TouchableWithoutFeedback>
          ))}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}
