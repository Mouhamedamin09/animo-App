import React from 'react';
import { View, Text, Image, Dimensions, ActivityIndicator ,Linking} from 'react-native';
import { TouchableOpacity, GestureHandlerRootView, ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';

var { width, height } = Dimensions.get('window');

export default function GalerieList({ title, data, hideSeeAll }) {

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
          {
            data.slice(0, 10).map((item, index) => (
                <TouchableWithoutFeedback key={index} onPress={() => { Linking.openURL(item.jpg.image_url); }}>
                <View className="space-y-1 mr-4">
                  <Image
                    source={{ uri: item.jpg ? item.jpg.image_url : null }}
                    className="3xl"
                    style={{ width: width * 0.33, height: height * 0.22 }}
                  />
                </View>
              </TouchableWithoutFeedback>
            ))
          }
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}
