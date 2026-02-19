import React, { useEffect, useState, useCallback, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { useSocket } from '@/components/SocketProvider';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Package,
  MapPin,
  User,
  Clock,
  ShoppingBag,
  CheckCircle2,
  Truck,
  Navigation,
} from 'lucide-react-native';
import { DeliveryStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { deliveryApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryAvailableOrders'>;

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface AvailableOrder {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; firstName: string; lastName: string; phone?: string };
  deliveryAddress?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    complement?: string;
    latitude?: number;
    longitude?: number;
  };
  items: OrderItem[];
}

export function DeliveryAvailableOrdersScreen({ navigation }: Props) {
  const isMounted = useRef(true);
  const socket = useSocket();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const loadOrders = useCallback(async (showToast = false) => {
    try {
      const res = await deliveryApi.getAvailable();
      const ordersArr = Array.isArray(res.data) ? res.data : [];
      setOrders(ordersArr);
      if (showToast) {
        Toast.show({
          type: 'info',
          text1: `Pedidos disponíveis: ${ordersArr.length}`,
          text2: 'Lista atualizada após evento socket',
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    isMounted.current = true;
    loadOrders();
    return () => { isMounted.current = false; };
  }, [loadOrders]);

  // WebSocket: refrescar lista en tiempo real
  useEffect(() => {
    if (!socket) return;
    const handleOrderReady = (payload: any) => {
      console.log('Socket event recebido (delivery available):', payload);
      loadOrders(true);
    };
    const handleOrderAccepted = (payload: any) => {
      console.log('Socket event recebido (delivery accepted):', payload);
      loadOrders(true);
    };
    socket.on('orderReadyForPickup', handleOrderReady);
    socket.on('deliveryAssigned', handleOrderAccepted);
    return () => {
      socket.off('orderReadyForPickup', handleOrderReady);
      socket.off('deliveryAssigned', handleOrderAccepted);
    };
  }, [socket]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadOrders();
    });
    return unsub;
  }, [navigation, loadOrders]);

  const getTimeSinceReady = (updatedAt: string) => {
    const diff = Date.now() - new Date(updatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}min`;
  };

  const handleAcceptOrder = (order: AvailableOrder) => {
    const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
    Alert.alert(
      'Aceitar Entrega',
      `Deseja aceitar a entrega do pedido #${order.orderNumber}?\n\n` +
        `Cliente: ${order.customer.name}\n` +
        `${itemCount} item(ns) — R$ ${order.total.toFixed(2)}\n` +
        (order.deliveryAddress
          ? `Endereço: ${order.deliveryAddress.street}, ${order.deliveryAddress.number}\n${order.deliveryAddress.neighborhood}`
          : ''),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          style: 'default',
          onPress: () => doAcceptOrder(order.id),
        },
      ],
    );
  };

  const doAcceptOrder = async (orderId: string) => {
    setAcceptingId(orderId);
    try {
      await deliveryApi.selfAssign(orderId);
      Alert.alert(
        'Entrega Aceita!',
        'O pedido foi atribuído a você. Vá até a loja para retirar.',
        [
          {
            text: 'Ver Minhas Entregas',
            onPress: () => navigation.navigate('DeliveryActive'),
          },
          {
            text: 'Continuar Aqui',
            onPress: () => loadOrders(),
          },
        ],
      );
      // Remove from local list immediately
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Não foi possível aceitar este pedido. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setAcceptingId(null);
    }
  };

  const renderOrder = ({ item }: { item: AvailableOrder }) => {
    const itemCount = item.items.reduce((sum, i) => sum + i.quantity, 0);
    const isAccepting = acceptingId === item.id;

    return (
      <View style={[styles.card, shadow.sm]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <View style={styles.timeBadge}>
              <Clock size={12} color={colors.gray[500]} />
              <Text style={styles.timeText}>
                Pronto há {getTimeSinceReady(item.updatedAt)}
              </Text>
            </View>
          </View>
          <View style={styles.feeBadge}>
            <Text style={styles.feeLabel}>Taxa entrega</Text>
            <Text style={styles.feeValue}>
              R$ {item.deliveryFee.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.infoRow}>
          <User size={16} color={colors.gray[500]} />
          <Text style={styles.infoText}>{item.customer.name}</Text>
        </View>

        {/* Address */}
        {item.deliveryAddress && (
          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.delivery.primary} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.deliveryAddress.street}, {item.deliveryAddress.number}
              {item.deliveryAddress.complement
                ? ` - ${item.deliveryAddress.complement}`
                : ''}
              {'\n'}
              {item.deliveryAddress.neighborhood}, {item.deliveryAddress.city}
            </Text>
          </View>
        )}

        {/* Items & Total */}
        <View style={styles.summaryRow}>
          <View style={styles.itemsInfo}>
            <ShoppingBag size={14} color={colors.gray[400]} />
            <Text style={styles.itemsText}>
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </Text>
          </View>
          <Text style={styles.totalText}>R$ {item.total.toFixed(2)}</Text>
        </View>

        {/* Items list preview */}
        <View style={styles.itemsList}>
          {item.items.slice(0, 3).map((orderItem) => (
            <View key={orderItem.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{orderItem.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.productName}
              </Text>
            </View>
          ))}
          {item.items.length > 3 && (
            <Text style={styles.moreItems}>
              +{item.items.length - 3} mais itens
            </Text>
          )}
        </View>

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesRow}>
            <Text style={styles.notesLabel}>Obs:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        {/* Accept button */}
        <TouchableOpacity
          style={[styles.acceptButton, isAccepting && styles.acceptButtonDisabled]}
          onPress={() => handleAcceptOrder(item)}
          disabled={isAccepting}
          activeOpacity={0.7}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Truck size={18} color={colors.white} />
              <Text style={styles.acceptButtonText}>Aceitar Entrega</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      {/* Count header */}
      <View style={styles.countHeader}>
        <Package size={20} color={colors.delivery.primary} />
        <Text style={styles.countText}>
          {orders.length}{' '}
          {orders.length === 1 ? 'pedido disponível' : 'pedidos disponíveis'}
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }}
            colors={[colors.delivery.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Nenhum pedido disponível</Text>
            <Text style={styles.emptySubtitle}>
              Quando novos pedidos forem preparados, eles aparecerão aqui para
              você aceitar
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                setRefreshing(true);
                loadOrders();
              }}
            >
              <Navigation size={16} color={colors.delivery.primary} />
              <Text style={styles.refreshButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.delivery.background,
  },
  countHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  countText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
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
    fontSize: 17,
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
  feeBadge: {
    backgroundColor: colors.delivery.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 9,
    color: colors.delivery.primary,
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.delivery.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    marginTop: 6,
  },
  itemsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  itemsList: {
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
    color: colors.delivery.primary,
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
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.delivery.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.delivery.light,
    borderRadius: 10,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.delivery.primary,
  },
});
