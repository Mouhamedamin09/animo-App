import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'

export default function cast({ cast, navigation }) {
    const characterName = "Moriarty James";

    // Sort the cast by favorites score in descending order
    

    // Filter out main characters
    const mainCharacters = cast.filter(person => person.role === "Main").slice(0, 20); 

    // Filter out supporting characters
    const supportingCharacters = cast
    .filter(person => person.role === "Supporting")
    .sort((a, b) => b.favorites - a.favorites) 
    .slice(0, 3);  
    

    // Combine main and supporting characters
    const characters = [...mainCharacters, ...supportingCharacters];
    
    

    return (
        <View className="my-6">
            <Text className="text-white text-lg mx-4 mb-5 ">Top Cast</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 15 }}
            >
                {
                    characters.map((person, index) => (
                        <TouchableOpacity
                            key={index}
                            className="mr-4 items-center" 
                            onPress={() => {navigation.push('Character', person);}}
                        >
                            <Image
                                className="rounded-2xl h-32 w-28"
                                source={{ uri: person.character.images?.jpg.image_url }}
                            />
                            <Text className="text-neutral-400 text-xs m-1">
                                {person.character ? (person.character.name.length < 15 ? person.character.name : person.character.name.slice(0, 15) + "...") : ""}
                            </Text>
                        </TouchableOpacity>
                    ))
                }
            </ScrollView>
        </View>
    );
}
