import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { loginUser } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';


type Props = {
  onLogin?: () => void;
};

export default function WelcomeLogin({ onLogin }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateFields = () => {
    let isValid = true;
    
    // Reset des erreurs
    setIdentifierError('');
    setPasswordError('');
    setGeneralError('');

    // Validation de l'identifiant
    if (!identifier.trim()) {
      setIdentifierError('L\'email ou le téléphone est requis');
      isValid = false;
    } else if (identifier.includes('@')) {
      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        setIdentifierError('Format d\'email invalide');
        isValid = false;
      }
    } else {
      // Validation téléphone (exemple basique)
      const phoneRegex = /^[0-9+\s-()]{8,}$/;
      if (!phoneRegex.test(identifier)) {
        setIdentifierError('Format de téléphone invalide');
        isValid = false;
      }
    }

    // Validation du mot de passe
    if (!password.trim()) {
      setPasswordError('Le mot de passe est requis');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser({ identifier, password });
      router.push('/home')
      onLogin && onLogin();
    } catch (err: any) {
      setGeneralError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header vert */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BIENVENUE hello Rama</Text>
      </View>

      {/* Contenu principal avec scroll */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo avec icône */}
          <View style={styles.logoContainer}>
            <Image source={require('../assets/images/logo.png')} style={styles.productImage} />
          </View>

          <Text style={styles.connect}>Connexion</Text>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            {/* Message d'erreur général */}
            {generalError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            ) : null}

            {/* Champ email/téléphone */}
            <View style={styles.inputContainer}>
              <TextInput 
                style={[styles.input, identifierError ? styles.inputError : null]} 
                placeholder="email ou telephone" 
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (identifierError) setIdentifierError('');
                }}
              />
              {identifierError ? (
                <Text style={styles.fieldError}>{identifierError}</Text>
              ) : null}
            </View>

            {/* Champ mot de passe */}
            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={[styles.input, styles.passwordInput, passwordError ? styles.inputError : null]} 
                  placeholder="Mot de passe" 
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.fieldError}>{passwordError}</Text>
              ) : null}
            </View>
            
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              <Text style={styles.loginButtonText}>{loading ? 'Connexion...' : 'Connexion'}</Text>
            </TouchableOpacity>
          </View>

          {/* Lien d'inscription */}
          {/*  <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Pas de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/welcome-register')}>
              <Text style={styles.registerLink}>S'inscrire ici</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 160,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 500, // Hauteur minimale pour permettre le centrage
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
  connect: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    bottom: 30,
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
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#F44336',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 5,
  },
  fieldError: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#F44336',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignSelf: 'center',
    marginTop: 10,
    minWidth: 120,
  },
  productImage: {
    width: 300,
    height: 100,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: '#666',
  },
  registerLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
});