import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { accepterCommande, getCommandeDetails, getCommandes, marquerLivree, refuserCommande, updatePaiementStatut } from '../services/commande';

// Interface pour typer les données
interface PanierProduit {
  id: string;
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  produit: {
    nom: string;
    description?: string;
    prix?: number;
  };
}

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
}

interface Paiement {
  id: string;
  commandeId: string;
  methode: string;
  montant: number;
  statut: string;
  reference: string;
  datePaiement: string;
  createdAt: string;
  updatedAt: string;
}

interface Commande {
  id: string;
  numero: string;
  clientId: string;
  montant: number;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
  dateCommande: string;
  adresseLivraison?: string;
  dateLivraison?: string;
  client: Client;
  panierProduits: PanierProduit[];
  paiement?: Paiement;
}

export default function Orders() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filterButtons = [
    { key: 'all', label: 'TOUS', icon: '📋' },
    { key: 'EN_ATTENTE', label: 'EN ATTENTE', icon: '⏳' },
    { key: 'CONFIRMEE', label: 'CONFIRMEE', icon: '✅' },
    { key: 'EN_COURS', label: 'EN COURS', icon: '🔄' },
    { key: 'LIVREE', label: 'LIVRÉES', icon: '🚚' },
    { key: 'ANNULEE', label: 'ANNULÉES', icon: '❌' },
  ];

  // Fonction pour obtenir les informations de paiement
  const getPaymentInfo = (commande: Commande) => {
    if (!commande.paiement) {
      return {
        text: 'Paiement non défini',
        color: '#999',
        backgroundColor: '#f0f0f0'
      };
    }

    const methode = commande.paiement.methode;
    const statutPaiement = commande.paiement.statut;

    // Si c'est paiement à la livraison
    if (methode === 'PAIEMENT_A_LA_LIVRAISON') {
      return {
        text: 'Paiement à la livraison',
        color: '#fff',
        backgroundColor: '#F44336' // Rouge
      };
    }

    // Pour les autres méthodes (WAVE, ORANGE_MONEY, etc.)
    if (statutPaiement === 'VALIDE') {
      return {
        text: 'Payé',
        color: '#fff',
        backgroundColor: '#4CAF50' // Vert
      };
    }

    // Si le paiement n'est pas validé
    return {
      text: 'Paiement en attente',
      color: '#fff',
      backgroundColor: '#FF9800' // Orange
    };
  };

  // Fonction pour charger les commandes
  const loadCommandes = async (statut?: string) => {
    try {
      setLoading(true);
      setHasError(false);
      setErrorMessage('');
      
      const data = await getCommandes(statut);
      setCommandes(Array.isArray(data) ? data : []);
      
      // Log pour debug
      console.log(`Commandes chargées pour statut "${statut || 'all'}":`, data?.length || 0);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des commandes:', error);
      
      // Vérifier si c'est une erreur critique (authentification, etc.)
      const isCriticalError = error.message.includes('Session expirée') || 
                             error.message.includes('Accès non autorisé') ||
                             error.message.includes('Utilisateur non authentifié');
      
      if (isCriticalError) {
        // Afficher l'alerte seulement pour les erreurs critiques
        Alert.alert('Erreur', error.message);
        setHasError(true);
        setErrorMessage(error.message);
      } else {
        // Pour les autres erreurs (réseau, serveur, etc.), juste afficher "Aucune commande"
        console.log('Erreur non-critique, affichage de "Aucune commande"');
        setHasError(false);
      }
      
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rafraîchir les données
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCommandes(activeFilter === 'all' ? undefined : activeFilter);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Charger les commandes au démarrage et lors du changement de filtre
  useEffect(() => {
    loadCommandes(activeFilter === 'all' ? undefined : activeFilter);
  }, [activeFilter]);

  // Fonction pour afficher les détails d'une commande
  const handleShowDetails = async (commande: Commande) => {
    try {
      setLoadingDetails(true);
      setModalVisible(true);
      
      // Récupérer les détails complets de la commande
      const detailsCommande = await getCommandeDetails(commande.id);
      setSelectedCommande(detailsCommande);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors du chargement des détails');
      setModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fonction pour accepter une commande
  const handleAccepter = async (commandeId: string) => {
    setActionLoading(commandeId + '-accepter');
    try {
      await accepterCommande(commandeId);
      Alert.alert('Succès', 'Commande acceptée');
      await loadCommandes(activeFilter === 'all' ? undefined : activeFilter);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'acceptation');
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour refuser une commande
  const handleRefuser = async (commandeId: string) => {
    setActionLoading(commandeId + '-refuser');
    try {
      await refuserCommande(commandeId);
      Alert.alert('Succès', 'Commande refusée');
      await loadCommandes(activeFilter === 'all' ? undefined : activeFilter);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVREE':
        return '#4CAF50';
      case 'EN_COURS':
      case 'CONFIRMEE':
        return '#FF9800';
      case 'EN_ATTENTE':
        return '#2196F3';
      case 'ANNULEE':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'LIVREE':
        return 'Livrée';
      case 'EN_COURS':
        return 'En cours';
      case 'CONFIRMEE':
        return 'CONFIRMEE';
      case 'EN_ATTENTE':
        return 'En attente';
      case 'ANNULEE':
        return 'Annulée';
      default:
        return status;
    }
  };

  // Fonction pour formater les produits d'une commande
  const formatProduits = (panierProduits: PanierProduit[]) => {
    if (!panierProduits || panierProduits.length === 0) return 'Aucun produit';
    
    if (panierProduits.length === 1) {
      const item = panierProduits[0];
      return `${item.produit?.nom || 'Produit'} - ${item.quantite} unité${item.quantite > 1 ? 's' : ''}`;
    }
    
    return `${panierProduits.length} produits différents`;
  };

  // Fonction pour calculer le total des produits
  const calculateTotal = (panierProduits: PanierProduit[]) => {
    if (!panierProduits || panierProduits.length === 0) return 0;
    return panierProduits.reduce((total, item) => total + (item.prixUnitaire * item.quantite), 0);
  };

  // Fonction pour obtenir le message d'état vide approprié
  const getEmptyStateMessage = () => {
    if (hasError) {
      return errorMessage;
    }
    
    if (activeFilter === 'all') {
      return 'Aucune commande trouvée';
    }
    
    const filterLabel = filterButtons.find(f => f.key === activeFilter)?.label || activeFilter;
    return `Aucune commande ${filterLabel.toLowerCase()}`;
  };

  const renderOrderCard = ({ item }: { item: Commande }) => {
    const paymentInfo = getPaymentInfo(item);
    
    // Ajout des handlers pour les actions
    const handleValiderPaiement = async () => {
      if (!item.paiement) return;
      setActionLoading(item.id + '-valider-paiement');
      try {
        await updatePaiementStatut(item.paiement.id, 'VALIDE');
        Alert.alert('Succès', 'Paiement validé');
        await loadCommandes(activeFilter === 'all' ? undefined : activeFilter);
      } catch (error: any) {
        Alert.alert('Erreur', error.message || 'Erreur lors de la validation du paiement');
      } finally {
        setActionLoading(null);
      }
    };

    const handleMarquerLivree = async () => {
      setActionLoading(item.id + '-livree');
      try {
        await marquerLivree(item.id);
        Alert.alert('Succès', 'Commande marquée comme livrée');
        await loadCommandes(activeFilter === 'all' ? undefined : activeFilter);
      } catch (error: any) {
        Alert.alert('Erreur', error.message || 'Erreur lors du changement de statut');
      } finally {
        setActionLoading(null);
      }
    };

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.client?.prenom?.charAt(0) || 'C'}{item.client?.nom?.charAt(0) || 'L'}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>
                {item.client?.prenom || 'Prénom'} {item.client?.nom || 'Nom'}
              </Text>
              <Text style={styles.productInfo}>
                {formatProduits(item.panierProduits)}
              </Text>
              <Text style={styles.orderAmount}>
                {item.montant?.toLocaleString() || '0'} FCFA
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
              <Text style={styles.statusText}>{getStatusText(item.statut)}</Text>
            </View>
            {/* Affichage de la méthode de paiement */}
          
          </View>
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.orderDate}>
            {item.dateCommande ? new Date(item.dateCommande).toLocaleDateString('fr-FR') : 'Date non disponible'} à {item.dateCommande ? new Date(item.dateCommande).toLocaleTimeString('fr-FR') : 'Date non disponible'}
          </Text>
            <View style={[styles.paymentBadge, { backgroundColor: paymentInfo.backgroundColor }]}>
              <Text style={[styles.paymentText, { color: paymentInfo.color }]}>
                {paymentInfo.text}
              </Text>
            </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => handleShowDetails(item)}
          >
            <Text style={styles.detailsButtonText}>📋 Voir les détails</Text>
          </TouchableOpacity>
          {/* Bouton pour valider le paiement à la livraison, juste à côté de Voir les détails */}
          {item.paiement && item.paiement.methode === 'PAIEMENT_A_LA_LIVRAISON' && item.paiement.statut !== 'VALIDE' && item.statut !== 'ANNULEE' && (
            <TouchableOpacity
              style={[styles.acceptButton, actionLoading === item.id + '-valider-paiement' && { opacity: 0.6 }]}
              onPress={handleValiderPaiement}
              disabled={actionLoading !== null}
            >
              <Text style={styles.acceptButtonText}>{actionLoading === item.id + '-valider-paiement' ? '...' : 'Valider paiement'}</Text>
            </TouchableOpacity>
          )}
          {/* Bouton pour marquer comme livrée */}
          {item.statut === 'CONFIRMEE' && item.paiement && item.paiement.statut === 'VALIDE' && (
            <TouchableOpacity
              style={[styles.acceptButton, actionLoading === item.id + '-livree' && { opacity: 0.6 }]}
              onPress={handleMarquerLivree}
              disabled={actionLoading !== null}
            >
              <Text style={styles.acceptButtonText}>{actionLoading === item.id + '-livree' ? '...' : 'Marquer Livrée'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderDetailsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Détails de la commande</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingDetails ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Chargement des détails...</Text>
            </View>
          ) : selectedCommande ? (
            <>
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Informations client */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>👤 Informations client</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nom complet:</Text>
                    <Text style={styles.detailValue}>
                      {selectedCommande.client?.prenom} {selectedCommande.client?.nom}
                    </Text>
                  </View>
                  {selectedCommande.client?.email && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue}>{selectedCommande.client.email}</Text>
                    </View>
                  )}
                  {selectedCommande.client?.telephone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Téléphone:</Text>
                      <Text style={styles.detailValue}>{selectedCommande.client.telephone}</Text>
                    </View>
                  )}
                </View>

                {/* Informations commande */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>📋 Informations commande</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Numéro:</Text>
                    <Text style={styles.detailValue}>{selectedCommande.numero}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedCommande.dateCommande).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Statut:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCommande.statut) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedCommande.statut)}</Text>
                    </View>
                  </View>
                  {/* Informations de paiement dans le modal */}
                  {selectedCommande.paiement && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Mode de paiement:</Text>
                        <Text style={styles.detailValue}>
                          {selectedCommande.paiement.methode === 'PAIEMENT_A_LA_LIVRAISON' 
                            ? 'Paiement à la livraison' 
                            : selectedCommande.paiement.methode}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Statut paiement:</Text>
                        <View style={[styles.paymentBadge, { backgroundColor: getPaymentInfo(selectedCommande).backgroundColor }]}>
                          <Text style={[styles.paymentText, { color: getPaymentInfo(selectedCommande).color }]}>
                            {getPaymentInfo(selectedCommande).text}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  {selectedCommande.adresseLivraison && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Adresse de livraison:</Text>
                      <Text style={styles.detailValue}>{selectedCommande.adresseLivraison}</Text>
                    </View>
                  )}
                </View>

                {/* Produits */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>🛍️ Produits commandés</Text>
                  {selectedCommande.panierProduits?.map((item, index) => (
                    <View key={item.id || index} style={styles.productItem}>
                      <View style={styles.productHeader}>
                        <Text style={styles.productName}>{item.produit?.nom || 'Produit'}</Text>
                        <Text style={styles.productQuantity}>x{item.quantite}</Text>
                      </View>
                      {item.produit?.description && (
                        <Text style={styles.productDescription}>{item.produit.description}</Text>
                      )}
                      <View style={styles.productPricing}>
                        <Text style={styles.productUnitPrice}>
                          Prix unitaire: {item.prixUnitaire?.toLocaleString() || '0'} FCFA
                        </Text>
                        <Text style={styles.productTotalPrice}>
                          Total: {((item.prixUnitaire || 0) * item.quantite).toLocaleString()} FCFA
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Total */}
                <View style={styles.detailSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total de la commande:</Text>
                    <Text style={styles.totalValue}>
                      {selectedCommande.montant?.toLocaleString() || '0'} FCFA
                    </Text>
                  </View>
                </View>
              </ScrollView>
              {selectedCommande.statut === 'EN_ATTENTE' && (
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={[styles.acceptButton, actionLoading === selectedCommande.id + '-accepter' && { opacity: 0.6 }]}
                    onPress={async () => {
                      await handleAccepter(selectedCommande.id);
                      setModalVisible(false);
                    }}
                    disabled={actionLoading !== null}
                  >
                    <Text style={styles.acceptButtonText}>{actionLoading === selectedCommande.id + '-accepter' ? '...' : 'Accepter'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.refuseButton, actionLoading === selectedCommande.id + '-refuser' && { opacity: 0.6 }]}
                    onPress={async () => {
                      await handleRefuser(selectedCommande.id);
                      setModalVisible(false);
                    }}
                    disabled={actionLoading !== null}
                  >
                    <Text style={styles.refuseButtonText}>{actionLoading === selectedCommande.id + '-refuser' ? '...' : 'Refuser'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.modalError}>
              <Text style={styles.errorText}>Impossible de charger les détails</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MES COMMANDES</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        <FlatList
          data={filterButtons}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item: filter }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={styles.filterIcon}>{filter.icon}</Text>
              <Text style={[
                styles.filterText,
                activeFilter === filter.key && styles.activeFilterText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Liste des commandes */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement des commandes...</Text>
        </View>
      ) : commandes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>{getEmptyStateMessage()}</Text>
          {!hasError && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={commandes}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
        />
      )}

      {/* Modal de détails */}
      {renderDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  filterButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
    minWidth: 80,
  },
  activeFilterButton: {
    backgroundColor: '#E8F5E8',
  },
  filterIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  filterText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  activeFilterText: {
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  orderAmount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Nouveaux styles pour la méthode de paiement
  paymentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderNumber: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  detailsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  refuseButton: {
    backgroundColor:'#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  refuseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalError: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  productItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  productQuantity: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productUnitPrice: {
    fontSize: 12,
    color: '#666',
  },
  productTotalPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
});