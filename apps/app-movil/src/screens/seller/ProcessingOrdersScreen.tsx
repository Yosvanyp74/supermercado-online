import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { sellerApi } from '@/api';
import { Loading } from '@/components';
import { useTheme } from '@/theme';

import { useNavigation } from '@react-navigation/native';
import { SellerStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function ProcessingOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList>>();
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
            <Text style={styles.title}>Pedido #{item.orderNumber || item.id}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('OrderPicking', { pickingOrderId: item.pickingOrderId })}
            >
              <Text style={styles.buttonText}>Iniciar Picking</Text>
            </TouchableOpacity>
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
  button: {
    marginTop: 10,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  empty: { textAlign: 'center', color: colors.gray[400], marginTop: 40 },
});
