import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

type LoginPayload = {
  identifier: string;
  password: string;
};

// Types pour le changement de statut
type StatutCommande = 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';

type UpdateStatutPayload = {
  statut: StatutCommande;
  commentaire?: string; // Optionnel pour ajouter un commentaire
};

export async function getToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log("Retrieved token:", token ? "Token présent" : "Pas de token");
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

// Fonction utilitaire pour créer des délais d'attente
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour faire des tentatives avec retry
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentative ${attempt}/${maxRetries} pour: ${url}`);
      
      // Timeout pour éviter les requêtes qui traînent
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Si c'est une erreur serveur (5xx) et qu'on a encore des tentatives, on retry
      if (response.status >= 500 && attempt < maxRetries) {
        console.log(`Erreur serveur ${response.status}, tentative ${attempt}/${maxRetries}`);
        await delay(baseDelay * attempt); // Délai progressif
        continue;
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      console.error(`Tentative ${attempt} échouée:`, error.message);
      
      // Si c'est une erreur réseau et qu'on a encore des tentatives
      if (attempt < maxRetries && (
        error.name === 'TypeError' || 
        error.name === 'AbortError' ||
        error.message.includes('Network request failed')
      )) {
        console.log(`Erreur réseau, nouvelle tentative dans ${baseDelay * attempt}ms`);
        await delay(baseDelay * attempt);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

// Fonction pour récupérer les commandes du GIE avec retry automatique
export async function getCommandes(statut?: string): Promise<any> {
  try {
    const token = await getToken();
    console.log("Using token for getCommandes:", token ? "Token présent" : "Pas de token");
        
    if (!token) {
      throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
    }

    // Construire l'URL avec le paramètre statut si fourni
    let url = `${API_URL}/commandes/mes-commandes`;
    if (statut && statut !== 'all') {
      url += `?statut=${statut.toUpperCase()}`;
    }

    console.log("URL de requête:", url);
    console.log("Statut demandé:", statut);

    // Utiliser fetchWithRetry au lieu de fetch direct
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log("Status de la réponse:", response.status);
    console.log("Headers de la réponse:", response.headers);

    // Vérifier le type de contenu de la réponse
    const contentType = response.headers.get('content-type');
    console.log("Content-Type:", contentType);

    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      console.log("Réponse non-JSON:", textResponse);
      
      // Si le serveur renvoie du HTML (souvent le cas pour les erreurs 5xx)
      if (textResponse.includes('<html>') || textResponse.includes('<!DOCTYPE')) {
        throw new Error('Le serveur a renvoyé une page HTML au lieu de JSON. Problème de configuration serveur.');
      }
      
      throw new Error('Réponse du serveur invalide (non-JSON)');
    }

    console.log("Données brutes reçues:", data);
    console.log("Type de données:", typeof data);
    console.log("Est un tableau:", Array.isArray(data));
        
    if (!response.ok) {
      console.error("Erreur HTTP:", response.status, response.statusText);
      console.error("Détails de l'erreur:", data);
      
      if (response.status === 401) {
        await clearToken();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 403) {
        throw new Error('Accès non autorisé à cette ressource.');
      }
      
      if (response.status === 404) {
        // Si c'est un 404 et qu'on filtre par statut, retourner un tableau vide au lieu d'une erreur
        if (statut && statut !== 'all') {
          console.log(`Aucune commande trouvée pour le statut: ${statut}`);
          return [];
        }
        throw new Error('Endpoint non trouvé. Vérifiez l\'URL de l\'API.');
      }
      
      if (response.status === 429) {
        throw new Error('Trop de requêtes. Veuillez patienter avant de réessayer.');
      }
      
      if (response.status >= 500) {
        // Si on filtre par statut et qu'il y a une erreur serveur, retourner tableau vide
        if (statut && statut !== 'all') {
          console.log(`Erreur serveur lors de la recherche du statut ${statut}, retour d'un tableau vide`);
          return [];
        }
        // Donner plus de détails sur l'erreur serveur pour les autres cas
        const errorMessage = data?.message || data?.error || 'Erreur interne du serveur';
        throw new Error(`Erreur serveur (${response.status}): ${errorMessage}. Veuillez réessayer plus tard.`);
      }
      
      throw new Error(data.message || data.error || `Erreur HTTP ${response.status}`);
    }

    // Analyser la structure des données
    console.log("Structure des données:");
    if (data) {
      console.log("- data.data:", data.data);
      console.log("- data.commandes:", data.commandes);
      console.log("- data (direct):", Array.isArray(data) ? `Tableau de ${data.length} éléments` : 'Objet');
    }
        
    // Retourner les commandes selon la structure de votre API
    const commandes = data.data || data.commandes || data || [];
    console.log("Commandes finales:", commandes);
    console.log("Nombre de commandes:", Array.isArray(commandes) ? commandes.length : 'Non-tableau');
    
    return commandes;
  } catch (error: any) {
    console.error("Get commandes error - Type:", typeof error);
    console.error("Get commandes error - Message:", error.message);
    console.error("Get commandes error - Stack:", error.stack);
    console.error("Get commandes error - Complet:", error);
    
    // Améliorer les messages d'erreur utilisateur
    if (error.name === 'AbortError') {
      throw new Error('La requête a pris trop de temps. Vérifiez votre connexion internet.');
    }
    
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      throw new Error('Erreur de connexion réseau. Vérifiez votre connexion internet et réessayez.');
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Impossible de contacter le serveur. Vérifiez l\'URL de l\'API et votre connexion.');
    }
    
    // Si c'est déjà un message d'erreur personnalisé, le garder
    if (error.message.includes('Session expirée') || 
        error.message.includes('Accès non autorisé') ||
        error.message.includes('Utilisateur non authentifié')) {
      throw error;
    }
    
    // Pour les autres erreurs avec un statut spécifique, retourner un tableau vide
    if (statut && statut !== 'all') {
      console.log(`Erreur lors de la recherche du statut ${statut}, retour d'un tableau vide:`, error.message);
      return [];
    }
    
    throw new Error(error.message || 'Erreur lors de la récupération des commandes');
  }
}

// Fonction pour récupérer les détails d'une commande spécifique (également améliorée)
export async function getCommandeDetails(commandeId: string): Promise<any> {
  try {
    const token = await getToken();
    console.log("Using token for getCommandeDetails:", token ? "Token présent" : "Pas de token");
        
    if (!token) {
      throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
    }

    const url = `${API_URL}/commandes/mes-commandes/${commandeId}`;
    console.log("URL détails commande:", url);

    // Utiliser fetchWithRetry pour les détails aussi
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log("Status détails commande:", response.status);

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      console.log("Réponse détails non-JSON:", textResponse);
      
      if (textResponse.includes('<html>') || textResponse.includes('<!DOCTYPE')) {
        throw new Error('Le serveur a renvoyé une page HTML. Problème de configuration serveur.');
      }
      
      throw new Error('Réponse du serveur invalide pour les détails');
    }

    console.log("Détails commande reçus:", data);
        
    if (!response.ok) {
      console.error("Erreur détails commande:", response.status, data);
      
      if (response.status === 401) {
        await clearToken();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 404) {
        throw new Error('Commande non trouvée.');
      }
      
      if (response.status >= 500) {
        const errorMessage = data?.message || data?.error || 'Erreur interne du serveur';
        throw new Error(`Erreur serveur: ${errorMessage}`);
      }
      
      throw new Error(data.message || data.error || 'Erreur lors de la récupération des détails');
    }
        
    return data.data || data;
  } catch (error: any) {
    console.error("Get commande details error:", error);
    
    // Améliorer les messages d'erreur
    if (error.name === 'AbortError') {
      throw new Error('La requête a pris trop de temps. Réessayez.');
    }
    
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      throw new Error('Erreur de connexion réseau. Vérifiez votre connexion.');
    }
    
    throw new Error(error.message || 'Erreur lors de la récupération des détails');
  }
}

// NOUVELLE FONCTION: Mettre à jour le statut d'une commande
export async function updateCommandeStatut(
  commandeId: string, 
  payload: UpdateStatutPayload
): Promise<any> {
  try {
    const token = await getToken();
    console.log("Using token for updateCommandeStatut:", token ? "Token présent" : "Pas de token");
        
    if (!token) {
      throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
    }

    const url = `${API_URL}/commandes/${commandeId}/statut`;
    console.log("URL mise à jour statut:", url);
    console.log("Payload:", payload);

    // Utiliser fetchWithRetry pour la mise à jour
    const response = await fetchWithRetry(url, {
      method: 'PATCH', // ou PUT selon votre API
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log("Status mise à jour statut:", response.status);

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      console.log("Réponse mise à jour non-JSON:", textResponse);
      
      if (textResponse.includes('<html>') || textResponse.includes('<!DOCTYPE')) {
        throw new Error('Le serveur a renvoyé une page HTML. Problème de configuration serveur.');
      }
      
      // Si la réponse est vide mais le statut est OK, c'est probablement un succès
      if (response.ok && !textResponse.trim()) {
        return { success: true, message: 'Statut mis à jour avec succès' };
      }
      
      throw new Error('Réponse du serveur invalide pour la mise à jour');
    }

    console.log("Réponse mise à jour statut:", data);
        
    if (!response.ok) {
      console.error("Erreur mise à jour statut:", response.status, data);
      
      if (response.status === 401) {
        await clearToken();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 403) {
        throw new Error('Vous n\'avez pas l\'autorisation de modifier cette commande.');
      }
      
      if (response.status === 404) {
        throw new Error('Commande non trouvée.');
      }
      
      if (response.status === 400) {
        const errorMessage = data?.message || data?.error || 'Données invalides';
        throw new Error(`Erreur de validation: ${errorMessage}`);
      }
      
      if (response.status === 409) {
        throw new Error('Conflit: Cette commande ne peut pas être modifiée dans son état actuel.');
      }
      
      if (response.status >= 500) {
        const errorMessage = data?.message || data?.error || 'Erreur interne du serveur';
        throw new Error(`Erreur serveur: ${errorMessage}`);
      }
      
      throw new Error(data.message || data.error || 'Erreur lors de la mise à jour du statut');
    }
        
    return data.data || data || { success: true, message: 'Statut mis à jour avec succès' };
  } catch (error: any) {
    console.error("Update commande statut error:", error);
    
    // Améliorer les messages d'erreur
    if (error.name === 'AbortError') {
      throw new Error('La requête a pris trop de temps. Réessayez.');
    }
    
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      throw new Error('Erreur de connexion réseau. Vérifiez votre connexion.');
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }
    
    throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
  }
}

// NOUVELLES FONCTIONS: Raccourcis pour accepter/refuser une commande
export async function accepterCommande(commandeId: string, commentaire?: string): Promise<any> {
  return updateCommandeStatut(commandeId, {
    statut: 'CONFIRMEE',
    commentaire: commentaire || 'Commande acceptée'
  });
}

export async function refuserCommande(commandeId: string, commentaire?: string): Promise<any> {
  return updateCommandeStatut(commandeId, {
    statut: 'ANNULEE',
    commentaire: commentaire || 'Commande refusée'
  });
}

// NOUVELLE FONCTION: Marquer une commande comme en cours
export async function marquerEnCours(commandeId: string, commentaire?: string): Promise<any> {
  return updateCommandeStatut(commandeId, {
    statut: 'EN_COURS',
    commentaire: commentaire || 'Commande en cours de traitement'
  });
}

// NOUVELLE FONCTION: Marquer une commande comme livrée
export async function marquerLivree(commandeId: string, commentaire?: string): Promise<any> {
  return updateCommandeStatut(commandeId, {
    statut: 'LIVREE',
    commentaire: commentaire || 'Commande livrée'
  });
}

// Récupérer les statistiques de vente du GIE
export async function getStatsCommandes(): Promise<any> {
  const token = await getToken();
  if (!token) throw new Error('Utilisateur non authentifié');
  const response = await fetch(`${API_URL}/commandes/mes-commandes-stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  console.log(data);
  
  if (!response.ok) throw new Error(data.message || 'Erreur lors de la récupération des statistiques');
  return data.data || data;
}

// NOUVELLE FONCTION: Mettre à jour le statut d'un paiement
export async function updatePaiementStatut(paiementId: string, nouveauStatut: string): Promise<any> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
    }
    const url = `${API_URL}/paiements/${paiementId}/statut`;
    const response = await fetchWithRetry(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ statut: nouveauStatut }),
    });
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      if (response.ok && !textResponse.trim()) {
        return { success: true, message: 'Statut paiement mis à jour avec succès' };
      }
      throw new Error('Réponse du serveur invalide pour la mise à jour du paiement');
    }
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Erreur lors de la mise à jour du paiement');
    }
    return data.data || data || { success: true, message: 'Statut paiement mis à jour avec succès' };
  } catch (error: any) {
    throw new Error(error.message || 'Erreur lors de la mise à jour du paiement');
  }
}