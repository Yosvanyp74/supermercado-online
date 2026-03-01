import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { sellerApi } from '@/api';
import { Loading } from '@/components';
import { useTheme } from '@/theme';

export default function ProcessingOrdersScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await sellerApi.getMyPickingOrders();
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>Pedido #{item.id}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
            {/* Agrega más detalles según el modelo de pedido */}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido em processamento.</Text>}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50], padding: 16 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  status: { color: colors.primary[600] },
  empty: { textAlign: 'center', color: colors.gray[400], marginTop: 40 },
});
