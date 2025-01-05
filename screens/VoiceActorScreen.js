import { View, Text, Dimensions, Platform, ScrollView, SafeAreaView, Animated, Image, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { HeartIcon as MiniHeartIcon } from 'react-native-heroicons/mini';
import Loading from './loading';
import { fetchPersonById } from './api/AnimeDB';
import { useNavigation, useRoute } from '@react-navigation/native';

var { width, height } = Dimensions.get("window");
const ios = Platform.OS == "ios";

export default function VoiceActorScreen() {
  const [heartScale] = useState(new Animated.Value(1));
  const [isFavourite, setIsFavourite] = useState(true);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [voiceActorData, setVoiceActorData] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const route = useRoute();
  const { actorId } = route.params;

  useEffect(() => {
    const getVoiceActorData = async () => {
      setLoading(true);
      try {
        const data = await fetchPersonById(actorId).then(res => res.data);
        setVoiceActorData(data);
        console.log(actorId)
        
      } catch (error) {
        console.error('Error fetching voice actor data:', error);
      } finally {
        setLoading(false);
      }
    };

    getVoiceActorData();
  }, [actorId]);

  const toggleFavorite = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    setIsFavourite(!isFavourite);
  };

  const getDetail = (detail) => detail || 'Unknown';

  return (
    <ScrollView className="flex-1 bg-neutral-900" contentContainerStyle={{ paddingBottom: 20 }}>
      <SafeAreaView style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ borderRadius: 20, padding: 10, flexDirection: 'row', alignItems: 'center' }}>
          <ChevronLeftIcon size={28} strokeWidth={2.5} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFavorite}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <MiniHeartIcon size={35} color={isFavourite ? "#5abf75" : "white"} />
          </Animated.View>
        </TouchableOpacity>
      </SafeAreaView>

      {loading ? (
        <Loading />
      ) : (
        voiceActorData && (
          <View>
            <View className="flex-row justify-center">
              <View className="items-center rounded-full overflow-hidden h-64 w-64 border-2 border-neutral-500">
                <Image source={{ uri: voiceActorData.images.jpg.image_url }} style={{ height: height * 0.43, width: width * 0.74 }} />
              </View>
            </View>
            <View className="mt-6">
              <Text className="text-3xl text-white font-bold text-center">{voiceActorData.name}</Text>
              <Text className="text-base text-neutral-500 text-center">{voiceActorData.favorites} ♡ liked this Voice Actor</Text>
            </View>
            <View className="mx-3 mt-6 flex-row justify-between items-center bg-neutral-700 rounded-full">
              <View className="border-r-2 border-r-neutral-400 px-2 item-center">
                <Text className="text-white font-semibold">Name</Text>
                <Text className="text-neutral-300 text-sm">{getDetail(voiceActorData.given_name)}</Text>
              </View>
              <View className="border-r-2 border-r-neutral-400 px-4 item-center">
                <Text className="text-white font-semibold">F-Name</Text>
                <Text className="text-neutral-300 text-sm">{getDetail(voiceActorData.family_name)}</Text>
              </View>
              <View className="border-r-2 border-r-neutral-400 px-4 item-center">
                <Text className="text-white font-semibold">Birthday</Text>
                <Text className="text-neutral-300 text-sm">{getDetail(voiceActorData.birthday).slice(0,10)}</Text>
              </View>
              <View className="px-4 item-center">
                <Text className="text-white font-semibold">Website</Text>
                <Text className="text-neutral-300 text-sm">{voiceActorData.website_url ? 'Available' : 'N/A'}</Text>
              </View>
            </View>
            <View className="my-6 mx-4 space-y-2">
              <Text className="text-white text-lg">Biography</Text>
              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <Text className="text-neutral-400 tracking-wide">
                {voiceActorData.about ? 
                (showAll ? voiceActorData.about : voiceActorData.about.length > 450 ? `${voiceActorData.about.slice(0, 450)}...` : voiceActorData.about)
                : 'No biography provided'}

                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      )}
    </ScrollView>
  );
}
