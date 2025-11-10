import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Surveillance de la connexion réseau
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
    const connected = Boolean(state.isConnected && state.isInternetReachable);
      setIsConnected(connected);
      
      if (!connected) {
        setShowOfflineModal(true);
      } else {
        setShowOfflineModal(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Vérification auth - pathname:', pathname);
        
        const token = await AsyncStorage.getItem('token');
        console.log('🔑 Token trouvé:', token ? 'OUI' : 'NON');
        
        if (token) {
          // Si l'utilisateur est connecté et sur welcome-login, rediriger vers (tabs)
          if (pathname === '/welcome-login' || pathname === '/welcome-register') {
            console.log('✅ Redirection vers (tabs)');
            router.replace('/(tabs)');
          }
        } else {
          // Si pas de token et pas sur les pages d'auth, rediriger vers welcome-login
          if (pathname !== '/welcome-login' && pathname !== '/welcome-register') {
            console.log('🔄 Redirection vers welcome-login');
            router.replace('/welcome-login');
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification du token:', error);
        // En cas d'erreur, rediriger vers welcome-login
        if (pathname !== '/welcome-login' && pathname !== '/welcome-register') {
          router.replace('/welcome-login');
        }
      } finally {
        console.log('✅ Auth vérifiée');
        setIsAuthChecked(true);
      }
    };

    if (loaded) {
      console.log('📱 Fonts chargées, vérification auth...');
      checkAuth();
    }
  }, [pathname, loaded, router]);

  const handleRetryConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      const connected = state.isConnected && state.isInternetReachable;
      
      if (connected) {
        setShowOfflineModal(false);
        setIsConnected(true);
      } else {
        Alert.alert(
          'Pas de connexion',
          'Veuillez vérifier votre connexion internet et réessayer.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion:', error);
      Alert.alert(
        'Erreur',
        'Impossible de vérifier la connexion.',
        [{ text: 'OK' }]
      );
    }
  };

  // Attendre que les fontes soient chargées et l'auth vérifiée
  if (!loaded || !isAuthChecked) {
    console.log('⏳ Attente - Fonts:', loaded, 'Auth:', isAuthChecked);
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  console.log('🎯 Rendu final du layout');

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome-login" options={{ headerShown: false }} />
        <Stack.Screen name="welcome-register" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="add-product" options={{ headerShown: false }} />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
        <Stack.Screen name="stats" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="product-list" options={{ headerShown: false }} />
        <Stack.Screen name="formupdate" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      
      {/* Modal de connexion hors ligne */}
      <Modal
        visible={showOfflineModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.wifiIcon}>📶</Text>
            </View>
            
            <Text style={styles.modalTitle}>
              Vous êtes hors ligne
            </Text>
            
            <Text style={styles.modalMessage}>
              Veuillez vous connecter à internet pour continuer à utiliser l'application.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={handleRetryConnection}
              >
                <Text style={styles.retryButtonText}>
                  Réessayer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE6E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wifiIcon: {
    fontSize: 40,
    transform: [{ rotate: '45deg' }],
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});