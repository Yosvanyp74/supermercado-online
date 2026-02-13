import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Package,
  Clock,
  ChevronRight,
  MapPin,
  ShoppingBag,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Loading, EmptyState, Badge } from '@/components';
import { sellerApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'OrderQueue'>;

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  total: number;
  deliveryMethod: string;
  createdAt: string;
  status: string;
}

export function OrderQueueScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await sellerApi.getPendingOrders();
      const ordersData = Array.isArray(data) ? data : (data as any)?.data || [];
      setOrders(ordersData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const handleAcceptOrder = async (order: PendingOrder) => {
    try {
      const { data: pickingOrder } = await sellerApi.acceptOrder(order.id);
      Toast.show({ type: 'success', text1: 'Pedido aceito' });
      navigation.navigate('OrderPicking', { pickingOrderId: pickingOrder.id });
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao aceitar pedido' });
    }
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}min`;
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {orders.filter((o) => o.deliveryMethod === 'delivery').length}
          </Text>
          <Text style={styles.statLabel}>Entrega</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {orders.filter((o) => o.deliveryMethod === 'pickup').length}
          </Text>
          <Text style={styles.statLabel}>Retirada</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }}
            tintColor={colors.seller.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => handleAcceptOrder(item)}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>
                  Pedido #{item.orderNumber}
                </Text>
                <Text style={styles.customerName}>{item.customerName}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock size={12} color={colors.warning} />
                <Text style={styles.timeText}>
                  {getTimeSince(item.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.orderMeta}>
              <View style={styles.metaItem}>
                <ShoppingBag size={14} color={colors.gray[400]} />
                <Text style={styles.metaText}>
                  {item.itemCount} {item.itemCount === 1 ? 'item' : 'itens'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MapPin size={14} color={colors.gray[400]} />
                <Text style={styles.metaText}>
                  {item.deliveryMethod === 'delivery'
                    ? 'Entrega'
                    : 'Retirada'}
                </Text>
              </View>
              <Text style={styles.orderTotal}>
                R$ {Number(item.total || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.acceptBar}>
              <Text style={styles.acceptText}>Aceitar e Preparar</Text>
              <ChevronRight size={18} color={colors.white} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Fila vazia"
            description="Nenhum pedido pendente no momento"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.seller.primary,
  },
  statLabel: { fontSize: 11, color: colors.gray[500], marginTop: 2 },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  orderInfo: { flex: 1 },
  orderNumber: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  customerName: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  timeText: { fontSize: 11, fontWeight: '600', color: colors.warning },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 14,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.gray[500] },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginLeft: 'auto',
  },
  acceptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.seller.primary,
    paddingVertical: 12,
    gap: 4,
  },
  acceptText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});
