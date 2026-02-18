import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react-native';
import { SellerStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { sellerApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'ReadyForDelivery'>;

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: { id: string; name: string; mainImageUrl?: string };
}

interface ReadyOrder {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fulfillmentType: string;
  customer: { id: string; name: string; phone?: string };
  address?: { street: string; number: string; neighborhood: string; city: string; complement?: string };
  items: OrderItem[];
  delivery?: { id: string; status: string; deliveryPerson?: { id: string; name: string } } | null;
}

export function ReadyForDeliveryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [orders, setOrders] = useState<ReadyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await sellerApi.getReadyForDeliveryOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadOrders);
    return unsub;
  }, [navigation, loadOrders]);

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('Sem telefone', 'Este cliente não possui telefone cadastrado.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSinceReady = (updatedAt: string) => {
    const diff = Date.now() - new Date(updatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}min`;
  };

  const renderOrderItem = ({ item }: { item: ReadyOrder }) => {
    const hasDelivery = item.delivery && item.delivery.deliveryPerson;
    const isPickup = item.fulfillmentType === 'PICKUP';
    const itemCount = item.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <View style={[styles.card, shadow.sm]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <View style={styles.timeBadge}>
              <Clock size={12} color={colors.gray[500]} />
              <Text style={styles.timeText}>{getTimeSinceReady(item.updatedAt)} esperando</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, hasDelivery ? styles.assignedBadge : isPickup ? styles.pickupBadge : styles.pendingBadge]}>
            {hasDelivery ? (
              <Truck size={12} color="#15803d" />
            ) : isPickup ? (
              <ShoppingBag size={12} color="#7c3aed" />
            ) : (
              <Package size={12} color="#ea580c" />
            )}
            <Text style={[styles.statusText, hasDelivery ? styles.assignedText : isPickup ? styles.pickupText : styles.pendingText]}>
              {hasDelivery ? 'Entregador atribuído' : isPickup ? 'Retirada' : 'Aguardando entregador'}
            </Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.customerRow}>
          <User size={16} color={colors.gray[500]} />
          <Text style={styles.customerName}>{item.customer.name}</Text>
          {item.customer.phone && (
            <TouchableOpacity onPress={() => handleCall(item.customer.phone)} style={styles.phoneButton}>
              <Phone size={14} color={colors.seller.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Address */}
        {item.address && !isPickup && (
          <View style={styles.addressRow}>
            <MapPin size={16} color={colors.gray[400]} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.address.street}, {item.address.number}
              {item.address.complement ? ` - ${item.address.complement}` : ''}
              {'\n'}{item.address.neighborhood}, {item.address.city}
            </Text>
          </View>
        )}

        {/* Items summary */}
        <View style={styles.itemsSummary}>
          <ShoppingBag size={14} color={colors.gray[400]} />
          <Text style={styles.itemsText}>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</Text>
          <Text style={styles.totalText}>R$ {item.total.toFixed(2)}</Text>
        </View>

        {/* Delivery person info */}
        {hasDelivery && (
          <View style={styles.deliveryPersonRow}>
            <Truck size={14} color="#15803d" />
            <Text style={styles.deliveryPersonText}>
              Entregador: {item.delivery!.deliveryPerson!.name}
            </Text>
          </View>
        )}

        {/* Items detail (expandable-like) */}
        <View style={styles.itemsList}>
          {item.items.slice(0, 3).map((orderItem) => (
            <View key={orderItem.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{orderItem.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>{orderItem.productName}</Text>
            </View>
          ))}
          {item.items.length > 3 && (
            <Text style={styles.moreItems}>+{item.items.length - 3} mais itens</Text>
          )}
        </View>

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesRow}>
            <Text style={styles.notesLabel}>Obs:</Text>
            <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
          </View>
        )}

        {/* Footer with date */}
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>Pedido em {formatDate(item.createdAt)}</Text>
          {isPickup && (
            <View style={styles.pickupTag}>
              <CheckCircle2 size={12} color="#7c3aed" />
              <Text style={styles.pickupTagText}>Pronto para retirada</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{orders.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#ea580c' }]}>
            {orders.filter(o => !o.delivery?.deliveryPerson && o.fulfillmentType !== 'PICKUP').length}
          </Text>
          <Text style={styles.summaryLabel}>Sem entregador</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#15803d' }]}>
            {orders.filter(o => o.delivery?.deliveryPerson).length}
          </Text>
          <Text style={styles.summaryLabel}>Atribuídos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#7c3aed' }]}>
            {orders.filter(o => o.fulfillmentType === 'PICKUP').length}
          </Text>
          <Text style={styles.summaryLabel}>Retirada</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }}
            colors={[colors.seller.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Nenhum pedido pronto</Text>
            <Text style={styles.emptySubtitle}>
              Quando pedidos forem separados, eles aparecerão aqui aguardando entrega ou retirada
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.gray[400],
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.gray[200],
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#fff7ed',
  },
  assignedBadge: {
    backgroundColor: '#f0fdf4',
  },
  pickupBadge: {
    backgroundColor: '#f5f3ff',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingText: {
    color: '#ea580c',
  },
  assignedText: {
    color: '#15803d',
  },
  pickupText: {
    color: '#7c3aed',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  phoneButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: colors.gray[500],
    lineHeight: 18,
  },
  itemsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  itemsText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[500],
  },
  totalText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  deliveryPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginTop: 4,
  },
  deliveryPersonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#15803d',
  },
  itemsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.seller.primary,
    width: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: colors.gray[600],
  },
  moreItems: {
    fontSize: 11,
    color: colors.gray[400],
    fontStyle: 'italic',
    marginTop: 4,
  },
  notesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  dateText: {
    fontSize: 11,
    color: colors.gray[400],
  },
  pickupTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickupTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7c3aed',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[500],
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
