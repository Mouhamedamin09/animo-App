// StreamScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Platform, 
  StatusBar as RNStatusBar 
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';

const StreamScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { videoUrl, subtitleUrl } = route.params;

  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orientationLocked, setOrientationLocked] = useState(false);
  const webViewRef = useRef(null);

  // Lock the orientation to landscape and hide all UI elements when the screen mounts
  useEffect(() => {
    const setupScreen = async () => {
      try {
        // Lock orientation to landscape
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setOrientationLocked(true);
      } catch (error) {
        console.error('Error locking orientation:', error);
        setOrientationLocked(true); // Proceed even if locking fails
      }

      // Hide the navigation header
      navigation.setOptions({
        headerShown: false,
      });

      // Hide the Status Bar
      RNStatusBar.setHidden(true, 'fade');

      // Hide the system navigation bar on Android
      if (Platform.OS === 'android') {
        await NavigationBar.setVisibilityAsync('hidden');
      }

      // Prevent the screen from sleeping while streaming
      // (Optional) Uncomment if you want to keep the screen awake
      // import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
      // activateKeepAwake();
    };

    setupScreen();

    // Clean up function to reset UI elements and orientation when the component unmounts
    return () => {
      const cleanup = async () => {
        try {
          // Explicitly lock orientation back to portrait
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        } catch (error) {
          console.error('Error resetting orientation:', error);
        }

        // Show the Status Bar
        RNStatusBar.setHidden(false, 'fade');

        // Show the system navigation bar on Android
        if (Platform.OS === 'android') {
          await NavigationBar.setVisibilityAsync('visible');
        }

        // (Optional) Allow the screen to sleep again
        // deactivateKeepAwake();
      };

      cleanup();
    };
  }, [navigation]);

  // Alternatively, use useFocusEffect to handle orientation when the screen gains or loses focus
  /*
  useFocusEffect(
    React.useCallback(() => {
      const setupScreen = async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch (error) {
          console.error('Error locking orientation:', error);
        }
        // Hide UI elements as before
      };

      setupScreen();

      return () => {
        const cleanup = async () => {
          try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
          } catch (error) {
            console.error('Error resetting orientation:', error);
          }
          // Show UI elements as before
        };

        cleanup();
      };
    }, [])
  );
  */

  useEffect(() => {
    const fetchAndProcessSubtitles = async () => {
      try {
        const response = await axios.get(subtitleUrl, { responseType: 'text' });
        const parsedSubtitles = parseVTT(response.data);
        setSubtitles(parsedSubtitles);
      } catch (error) {
        console.error('Error fetching or parsing subtitles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (subtitleUrl) {
      fetchAndProcessSubtitles();
    } else {
      setLoading(false);
    }
  }, [subtitleUrl]);
  const parseVTT = (vttContent) => {
    if (!vttContent || typeof vttContent !== 'string') {
      console.error('Invalid VTT content:', vttContent);
      return [];
    }

    const lines = vttContent.split('\n');
    const subtitles = [];
    let i = 0;

    // Skip the first line if it's "WEBVTT"
    if (lines[0].trim().toUpperCase() === 'WEBVTT') {
      i = 1;
    }

    while (i < lines.length) {
      const line = lines[i].trim();

      // Skip empty lines
      if (line === '') {
        i++;
        continue;
      }

      // Check if the line contains a timestamp
      const timestampRegex = /^(\d{2}:)?\d{2}:\d{2}\.\d{3}\s-->\s(\d{2}:)?\d{2}:\d{2}\.\d{3}/;
      if (timestampRegex.test(line)) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());

        const startTime = convertToSeconds(startStr);
        const endTime = convertToSeconds(endStr);

        // Move to the next line for subtitle text
        i++;
        if (i >= lines.length) break;

        let text = lines[i].trim();

        // Handle cases where subtitle text spans multiple lines
        // We'll take only the first line as per your requirement
        if (text.startsWith('<b>') || text.startsWith('<i>')) {
          text = text.replace(/<\/?[^>]+(>|$)/g, '').trim();
        }

        subtitles.push({ startTime, endTime, text });
      }

      i++;
    }

    console.log('Parsed Subtitles:', subtitles);
    return subtitles;
  };

  const convertToSeconds = (timeStr) => {
    if (!timeStr) {
      console.error('Invalid time string:', timeStr);
      return 0;
    }

    const parts = timeStr.split(':');
    let hours = 0, minutes = 0, seconds = 0, milliseconds = 0;

    if (parts.length === 3) {
      // Format: HH:MM:SS.mmm
      [hours, minutes, seconds] = parts;
    } else if (parts.length === 2) {
      // Format: MM:SS.mmm
      [minutes, seconds] = parts;
    } else {
      console.error('Unexpected time format:', timeStr);
      return 0;
    }

    const secParts = seconds.split('.');
    if (secParts.length === 2) {
      [seconds, milliseconds] = secParts;
    } else {
      seconds = secParts[0];
      milliseconds = '0';
    }

    const totalSeconds =
      parseInt(hours, 10) * 3600 +
      parseInt(minutes, 10) * 60 +
      parseInt(seconds, 10) +
      parseFloat(`0.${milliseconds}`);

    return totalSeconds;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=0">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: black;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          position: relative;
          touch-action: none; /* Prevent default touch behaviors */
        }
        #videoContainer {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: contain; /* Adjust to 'contain' for better zoom handling */
          background-color: black;
          transition: transform 0.1s ease-out;
        }
        #subtitle {
          position: absolute;
          bottom: 5%;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          text-align: center;
          color: white;
          font-size: 18px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
          pointer-events: none; /* Allow touches to pass through */
        }
      </style>
    </head>
    <body>
      <div id="videoContainer">
        <video id="videoPlayer" controls>
          <source src="${videoUrl}" type="application/x-mpegURL" />
          Your browser does not support the video tag.
        </video>
        <div id="subtitle"></div>
      </div>
      <script>
        const subtitles = ${JSON.stringify(subtitles)};
        const videoPlayer = document.getElementById('videoPlayer');
        const subtitleElement = document.getElementById('subtitle');

        videoPlayer.ontimeupdate = () => {
          const currentTime = videoPlayer.currentTime;
          const activeSubtitle = subtitles.find(
            (subtitle) => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
          );
          subtitleElement.textContent = activeSubtitle ? activeSubtitle.text : '';
        };

        // Automatically play the video once it's ready
        videoPlayer.oncanplay = () => {
          videoPlayer.play();
        };

        // Zoom functionality
        let initialDistance = null;
        let initialScale = 1;
        const video = document.getElementById('videoPlayer');
        let currentScale = 1;
        const minScale = 1;
        const maxScale = 3;

        function getDistance(touches) {
          const [touch1, touch2] = touches;
          const dx = touch1.clientX - touch2.clientX;
          const dy = touch1.clientY - touch2.clientY;
          return Math.sqrt(dx * dx + dy * dy);
        }

        const videoContainer = document.getElementById('videoContainer');

        videoContainer.addEventListener('touchstart', function(e) {
          if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches);
            initialScale = currentScale;
            e.preventDefault();
          }
        }, { passive: false });

        videoContainer.addEventListener('touchmove', function(e) {
          if (e.touches.length === 2 && initialDistance !== null) {
            const currentDistance = getDistance(e.touches);
            const scaleChange = currentDistance / initialDistance;
            let newScale = initialScale * scaleChange;
            newScale = Math.max(minScale, Math.min(newScale, maxScale));
            currentScale = newScale;
            video.style.transform = 'scale(' + newScale + ')';
            e.preventDefault();
          }
        }, { passive: false });

        videoContainer.addEventListener('touchend', function(e) {
          if (e.touches.length < 2) {
            initialDistance = null;
          }
        }, { passive: false });
      </script>
    </body>
    </html>
  `;

  if (!orientationLocked) {
    // Show a loading indicator while locking orientation
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false} // Allows autoplay
          scalesPageToFit={false} // Prevents the WebView from scaling the content
          automaticallyAdjustContentInsets={false}
          onLoadEnd={() => {
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                (function() {
                  const video = document.getElementById('videoPlayer');
                  if (video) {
                    video.play();
                  }
                })();
                true; // Required for React Native WebView
              `);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Ensure the background is black
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default StreamScreen;
