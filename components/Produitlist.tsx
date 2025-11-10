import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getProducts, deleteProduct } from '../services/auth';

export default function ProductList() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour récupérer les produits depuis l'API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts();
      console.log("Produits récupérés:", productsData);
      
      // CORRECTION: Extraire le tableau de produits de la réponse de l'API
      // L'API retourne {pagination: {...}, produits: [...]}
      let productsList = [];
      
      if (productsData && productsData.produits && Array.isArray(productsData.produits)) {
        productsList = productsData.produits;
      } else if (Array.isArray(productsData)) {
        // Fallback au cas où l'API retournerait directement un tableau
        productsList = productsData;
      }
      
      console.log("Liste des produits extraite:", productsList);
      setProducts(productsList);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      Alert.alert(
        'Erreur', 
        error.message || 'Impossible de charger les produits',
        [
          {
            text: 'Réessayer',
            onPress: () => fetchProducts()
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Recharger les données à chaque fois que l'écran devient visible
  useFocusEffect(
    React.useCallback(() => {
      console.log('ProductList screen focused - reloading products');
      fetchProducts();
    }, [])
  );

  // Garder useEffect pour le chargement initial
  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleEditProduct = (product) => {
    // Navigation vers la page d'ajout/édition avec les données du produit
    console.log("Navigating to edit product:", product);
    
    // Passer les données du produit via les paramètres de navigation
    router.push({
      pathname: '/add-product',
      params: {
        editMode: 'true',
        productId: product.id.toString(), // S'assurer que c'est une string
        nom: product.nom || '',
        description: product.description || '',
        prix: product.prix?.toString() || '0',
        stock: product.stock?.toString() || '0',
        categorie: product.categorie || '',
        image: product.image || ''
      }
    });
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteProduct(productId);
              
              // Mettre à jour la liste localement ET recharger depuis l'API
              setProducts(products.filter(product => product.id !== productId));
              Alert.alert('Succès', 'Produit supprimé avec succès');
              
              // Recharger la liste pour s'assurer de la cohérence
              setTimeout(() => {
                fetchProducts();
              }, 1000);
              
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert(
                'Erreur', 
                error.message || 'Impossible de supprimer le produit'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    router.push({
      pathname: '/add-product',
      params: {
        editMode: 'false'
      }
    });
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImagePlaceholderText}>📦</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.nom}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>
            {typeof item.prix === 'number' ? item.prix.toFixed(2) : item.prix} FCFA
          </Text>
          <Text style={[
            styles.productStock,
            { color: parseInt(item.stock) > 0 ? '#4CAF50' : '#f44336' }
          ]}>
            Stock: {item.stock}
          </Text>
        </View>
        {item.categorie && (
          <Text style={styles.productCategory}>#{item.categorie}</Text>
        )}
      </View>
      
      <View style={styles.productActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditProduct(item)}
        >
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>Aucun produit trouvé</Text>
      <Text style={styles.emptySubText}>
        Ajoutez votre premier produit pour commencer
      </Text>
      <TouchableOpacity 
        style={styles.addFirstProductButton}
        onPress={handleAddProduct}
      >
        <Text style={styles.addFirstProductButtonText}>AJOUTER UN PRODUIT</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>LISTE DES PRODUITS</Text>
          <View style={styles.headerIcon} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement des produits...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>LISTE DES PRODUITS ({products.length})</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddProduct}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 50,
    paddingHorizontal: 16,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 24,
    color: '#fff',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  productStock: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  productCategory: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  productActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstProductButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFirstProductButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});