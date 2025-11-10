import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

type LoginPayload = {
  identifier: string;
  password: string;
};

export async function loginUser({ identifier, password }: LoginPayload): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/auth/gie/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiant: identifier, password }),
    });

    const data = await response.json();
    console.log("Login response:", data);
        
    // Check if response is successful first
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la connexion');
    }

    // Only store token if login was successful and token exists
    // The API returns token in data.data.token based on your log
    const token = data.data?.token || data.token;
    if (token) {
      await AsyncStorage.setItem('token', token);
      console.log("Token stored successfully:", token);
    } else {
      console.warn("No token received from server", data);
    }

    return data;
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.message || 'Impossible de contacter le serveur');
  }
}

export async function getToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log("Retrieved token:", token);
    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('token');
    console.log("Token cleared");
  } catch (error) {
    console.error("Error clearing token:", error);
  }
}

export async function addProduct({ nom, description, stock, prix, image }: {
  nom: string;
  description: string;
  stock: string;
  prix: string;
  image?: string;
}): Promise<any> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Utilisateur non authentifié');

    const formData = new FormData();

    formData.append('nom', nom);
    formData.append('description', description);
    formData.append('stock', stock);
    formData.append('prix', prix);
    formData.append('categorie', 'Général');

    if (image) {
      const uriParts = image.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: image,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }

    const response = await fetch(`${API_URL}/produits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erreur lors de l'ajout du produit");

    return data;
  } catch (error: any) {
    throw new Error(error.message || "Erreur lors de l'ajout du produit");
  }
}

// Nouvelle fonction pour récupérer les produits
export async function getProducts(): Promise<any> {
  try {
    const token = await getToken();
    console.log("Using token for getProducts:", token);
        
    if (!token) {
      throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
    }

    const response = await fetch(`${API_URL}/produits/mes-produits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log("Get products response:", data);
        
    if (!response.ok) {
      if (response.status === 401) {
        await clearToken();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      throw new Error(data.message || 'Erreur lors de la récupération des produits');
    }
        
    // Retourner les produits selon la structure de votre API
    // Ajustez selon la structure réelle de votre réponse API
    return data.data || data.produits || data;
  } catch (error: any) {
    console.error("Get products error:", error);
    throw new Error(error.message || 'Erreur lors de la récupération des produits');
  }
}

// Fonction pour supprimer un produit
export async function deleteProduct(productId: string): Promise<any> {
  try {
    const token = await getToken();
    console.log("Using token for deleteProduct:", token);
        
    if (!token) {
      throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
    }

    const response = await fetch(`${API_URL}/produits/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await clearToken();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const data = await response.json();
      throw new Error(data.message || 'Erreur lors de la suppression du produit');
    }

    // Certaines APIs ne retournent pas de contenu pour DELETE
    try {
      const data = await response.json();
      console.log("Delete product response:", data);
      return data;
    } catch {
      // Si pas de JSON, retourner un succès
      return { success: true, message: 'Produit supprimé avec succès' };
    }
  } catch (error: any) {
    console.error("Delete product error:", error);
    throw new Error(error.message || 'Erreur lors de la suppression du produit');
  }
}

// Fonction pour modifier un produit
export async function updateProduct(productId: string, productData: {
  nom: string;
  description: string;
  stock: string;
  prix: string;
  image?: string;
  categorie?: string;
}): Promise<any> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Utilisateur non authentifié');

    console.log('🔄 Mise à jour du produit:', productId);
    console.log('📦 Données à envoyer:', productData);

    const formData = new FormData();
    formData.append('nom', productData.nom);
    formData.append('description', productData.description);
    formData.append('stock', productData.stock);
    formData.append('prix', productData.prix);
    formData.append('categorie', productData.categorie || 'Général');

    if (productData.image) {
      const uriParts = productData.image.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: productData.image,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }

    console.log('🌐 URL de mise à jour:', `${API_URL}/produits/${productId}`);
    console.log('📤 FormData créé avec les champs:', {
      nom: productData.nom,
      description: productData.description,
      stock: productData.stock,
      prix: productData.prix,
      categorie: productData.categorie || 'Général',
      hasImage: !!productData.image
    });

    const response = await fetch(`${API_URL}/produits/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Ne pas définir Content-Type pour FormData
      },
      body: formData,
    });

    console.log('📡 Status de la réponse:', response.status);
    console.log('📡 Headers de la réponse:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📥 Données de réponse:', data);

    if (!response.ok) {
      console.error('❌ Erreur de mise à jour:', data);
      throw new Error(data.message || "Erreur lors de la modification");
    }

    console.log('✅ Mise à jour réussie:', data);
    return data;
  } catch (error: any) {
    console.error('💥 Erreur dans updateProduct:', error);
    throw new Error(error.message || 'Erreur lors de la modification');
  }
}

// Récupérer les infos du user connecté
export async function getUserInfo(): Promise<any> {
  const token = await getToken();
  if (!token) throw new Error('Utilisateur non authentifié');
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  console.log(data);
  
  
  if (!response.ok) throw new Error(data.message || 'Erreur lors de la récupération des infos utilisateur');
  return data.data || data.user || data;
}

// Mettre à jour les infos du user connecté
export async function updateUserInfo(payload: any): Promise<any> {
  const token = await getToken();
  if (!token) throw new Error('Utilisateur non authentifié');
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Erreur lors de la mise à jour des infos utilisateur');
  return data.data || data.user || data;
}
