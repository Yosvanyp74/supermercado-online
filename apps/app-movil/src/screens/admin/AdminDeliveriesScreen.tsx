import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Truck,
  Clock,
  CheckCircle,
  MapPin,
  User,
  Package,
  XCircle,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminDeliveries'>;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ASSIGNED: { label: 'Atribuída', color: '#3b82f6', bg: '#dbeafe', icon: User },
  PICKED_UP: { label: 'Retirada', color: '#8b5cf6', bg: '#ede9fe', icon: Package },
  IN_TRANSIT: { label: 'Em trânsito', color: '#f59e0b', bg: '#fef3c7', icon: Truck },
  DELIVERED: { label: 'Entregue', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  FAILED: { label: 'Falhou', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
};

export function AdminDeliveriesScreen({ navigation }: Props) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = useCallback(async () => {
    try {
      const { data } = await adminApi.getDeliveries();
      const items = data?.data || data;
      setDeliveries(Array.isArray(items) ? items : []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDeliveries(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadDeliveries);
    return unsub;
  }, [navigation]);

  const handleAssign = () => {
    Alert.prompt(
      'Atribuir Entrega',
      'Digite o ID do pedido:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Próximo',
          onPress: (orderId: string | undefined) => {
            if (!orderId?.trim()) return;
            Alert.prompt(
              'Entregador',
              'Digite o ID do entregador:',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Atribuir',
                  onPress: async (deliveryPersonId: string | undefined) => {
                    if (!deliveryPersonId?.trim()) return;
                    try {
                      await adminApi.assignDelivery({
                        orderId: orderId.trim(),
                        deliveryPersonId: deliveryPersonId.trim(),
                      });
                      Alert.alert('Sucesso', 'Entrega atribuída');
                      loadDeliveries();
                    } catch (err: any) {
                      Alert.alert('Erro', err?.response?.data?.message || 'Falha ao atribuir');
                    }
                  },
                },
              ],
              'plain-text',
            );
          },
        },
      ],
      'plain-text',
    );
  };

  const renderDelivery = ({ item }: { item: any }) => {
    const st = STATUS_CONFIG[item.status] || STATUS_CONFIG['ASSIGNED'];
    const Icon = st.icon;
    const person = item.deliveryPerson || item.driver;

    return (
      <TouchableOpacity
        style={[styles.card, shadow.sm]}
        onPress={() => navigation.navigate('AdminDeliveryDetail', { orderId: item.orderId || item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              Pedido #{item.order?.orderNumber || item.orderId?.slice(-8) || '—'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Icon size={12} color={st.color} />
              <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <User size={14} color={colors.gray[400]} />
            <Text style={styles.infoText}>
              {person?.firstName || person?.name || 'Entregador'} {person?.lastName || ''}
            </Text>
          </View>
          {(item.order?.shippingAddress || item.address) && (
            <View style={styles.infoRow}>
              <MapPin size={14} color={colors.gray[400]} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.order?.shippingAddress?.street || item.address || '—'}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Clock size={14} color={colors.gray[400]} />
            <Text style={styles.infoText}>
              {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '—'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.assignButton} onPress={handleAssign}>
        <Truck size={18} color={colors.white} />
        <Text style={styles.assignButtonText}>Atribuir Entrega</Text>
      </TouchableOpacity>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id || item.orderId || String(Math.random())}
        renderItem={renderDelivery}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDeliveries(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Truck size={40} color={colors.gray[300]} />
              <Text style={styles.emptyText}>Nenhuma entrega ativa</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.primary,
    margin: 12,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  assignButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cardHeader: { marginBottom: 8 },
  orderInfo: {
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
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: colors.gray[500], flex: 1 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 15, color: colors.gray[400], marginTop: 12 },
});
