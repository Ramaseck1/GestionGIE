import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getToken } from '../services/auth';

export default function Home() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await getToken();
        setToken(storedToken);
        console.log("Token in home:", storedToken);
      } catch (error) {
        console.error("Error getting token:", error);
      }
    };
    
    checkToken();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header vert avec ACCEUIL, icône profil et notification */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ACCEUIL</Text>
        <View style={styles.headerIcons}>
          {/* Icône Profil */}
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.profileIconText}>👤</Text>
          </TouchableOpacity>
          
          {/* Icône Notification */}
          <View style={styles.notificationIcon}>
            <Text style={styles.bellIcon}>🔔</Text>
          </View>
        </View>
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Logo avec icône */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>●</Text>
            </View>
            <Text style={styles.iconN}>N</Text>
          </View>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoText}>Njaba</Text>
            <Text style={styles.logoSubText}>Tech</Text>
          </View>
        </View>

        {/* Debug info - remove in production */}
       {/*  {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Token: {token ? 'Present' : 'Missing'}
            </Text>
          </View>
        )} */}

        {/* Grille des boutons en colonne */}
        <View style={styles.grid}>
          {/* Bouton PRODUITS */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/add-product')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🛒</Text>
            </View>
            <Text style={styles.buttonText}>PRODUITS</Text>
          </TouchableOpacity>
          
          {/* Bouton COMMANDES */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/orders')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚏</Text>
            </View>
            <Text style={styles.buttonText}>COMMANDES</Text>
          </TouchableOpacity>

          {/* Bouton STATISTIQUES */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/stats')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📊</Text>
            </View>
            <Text style={styles.buttonText}>STATISTIQUES</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  profileIconText: {
    color: '#fff',
    fontSize: 16,
  },
  notificationIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  logoIcon: {
    position: 'relative',
    marginRight: 12,
  },
  iconCircle: {
    position: 'absolute',
    top: -5,
    left: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FF9800',
    fontSize: 8,
  },
  iconN: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 36,
  },
  logoSubText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 36,
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
  grid: {
    width: '100%',
    maxWidth: 350,
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    width: 200,
    height: 120,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
    color: '#FF9800',
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});