import Toast from 'react-native-toast-message';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import * as SecureStore from 'expo-secure-store';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminOrders'>;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: 'Pendente', color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  CONFIRMED: { label: 'Confirmado', color: '#3b82f6', bg: '#dbeafe', icon: CheckCircle },
  PROCESSING: { label: 'Preparando', color: '#8b5cf6', bg: '#ede9fe', icon: Package },
  READY: { label: 'Pronto', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  OUT_FOR_DELIVERY: { label: 'Em entrega', color: '#3b82f6', bg: '#dbeafe', icon: Truck },
  DELIVERED: { label: 'Entregue', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
  REFUNDED: { label: 'Reembolsado', color: '#6b7280', bg: '#f3f4f6', icon: XCircle },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'PROCESSING', label: 'Preparando' },
  { value: 'DELIVERED', label: 'Entregues' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

export function AdminOrdersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (pageNum = 1, status = filter, showToast = false) => {
    try {
      // Forzar recarga sin caché
      const { data } = await adminApi.getOrders({
        page: pageNum,
        limit: 20,
        status: status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        _ts: Date.now(),
      });
      const items = data.data || data.items || data;
      if (pageNum === 1) {
        setOrders(Array.isArray(items) ? items : []);
      } else {
        setOrders((prev) => [...prev, ...(Array.isArray(items) ? items : [])]);
      }
      setHasMore(Array.isArray(items) && items.length >= 20);
      if (showToast) {
        Toast.show({
          type: 'info',
          text1: `Pedidos recargados (${Array.isArray(items) ? items.length : 0})`,
          text2: 'Lista actualizada tras evento socket',
        });
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  const isMounted = useRef(true);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    isMounted.current = true;
    console.log('Buscando token en SecureStore...');
    SecureStore.getItemAsync('auth_token').then((t) => {
      console.log('Token obtenido:', t);
      setToken(t || null);
    });
    loadOrders(1);
    return () => { isMounted.current = false; };
  }, []);

  // WebSocket: refrescar lista de pedidos en tiempo real
  useEffect(() => {
    if (!token) {
      console.log('No hay token, no se conecta el socket');
      return;
    }
    console.log('Creando socket con token:', token);
    let socket = getSocket(token);
    // Logs de conexión/desconexión/errores
    const onConnect = () => console.log('Socket conectado:', socket.id);
    const onDisconnect = (reason) => console.log('Socket desconectado:', reason);
    const onError = (err) => console.log('Socket error:', err);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    socket.on('error', onError);

    const handleOrderEvent = (payload: any) => {
      // Log para depuración
      console.log('Socket event recibido (orders):', payload);
      if (isMounted.current) loadOrders(1, filter, true);
    };
    socket.on('newOrder', handleOrderEvent);
    socket.on('orderStatusChanged', handleOrderEvent);
    socket.on('orderCancelled', handleOrderEvent);
    socket.on('orderReadyForPickup', handleOrderEvent);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      socket.off('error', onError);
      socket.off('newOrder', handleOrderEvent);
      socket.off('orderStatusChanged', handleOrderEvent);
      socket.off('orderCancelled', handleOrderEvent);
      socket.off('orderReadyForPickup', handleOrderEvent);
    };
  }, [token, loadOrders]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadOrders(1));
    return unsub;
  }, [navigation]);

  const handleFilterChange = (status: string) => {
    setFilter(status);
    setPage(1);
    setLoading(true);
    loadOrders(1, status);
  };

  const renderOrder = ({ item }: { item: any }) => {
    const st = STATUS_CONFIG[item.status] || STATUS_CONFIG['PENDING'];
    const Icon = st.icon;
    return (
      <TouchableOpacity
        style={[styles.orderCard, shadow.sm]}
        onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{item.orderNumber || item.id?.slice(-8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Icon size={12} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={styles.orderBody}>
          <Text style={styles.customerName}>
            {item.customer?.firstName || item.user?.firstName || 'Cliente'}{' '}
            {item.customer?.lastName || item.user?.lastName || ''}
          </Text>
          <Text style={styles.orderTotal}>R$ {Number(item.total || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.orderFooter}>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')} às{' '}
            {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.orderItems}>{item.items?.length || item._count?.items || 0} itens</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter */}
      <FlatList
        horizontal
        data={FILTER_OPTIONS}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
            onPress={() => handleFilterChange(item.value)}
          >
            <Text style={[styles.filterChipText, filter === item.value && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(1); }} />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadOrders(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 4,
  },
  filterChipActive: { backgroundColor: colors.admin.primary },
  filterChipText: { fontSize: 13, color: colors.gray[600] },
  filterChipTextActive: { color: colors.white, fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  customerName: { fontSize: 14, color: colors.gray[600] },
  orderTotal: { fontSize: 16, fontWeight: '700', color: colors.admin.primary },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  orderDate: { fontSize: 12, color: colors.gray[400] },
  orderItems: { fontSize: 12, color: colors.gray[400] },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray[400] },
});
