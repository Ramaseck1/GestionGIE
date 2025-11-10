import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView,TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { getStatsCommandes } from '../services/commande';
import { useRouter } from 'expo-router';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getStatsCommandes();
        setStats(data);
        // Animation fade-in après chargement
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }).start();
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    // Reset animation si on relance le chargement
    return () => fadeAnim.setValue(0);
  }, []);

  const renderTrendIndicator = (trend:any, color:any) => {
    if (!trend) return null;
    return (
      <View style={styles.trendContainer}>
        <View style={[styles.trendDot, { backgroundColor: color }]} />
        <Text style={[styles.trendText, { color }]}>{trend}</Text>
      </View>
    );
  };

  // Skeleton loader
  const renderSkeleton = () => (
    <View style={{ gap: 18, marginTop: 10 }}>
      {[1, 2, 3].map((_, i) => (
        <View key={i} style={styles.skeletonBlock}>
          <View style={styles.skeletonBar} />
          <View style={[styles.skeletonBar, { width: '60%', marginTop: 10 }]} />
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
        <Text style={styles.title}>STATISTIQUES</Text>
      </View>
      {loading ? (
        renderSkeleton()
      ) : error ? (
        <Text style={{ color: 'red', margin: 20 }}>{error}</Text>
      ) : !stats ? (
        <Text style={{ color: '#666', margin: 20 }}>Aucune statistique disponible</Text>
      ) : (
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.statBlockSimple, { backgroundColor: '#F5F5F5' }]}> 
            <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>Chiffre d'affaires</Text>
            <Text style={[styles.amountValueSimple, { color: '#4CAF50' }]}>{stats.chiffreAffaires?.toLocaleString() || '0'} FCFA</Text>
          </View>
          <View style={styles.separator} />
          <View style={[styles.statBlockSimple, { backgroundColor: '#F5F5F5' }]}> 
            <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>Total commandes</Text>
            <Text style={[styles.valueSimple, { color: '#4CAF50' }]}>{stats.totalCommandes || 0}</Text>
          </View>
          <View style={styles.separator} />
          <View style={[styles.statBlockSimple, { backgroundColor: '#F5F5F5' }]}> 
            <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>Produits les plus vendus</Text>
            <View style={styles.productList}>
              {Array.isArray(stats.produitsLesPlusVendus) && stats.produitsLesPlusVendus.length > 0 ? (
                stats.produitsLesPlusVendus.map((prod: any, idx: number) => (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.productRow,
                      pressed && { opacity: 0.6, backgroundColor: '#e0e0e0' },
                    ]}
                    android_ripple={{ color: '#ededed' }}
                  >
                    <Text style={styles.productName}>{prod.nom}</Text>
                    <Text style={[styles.productQty, { color: '#4CAF50' }]}>{prod.totalVendu}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={{ color: '#666' }}>Aucun produit vendu</Text>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 40,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    marginBottom: 30,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  statBlockSimple: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  amountValueSimple: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  valueSimple: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  productList: {
    marginTop: 6,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    color: '#333',
    fontSize: 14,
  },
  productQty: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  skeletonBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 60,
    marginBottom: 14,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  skeletonBar: {
    height: 16,
    width: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
    marginHorizontal: 2,
  },
});