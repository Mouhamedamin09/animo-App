import React,{useEffect,useState} from 'react';
import { View, Text,StyleSheet ,ActivityIndicator,ScrollView,Dimensions,Image,TouchableWithoutFeedback} from 'react-native';
import { useNavigation } from '@react-navigation/native';

var { width, height } = Dimensions.get('window');



export default function AnimeListScreen ({ route }){

    const navigation = useNavigation();
    const { season,data,year } = route.params;

    return (
        <View style={styles.content}>
            <Text style={styles.seasonText}>{season} {year}</Text>
            

       
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          className="space-y-3"
        >
         
            <>
              <View className="flex-row justify-between flex-wrap">
                {data.map((item, index) => {
                  const animeTitle = item.title.length > 17 ? item.title.slice(0, 20) + "..." : item.title;
                  return (
                    <TouchableWithoutFeedback
                      key={index}
                      onPress={() => navigation.push("Anime", { mal_id: item.mal_id })}
                    >
                      <View className="space-y-2 mb-4">
                        <Image
                          className=""
                          source={{ uri: item.images.jpg.large_image_url }}
                          style={{ width: width * 0.44, height: height * 0.3 }}
                        />
                        <Text className="text-neutral-400 ml-1">{animeTitle}</Text>
                      </View>
                    </TouchableWithoutFeedback>
                  );
                })}
              </View>
            </>
         
        </ScrollView>
      
            
            
        </View>
    );
  };

  const styles = StyleSheet.create({
   
    content: {
        flex: 1,
       
        alignItems: 'center',
        backgroundColor: '#262626',
    },
    seasonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom:10,
    },
  });