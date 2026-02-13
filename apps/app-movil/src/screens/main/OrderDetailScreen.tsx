import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { getImageUrl } from '@/config';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { OrdersStackParamList } from '@/navigation/types';
import { Button, Badge, Loading } from '@/components';
import { ordersApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'destructive' | 'default' }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'info' },
  PREPARING: { label: 'Preparando', variant: 'info' },
  PICKING: { label: 'Separando', variant: 'info' },
  READY: { label: 'Pronto', variant: 'success' },
  OUT_FOR_DELIVERY: { label: 'Em entrega', variant: 'info' },
  DELIVERED: { label: 'Entregue', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  PROCESSING: { label: 'Processando', variant: 'info' },
  COMPLETED: { label: 'Concluído', variant: 'success' },
  FAILED: { label: 'Falhou', variant: 'destructive' },
  REFUNDED: { label: 'Reembolsado', variant: 'warning' },
};

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data } = await ordersApi.getById(orderId);
      setOrder(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao carregar pedido' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancelar Pedido', 'Tem certeza que deseja cancelar?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersApi.cancel(orderId);
            Toast.show({ type: 'success', text1: 'Pedido cancelado' });
            loadOrder();
          } catch {
            Toast.show({ type: 'error', text1: 'Erro ao cancelar' });
          }
        },
      },
    ]);
  };

  if (loading || !order) return <Loading fullScreen />;

  const status = statusMap[order.status] || { label: order.status, variant: 'default' as const };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.card, shadow.sm]}>
        <View style={styles.header}>
          <Text style={styles.orderNumber}>
            Pedido #{order.orderNumber || order.id.slice(-6)}
          </Text>
          <Badge text={status.label} variant={status.variant} size="md" />
        </View>
        <Text style={styles.date}>
          {new Date(order.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Items */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionTitle}>Itens do Pedido</Text>
        {(order.items || []).map((item: any, idx: number) => {
          const imgUrl = item.product?.mainImageUrl || item.product?.images?.[0]?.url || item.product?.images?.[0];
          return (
          <View key={idx} style={styles.item}>
            <Image
              source={
                imgUrl
                  ? { uri: getImageUrl(imgUrl)! }
                  : require('@/assets/placeholder.png')
              }
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product?.name || item.name}</Text>
              <Text style={styles.itemQty}>{item.quantity}x R$ {item.price?.toFixed(2)}</Text>
            </View>
            <Text style={styles.itemTotal}>
              R$ {(item.quantity * item.price).toFixed(2)}
            </Text>
          </View>
          );
        })}
      </View>

      {/* Summary */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            R$ {(order.subtotal || order.total).toFixed(2)}
          </Text>
        </View>
        {order.deliveryFee > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Entrega</Text>
            <Text style={styles.summaryValue}>
              R$ {order.deliveryFee.toFixed(2)}
            </Text>
          </View>
        )}
        {order.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.discountLabel}>Desconto</Text>
            <Text style={styles.discountValue}>
              -R$ {order.discount.toFixed(2)}
            </Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {order.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {['PENDING', 'CONFIRMED'].includes(order.status) && (
          <Button
            title="Cancelar Pedido"
            onPress={handleCancel}
            variant="destructive"
            fullWidth
          />
        )}
        {['OUT_FOR_DELIVERY', 'PREPARING', 'PICKING'].includes(order.status) && (
          <Button
            title="Rastrear Pedido"
            onPress={() => navigation.navigate('TrackOrder', { orderId })}
            fullWidth
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50], padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  date: { fontSize: 13, color: colors.gray[400] },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  itemImage: { width: 48, height: 48, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '500', color: colors.gray[700] },
  itemQty: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 14, color: colors.gray[500] },
  summaryValue: { fontSize: 14, color: colors.gray[700] },
  discountLabel: { fontSize: 14, color: colors.primary[600] },
  discountValue: { fontSize: 14, color: colors.primary[600] },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary[600] },
  actions: { marginBottom: 32, gap: 8 },
});
