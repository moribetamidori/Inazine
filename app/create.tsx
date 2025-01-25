import { Text, View, TouchableOpacity, ScrollView, TextInput, Image } from "react-native";
import { Stack } from "expo-router";
import { useState } from "react";
import Draggable from "react-native-draggable";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { PinchGestureHandler, State, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useRef } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useAnimatedGestureHandler } from 'react-native-reanimated';

interface PageContent {
  id: string;
  elements: {
    id: string;
    type: "text" | "image";
    content: string;
    position: { x: number; y: number };
    dimensions?: { width: number; height: number };
  }[];
}

export default function CreateScreen() {
  const [pages, setPages] = useState<PageContent[]>([
    { id: "cover", elements: [] },
  ]);
  const [selectedPage, setSelectedPage] = useState(0);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value * savedScale.value }],
    };
  });

  const onPinchEvent = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onStart: () => {
      'worklet';
      scale.value = 1;
    },
    onActive: (event) => {
      'worklet';
      scale.value = event.scale;
    },
    onEnd: () => {
      'worklet';
      savedScale.value = savedScale.value * scale.value;
      scale.value = 1;
    },
  });

  const addNewPage = () => {
    setPages([
      ...pages,
      {
        id: `page-${pages.length}`,
        elements: [],
      },
    ]);
  };

  const addElement = async (type: "text" | "image") => {
    if (type === "text") {
      const newElement = {
        id: `element-${Date.now()}`,
        type,
        content: "New text",
        position: { x: 50, y: 100 },
      };

      setPages((currentPages) => {
        const updatedPages = [...currentPages];
        updatedPages[selectedPage].elements.push(newElement);
        return updatedPages;
      });
      
      // Automatically select the new text element
      setSelectedElementId(newElement.id);
    } else if (type === "image") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        exif: true,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        Image.getSize(uri, (width, height) => {
          const screenWidth = 300;
          const aspectRatio = width / height;
          const newElement = {
            id: `element-${Date.now()}`,
            type,
            content: uri,
            position: { x: 50, y: 100 },
            dimensions: {
              width: screenWidth,
              height: screenWidth / aspectRatio,
            },
          };

          setPages((currentPages) => {
            const updatedPages = [...currentPages];
            updatedPages[selectedPage].elements.push(newElement);
            return updatedPages;
          });
        });
      }
    }
  };

  const handleTextPress = (elementId: string, currentContent: string) => {
    setEditingElementId(elementId);
    setTextInputValue(currentContent);
    setSelectedElementId(elementId);
  };

  const handleTextChange = (newContent: string) => {
    setTextInputValue(newContent);
  };

  const handleTextSubmit = () => {
    if (editingElementId) {
      setPages((currentPages) => {
        const updatedPages = [...currentPages];
        const page = updatedPages[selectedPage];
        const elementIndex = page.elements.findIndex(
          (el) => el.id === editingElementId
        );
        if (elementIndex !== -1) {
          page.elements[elementIndex].content = textInputValue;
        }
        return updatedPages;
      });
      setEditingElementId(null);
      setSelectedElementId(editingElementId);
    }
  };

  const deleteElement = (elementId: string) => {
    setPages((currentPages) => {
      const updatedPages = [...currentPages];
      const page = updatedPages[selectedPage];
      page.elements = page.elements.filter(el => el.id !== elementId);
      return updatedPages;
    });
  };

  const handleImagePress = (elementId: string) => {
    setSelectedElementId(selectedElementId === elementId ? null : elementId);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, paddingTop: 60 }}>
        {/* Pages Header */}
        <ScrollView
          horizontal
          style={{ height: 50, backgroundColor: "#f5f5f5" }}
          contentContainerStyle={{ height: 50 }}
        >
          <View style={{ flexDirection: "row", padding: 5, height: 50 }}>
            {pages.map((page, index) => (
              <TouchableOpacity
                key={page.id}
                onPress={() => setSelectedPage(index)}
                style={{
                  width: 40,
                  height: 40,
                  borderWidth: 1,
                  marginRight: 10,
                  backgroundColor: selectedPage === index ? "#e0e0e0" : "white",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text>{index === 0 ? "C" : index}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={addNewPage}
              style={{
                width: 40,
                height: 40,
                borderWidth: 1,
                borderStyle: "dashed",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>+</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Page Content Area */}
        <View
          style={{
            height: 620,
            width: 400,
            backgroundColor: "white",
            alignSelf: "center",
            marginVertical: 10,
          }}
        >
          {pages[selectedPage].elements.map((element) => (
            <Draggable
              key={element.id}
              x={element.position.x}
              y={element.position.y}
              renderSize={60}
            >
              {element.type === "text" ? (
                <Animated.View>
                  {editingElementId === element.id ? (
                    <>
                      <TextInput
                        value={textInputValue}
                        onChangeText={handleTextChange}
                        onSubmitEditing={handleTextSubmit}
                        onBlur={handleTextSubmit}
                        style={{ 
                          borderWidth: 1, 
                          padding: 5, 
                          minWidth: 100,
                          fontSize: 16,
                        }}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => deleteElement(element.id)}
                        style={{
                          position: 'absolute',
                          top: -20,
                          right: -20,
                          backgroundColor: 'red',
                          padding: 8,
                          borderRadius: 15,
                          width: 30,
                          height: 30,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <MaterialIcons name="close" size={14} color="white" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => handleTextPress(element.id, element.content)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ 
                        fontSize: 16,
                        padding: 5,
                      }}>
                        {element.content}
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              ) : (
                <PinchGestureHandler
                  onGestureEvent={onPinchEvent}
                  enabled={selectedElementId === element.id}
                >
                  <Animated.View style={[{ width: element.dimensions?.width, height: element.dimensions?.height }, animatedStyle]}>
                    <TouchableOpacity 
                      onPress={() => handleImagePress(element.id)}
                      activeOpacity={1}
                    >
                      <Image
                        source={{ uri: element.content }}
                        style={{
                          width: '100%',
                          height: '100%',
                          resizeMode: 'contain',
                        }}
                      />
                    </TouchableOpacity>
                    {selectedElementId === element.id && (
                      <TouchableOpacity
                        onPress={() => deleteElement(element.id)}
                        style={{
                          position: 'absolute',
                          top: -20,
                          right: -20,
                          backgroundColor: 'red',
                          padding: 8,
                          borderRadius: 15,
                          width: 30,
                          height: 30,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <MaterialIcons name="close" size={14} color="white" />
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                </PinchGestureHandler>
              )}
            </Draggable>
          ))}
        </View>

        {/* Bottom Toolbar */}
        <View
          style={{
            height: 60,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            borderTopWidth: 1,
            borderColor: "#e0e0e0",
          }}
        >
          <TouchableOpacity 
            onPress={() => addElement("text")}
            style={{ flex: 1, height: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "pink" }}
          >
            <MaterialIcons name="text-fields" size={24} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => addElement("image")}
            style={{ flex: 1, height: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "pink" }}
          >
            <MaterialIcons name="image" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
