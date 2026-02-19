import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/components/SocketProvider';
import Toast from 'react-native-toast-message';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Package } from 'lucide-react-native';
import { OrdersStackParamList } from '@/navigation/types';
import { OrderCard, Loading, EmptyState, Button } from '@/components';
import { ordersApi } from '@/api';
import { useTheme } from '@/theme';

type Props = NativeStackScreenProps<OrdersStackParamList, 'Orders'>;

export function OrdersScreen({ navigation }: Props) {
  const socket = useSocket();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await ordersApi.getMyOrders();
      setOrders(data?.data || (Array.isArray(data) ? data : []));
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Suscribirse a cambios de estado de pedido en tiempo real
  useEffect(() => {
    if (!socket) return;
    const handleOrderStatusChanged = (payload: any) => {
      loadOrders();
      Toast.show({
        type: 'info',
        text1: payload?.title || 'Pedido atualizado',
        text2: payload?.body || 'O status do seu pedido mudou.',
      });
    };
    socket.on('orderStatusChanged', handleOrderStatusChanged);
    return () => {
      socket.off('orderStatusChanged', handleOrderStatusChanged);
    };
  }, [socket, loadOrders]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadOrders);
    return unsub;
  }, [navigation, loadOrders]);

  if (loading) return <Loading fullScreen />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={48} color={colors.gray[300]} />}
        title="Nenhum pedido"
        description="Seus pedidos aparecerão aqui"
        action={
          <Button
            title="Ir às Compras"
            onPress={() => (navigation as any).navigate('HomeTab')}
          />
        }
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      renderItem={({ item }) => (
        <OrderCard
          id={item.id}
          orderNumber={item.orderNumber || item.id.slice(-6)}
          status={item.status}
          total={item.total}
          itemCount={item.items?.length || item._count?.items || 0}
          createdAt={item.createdAt}
          onPress={() =>
            navigation.navigate('OrderDetail', { orderId: item.id })
          }
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />
      }
    />
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  list: { padding: 16 },
});
