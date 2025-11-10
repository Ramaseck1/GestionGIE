import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeRegister() {
  const router = useRouter();

  const handleRegister = () => {
    // Add your registration logic here
    // Navigate to login or home after successful registration
    router.push('/welcome-login');
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header vert */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BIENVENUE</Text>
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

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Nom" 
            placeholderTextColor="#999"
            autoCapitalize="words"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Prenom" 
            placeholderTextColor="#999"
            autoCapitalize="words"
          />
          <TextInput 
            style={styles.input} 
            placeholder="N° telephone" 
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
          <TextInput 
            style={styles.input} 
            placeholder="email" 
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput 
            style={styles.input} 
            placeholder="password" 
            placeholderTextColor="#999"
            secureTextEntry 
            autoCapitalize="none"
          />
          
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>VALIDER</Text>
          </TouchableOpacity>
        </View>

        {/* Lien de connexion */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/welcome-login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
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
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
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
    marginBottom: 40,
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
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  registerButton: {
    backgroundColor: '#F44336',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignSelf: 'center',
    marginTop: 15,
    minWidth: 120,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
});