import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Truck,
  User,
  MapPin,
  Clock,
  CheckCircle,
  Package,
  Phone,
  XCircle,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminDeliveryDetail'>;

const STATUS_FLOW = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Atribuída',
  PICKED_UP: 'Retirada',
  IN_TRANSIT: 'Em trânsito',
  DELIVERED: 'Entregue',
  FAILED: 'Falhou',
};

export function AdminDeliveryDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { orderId } = route.params;
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadDelivery();
  }, []);

  const loadDelivery = async () => {
    try {
      const { data } = await adminApi.getDeliveryByOrder(orderId);
      setDelivery(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a entrega');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!delivery) return;
    const currentIdx = STATUS_FLOW.indexOf(delivery.status);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return;

    const nextStatus = STATUS_FLOW[currentIdx + 1];
    setUpdating(true);
    try {
      await adminApi.updateDeliveryStatus(delivery.id, { status: nextStatus });
      setDelivery({ ...delivery, status: nextStatus });
      Alert.alert('Sucesso', `Status atualizado para: ${STATUS_LABELS[nextStatus]}`);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Falha ao atualizar');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.admin.primary} />
      </View>
    );
  }

  if (!delivery) return null;

  const person = delivery.deliveryPerson || delivery.driver;
  const order = delivery.order;
  const currentIdx = STATUS_FLOW.indexOf(delivery.status);
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
  const nextStatus = canAdvance ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <ScrollView style={styles.container}>
      {/* Status timeline */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.cardTitle}>Status da Entrega</Text>
        <View style={styles.timeline}>
          {STATUS_FLOW.map((s, i) => {
            const isActive = STATUS_FLOW.indexOf(delivery.status) >= i;
            const isCurrent = delivery.status === s;
            return (
              <View key={s} style={styles.timelineItem}>
                <View style={[styles.timelineDot, isActive && styles.timelineDotActive, isCurrent && styles.timelineDotCurrent]}>
                  {isActive && <CheckCircle size={14} color={colors.white} />}
                </View>
                {i < STATUS_FLOW.length - 1 && (
                  <View style={[styles.timelineLine, isActive && styles.timelineLineActive]} />
                )}
                <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>
                  {STATUS_LABELS[s]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Delivery person */}
      {person && (
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>Entregador</Text>
          <View style={styles.personRow}>
            <View style={styles.personAvatar}>
              <User size={22} color={colors.admin.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>
                {person.firstName || person.name || '—'} {person.lastName || ''}
              </Text>
              {person.phone && (
                <View style={styles.infoRow}>
                  <Phone size={13} color={colors.gray[400]} />
                  <Text style={styles.infoText}>{person.phone}</Text>
                </View>
              )}
              {person.email && (
                <Text style={styles.infoTextSub}>{person.email}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Order info */}
      {order && (
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>Pedido</Text>
          <View style={styles.detailRow}>
            <Package size={14} color={colors.gray[400]} />
            <Text style={styles.detailText}>
              #{order.orderNumber || orderId.slice(-8)}
            </Text>
          </View>
          {order.shippingAddress && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={colors.gray[400]} />
              <Text style={styles.detailText}>
                {order.shippingAddress.street}, {order.shippingAddress.number}
                {order.shippingAddress.neighborhood ? ` - ${order.shippingAddress.neighborhood}` : ''}
              </Text>
            </View>
          )}
          {order.customer && (
            <View style={styles.detailRow}>
              <User size={14} color={colors.gray[400]} />
              <Text style={styles.detailText}>
                {order.customer.firstName} {order.customer.lastName}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Clock size={14} color={colors.gray[400]} />
            <Text style={styles.detailText}>
              {order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : '—'}
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      {canAdvance && nextStatus && (
        <TouchableOpacity
          style={[styles.advanceButton, updating && { opacity: 0.6 }]}
          onPress={handleAdvanceStatus}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Truck size={20} color={colors.white} />
              <Text style={styles.advanceButtonText}>
                Avançar para: {STATUS_LABELS[nextStatus]}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotActive: { backgroundColor: colors.admin.primary },
  timelineDotCurrent: { backgroundColor: '#16a34a' },
  timelineLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: colors.gray[200],
    zIndex: -1,
  },
  timelineLineActive: { backgroundColor: colors.admin.primary },
  timelineLabel: {
    fontSize: 10,
    color: colors.gray[400],
    marginTop: 6,
    textAlign: 'center',
  },
  timelineLabelActive: { color: colors.admin.primary, fontWeight: '600' },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.admin.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  personName: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 13, color: colors.gray[500] },
  infoTextSub: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: { fontSize: 14, color: colors.gray[600], flex: 1 },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.primary,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  advanceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
