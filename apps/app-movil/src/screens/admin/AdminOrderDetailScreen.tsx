import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle, Clock, Truck, Package, XCircle } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { getImageUrl } from '@/config';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminOrderDetail'>;

const STATUS_FLOW = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Em entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export function AdminOrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadOrder = async () => {
    try {
      const { data } = await adminApi.getOrder(orderId);
      setOrder(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o pedido');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrder(); }, []);

  const handleUpdateStatus = async (newStatus: string) => {
    Alert.alert(
      'Atualizar status',
      `Mudar para "${STATUS_LABELS[newStatus]}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setUpdating(true);
            try {
              await adminApi.updateOrderStatus(orderId, { status: newStatus });
              setOrder({ ...order, status: newStatus });
            } catch (err: any) {
              Alert.alert('Erro', err?.response?.data?.message || 'Falha ao atualizar');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.admin.primary} />
      </View>
    );
  }

  if (!order) return null;

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <ScrollView style={styles.container}>
      {/* Order header */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.orderNumber}>Pedido #{order.orderNumber || order.id?.slice(-8)}</Text>
        <Text style={styles.date}>
          {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
          {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: order.status === 'CANCELLED' ? '#fee2e2' : '#dcfce7' }]}>
          <Text style={[styles.statusBadgeText, { color: order.status === 'CANCELLED' ? '#ef4444' : '#16a34a' }]}>
            {STATUS_LABELS[order.status] || order.status}
          </Text>
        </View>
      </View>

      {/* Customer */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text style={styles.customerName}>
          {order.customer?.firstName || order.user?.firstName || ''}{' '}
          {order.customer?.lastName || order.user?.lastName || ''}
        </Text>
        <Text style={styles.customerEmail}>
          {order.customer?.email || order.user?.email || ''}
        </Text>
        {order.customer?.phone || order.user?.phone ? (
          <Text style={styles.customerEmail}>
            {order.customer?.phone || order.user?.phone}
          </Text>
        ) : null}
      </View>

      {/* Items */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionTitle}>Itens ({order.items?.length || 0})</Text>
        {order.items?.map((item: any) => {
          const imgUri = getImageUrl(item.product?.images?.[0]?.url || item.product?.mainImageUrl);
          return (
            <View key={item.id} style={styles.itemRow}>
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemPlaceholder]}>
                  <Text style={styles.itemPlaceholderText}>
                    {(item.product?.name || item.productName || '?').charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product?.name || item.productName || 'Produto'}
                </Text>
                <Text style={styles.itemQty}>
                  {item.quantity}x R$ {Number(item.unitPrice || item.price || 0).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                R$ {(item.quantity * Number(item.unitPrice || item.price || 0)).toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Totals */}
      <View style={[styles.card, shadow.sm]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>R$ {Number(order.subtotal || order.total || 0).toFixed(2)}</Text>
        </View>
        {order.deliveryFee > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Entrega</Text>
            <Text style={styles.totalValue}>R$ {Number(order.deliveryFee).toFixed(2)}</Text>
          </View>
        )}
        {order.discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Desconto</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>
              -R$ {Number(order.discount).toFixed(2)}
            </Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>R$ {Number(order.total || 0).toFixed(2)}</Text>
        </View>
      </View>

      {/* Status actions */}
      {nextStatus && order.status !== 'CANCELLED' && (
        <TouchableOpacity
          style={[styles.actionButton, updating && { opacity: 0.6 }]}
          onPress={() => handleUpdateStatus(nextStatus)}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.actionButtonText}>
              Avançar para: {STATUS_LABELS[nextStatus]}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {order.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleUpdateStatus('CANCELLED')}
        >
          <XCircle size={18} color={colors.destructive} />
          <Text style={styles.cancelButtonText}>Cancelar Pedido</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 12,
    marginBottom: 0,
  },
  orderNumber: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  date: { fontSize: 13, color: colors.gray[400], marginTop: 4 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusBadgeText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground, marginBottom: 10 },
  customerName: { fontSize: 15, color: colors.foreground },
  customerEmail: { fontSize: 13, color: colors.gray[400], marginTop: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  itemPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  itemPlaceholderText: { fontSize: 16, fontWeight: '700', color: colors.gray[400] },
  itemInfo: { flex: 1, marginLeft: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  itemQty: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 14, color: colors.gray[500] },
  totalValue: { fontSize: 14, color: colors.foreground },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 8,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  grandTotalValue: { fontSize: 18, fontWeight: '700', color: colors.admin.primary },
  actionButton: {
    backgroundColor: colors.admin.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  actionButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 10,
    gap: 8,
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: colors.destructive },
});
