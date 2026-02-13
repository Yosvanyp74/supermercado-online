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
  Clock,
  CheckCircle,
  Package,
  XCircle,
  FileText,
  Plus,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminPurchaseOrders'>;

const PO_STATUS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: 'Pendente', color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  ORDERED: { label: 'Pedido', color: '#3b82f6', bg: '#dbeafe', icon: FileText },
  RECEIVED: { label: 'Recebido', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
};

export function AdminPurchaseOrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await adminApi.getPurchaseOrders({ limit: 50 });
      const items = data?.data || data?.items || data;
      setOrders(Array.isArray(items) ? items : []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadOrders);
    return unsub;
  }, [navigation]);

  const handleReceive = (id: string) => {
    Alert.alert('Receber pedido', 'Confirmar recebimento e atualizar estoque?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await adminApi.receivePurchaseOrder(id);
            Alert.alert('Sucesso', 'Pedido recebido e estoque atualizado');
            loadOrders();
          } catch (err: any) {
            Alert.alert('Erro', err?.response?.data?.message || 'Falha ao receber');
          }
        },
      },
    ]);
  };

  const renderOrder = ({ item }: { item: any }) => {
    const st = PO_STATUS[item.status] || PO_STATUS['PENDING'];
    const Icon = st.icon;
    const supplier = item.supplier;
    const canReceive = item.status === 'PENDING' || item.status === 'ORDERED';

    return (
      <View style={[styles.card, shadow.sm]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.poNumber}>
              OC #{item.orderNumber || item.id?.slice(-8) || '—'}
            </Text>
            {supplier && (
              <Text style={styles.supplierName}>{supplier.name || supplier.companyName}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Icon size={12} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.metaText}>
            {item.items?.length || 0} itens · R$ {Number(item.total || item.totalAmount || 0).toFixed(2)}
          </Text>
          <Text style={styles.dateText}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—'}
          </Text>
        </View>
        {canReceive && (
          <TouchableOpacity style={styles.receiveBtn} onPress={() => handleReceive(item.id)}>
            <Package size={16} color={colors.admin.primary} />
            <Text style={styles.receiveBtnText}>Receber</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <FileText size={40} color={colors.gray[300]} />
              <Text style={styles.emptyText}>Nenhuma ordem de compra</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  list: { padding: 12, paddingBottom: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  poNumber: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  supplierName: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: { fontSize: 13, color: colors.gray[500] },
  dateText: { fontSize: 12, color: colors.gray[400] },
  receiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: colors.admin.light,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.admin.accent,
  },
  receiveBtnText: { fontSize: 13, fontWeight: '600', color: colors.admin.primary },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray[400], marginTop: 12 },
});
