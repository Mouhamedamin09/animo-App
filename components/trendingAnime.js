import React from 'react';
import { View, Text, TouchableWithoutFeedback, Dimensions, Image, ActivityIndicator } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
const { width, height } = Dimensions.get('window');

export default function TrendingAnime({ data }) {
  const navigation = useNavigation(); // Initialize navigation
  const handleClick = (item) => {
    navigation.navigate('Anime', item);
  };

  if (!data || data.length === 0) {
    // Show loading state if data is not available
    return (
      <View style={{ marginBottom: 8, alignItems: 'center',height:height*0.4 }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: 'white', fontSize: 20, marginLeft: 12, marginBottom: 15 }}>Trending</Text>
      <Carousel
        data={data}
        renderItem={({ item }) => <AnimeCard item={item} handleClick={() => handleClick(item)} />} // Pass item to handleClick
        firstItem={1}
        inactiveSlideOpacity={0.6}
        sliderWidth={width}
        itemWidth={width * 0.62}
        slideStyle={{ display: 'flex', alignItems: 'center' }}
      />
    </View>
  );
}

const AnimeCard = ({ item, handleClick }) => {
  return (
    <TouchableWithoutFeedback onPress={handleClick}>
      <Image
        source={{ uri: item.images.jpg.large_image_url }}
        style={{
          width: width * 0.6,
          height: height * 0.4,
          borderRadius: 10, // Add border radius for rounded corners 
        }}
      />
    </TouchableWithoutFeedback>
  );
};
