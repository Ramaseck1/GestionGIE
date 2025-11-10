import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { addProduct, updateProduct } from '../services/auth';

interface ProductData {
  nom: string;
  description: string;
  stock: string;
  prix: string;
  categorie: string;
  image?: string | null;
}

export default function AddProduct() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Déterminer si on est en mode édition
  const isEditMode = params.editMode === 'true';
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [prix, setPrice] = useState('');
  const [categorie, setCategorie] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Remplir les champs si on est en mode édition
  useEffect(() => {
    if (isEditMode && params) {
      console.log("Mode édition activé avec les paramètres:", params);
      
      // Gérer les paramètres qui peuvent être des tableaux
      const getNormalizedParam = (param: string | string[] | undefined): string => {
        if (Array.isArray(param)) return param[0] || '';
        return param || '';
      };
      
      // Utiliser setTimeout pour s'assurer que les états sont mis à jour après le render
      setTimeout(() => {
        setProductName(getNormalizedParam(params.nom));
        setDescription(getNormalizedParam(params.description));
        setStock(getNormalizedParam(params.stock));
        setPrice(getNormalizedParam(params.prix));
        setCategorie(getNormalizedParam(params.categorie));
        setSelectedImage(getNormalizedParam(params.image) || null);
      }, 100);
    }
  }, [isEditMode]);

  const pickImage = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission requise", "Vous devez autoriser l'accès à la galerie pour sélectionner une image.");
        return;
      }

      // Ouvrir la galerie d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8, // Réduire la qualité pour éviter les fichiers trop lourds
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const validateForm = (): boolean => {
    // Validation des champs obligatoires
    if (!productName.trim()) {
      Alert.alert("Erreur", "Le nom du produit est obligatoire");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Erreur", "La description est obligatoire");
      return false;
    }

    if (!stock.trim()) {
      Alert.alert("Erreur", "Le stock est obligatoire");
      return false;
    }

    if (!prix.trim()) {
      Alert.alert("Erreur", "Le prix est obligatoire");
      return false;
    }

    // Validation que prix et stock sont des nombres
    const prixNumber = parseFloat(prix.trim());
    const stockNumber = parseInt(stock.trim(), 10);

    if (isNaN(prixNumber) || prixNumber <= 0) {
      Alert.alert("Erreur", "Le prix doit être un nombre positif");
      return false;
    }

    if (isNaN(stockNumber) || stockNumber < 0) {
      Alert.alert("Erreur", "Le stock doit être un nombre positif ou zéro");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const productData: ProductData = {
        nom: productName.trim(),
        description: description.trim(),
        stock: stock.trim(),
        prix: prix.trim(),
        categorie: categorie.trim() || 'Général',
        image: selectedImage,
      };

      console.log('Données du produit à soumettre:', productData);

      if (isEditMode && productId) {
        // Mode modification
        console.log('Mise à jour du produit avec ID:', productId);
        await updateProduct(productId, productData);
        
        Alert.alert(
          "Succès", 
          "Produit modifié avec succès!",
          [
            {
              text: 'OK',
              onPress: () => {
                // Retourner à la page précédente ou à la liste
                router.back();
              }
            }
          ]
        );
      } else {
        // Mode ajout
        console.log('Ajout d\'un nouveau produit');
        await addProduct(productData);
        
        Alert.alert(
          "Succès", 
          "Produit ajouté avec succès!",
          [
            {
              text: 'Ajouter un autre',
              style: 'default',
              onPress: () => {
                // Reset du formulaire
                resetForm();
              }
            },
            {
              text: 'Retour à la liste',
              onPress: () => router.push('/product-list')
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error("Erreur lors de la soumission du produit:", error);
      
      let errorMessage = "Une erreur s'est produite";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert(
        "Erreur", 
        `${errorMessage} lors de ${isEditMode ? 'la modification' : 'l\'ajout'} du produit`
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setDescription('');
    setStock('');
    setPrice('');
    setCategorie('');
    setSelectedImage(null);
  };

  const handleCancel = () => {
    if (isEditMode) {
      Alert.alert(
        'Annuler les modifications',
        'Êtes-vous sûr de vouloir annuler les modifications ?',
        [
          { text: 'Non', style: 'cancel' },
          { 
            text: 'Oui', 
            onPress: () => router.back(),
            style: 'destructive'
          }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
     <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
      {/* Header amélioré */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditMode ? 'MODIFIER LE PRODUIT' : 'AJOUTER UN PRODUIT'}
          </Text>
          <TouchableOpacity 
            style={styles.listIcon}
            onPress={() => router.push('/product-list')}
            disabled={loading}
          >
            <Text style={styles.listIconText}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Upload Section */}
        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={pickImage}
          disabled={loading}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📷</Text>
              <Text style={styles.imageLabel}>AJOUTER UNE IMAGE</Text>
              <Text style={styles.imageSubLabel}>Appuyez pour sélectionner</Text>
            </View>
          )}
          {selectedImage && (
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
              disabled={loading}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du Produit *</Text>
            <TextInput
              style={[styles.input, loading && styles.inputDisabled]}
              value={productName}
              onChangeText={(text) => {
                console.log('Changement nom produit:', text);
                setProductName(text);
              }}
              placeholder="Ex: iPhone 14 Pro"
              editable={!loading}
              selectTextOnFocus={true}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description du produit *</Text>
            <TextInput
              style={[styles.input, styles.textArea, loading && styles.inputDisabled]}
              value={description}
              onChangeText={(text) => {
                console.log('Changement description:', text);
                setDescription(text);
              }}
              placeholder="Décrivez votre produit en détail..."
              multiline
              numberOfLines={3}
              editable={!loading}
              selectTextOnFocus={true}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={[styles.input, loading && styles.inputDisabled]}
                value={stock}
                onChangeText={(text) => {
                  console.log('Changement stock:', text);
                  setStock(text);
                }}
                placeholder="Ex: 50"
                keyboardType="numeric"
                editable={!loading}
                selectTextOnFocus={true}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Prix (FCFA) *</Text>
              <TextInput
                style={[styles.input, loading && styles.inputDisabled]}
                value={prix}
                onChangeText={(text) => {
                  console.log('Changement prix:', text);
                  setPrice(text);
                }}
                placeholder="Ex: 25000"
                keyboardType="numeric"
                editable={!loading}
                selectTextOnFocus={true}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catégorie</Text>
            <TextInput
              style={[styles.input, loading && styles.inputDisabled]}
              value={categorie}
              onChangeText={(text) => {
                console.log('Changement catégorie:', text);
                setCategorie(text);
              }}
              placeholder="Ex: Électronique, Vêtements..."
              editable={!loading}
              selectTextOnFocus={true}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.addButton, loading && styles.addButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading 
                ? (isEditMode ? '⏳ MODIFICATION...' : '⏳ AJOUT...') 
                : (isEditMode ? '✏️ MODIFIER LE PRODUIT' : '➕ AJOUTER LE PRODUIT')
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
              {isEditMode ? '❌ ANNULER LES MODIFICATIONS' : '❌ ANNULER'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listIconText: {
    fontSize: 18,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 25,
    paddingHorizontal: 20,
    position: 'relative',
  },
  productImage: {
    width: 140,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  imagePlaceholder: {
    width: 140,
    height: 160,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 36,
    marginBottom: 8,
  },
  imageLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageSubLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: 70,
    backgroundColor: '#f44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  removeImageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 7,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#A5D6A7',
    elevation: 1,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});   