import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus, Edit, Trash2, Ticket, Percent, DollarSign } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminCoupons'>;

export function AdminCouponsScreen({ navigation }: Props) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCoupons = async () => {
    try {
      const { data } = await adminApi.getCoupons({ limit: 50 });
      const items = data.data || data.items || data;
      setCoupons(Array.isArray(items) ? items : []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadCoupons(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadCoupons);
    return unsub;
  }, [navigation]);

  const handleDelete = (id: string, code: string) => {
    Alert.alert('Excluir cupom', `Tem certeza que deseja excluir "${code}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteCoupon(id);
            setCoupons((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o cupom');
          }
        },
      },
    ]);
  };

  const renderCoupon = ({ item }: { item: any }) => {
    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
    const isPercentage = item.type === 'PERCENTAGE';
    return (
      <View style={[styles.card, shadow.sm, isExpired && styles.cardExpired]}>
        <View style={[styles.iconWrap, { backgroundColor: isPercentage ? '#ede9fe' : '#dbeafe' }]}>
          {isPercentage ? (
            <Percent size={22} color="#8b5cf6" />
          ) : (
            <DollarSign size={22} color="#3b82f6" />
          )}
        </View>
        <View style={styles.couponInfo}>
          <Text style={styles.couponCode}>{item.code}</Text>
          <Text style={styles.couponValue}>
            {isPercentage ? `${item.value}%` : `R$ ${Number(item.value || 0).toFixed(2)}`}
            {item.minOrderAmount ? ` (mín. R$ ${Number(item.minOrderAmount).toFixed(2)})` : ''}
          </Text>
          <Text style={styles.couponMeta}>
            {item.usageCount || 0}/{item.usageLimit || '∞'} usos
            {item.expiresAt
              ? ` · ${isExpired ? 'Expirado' : `Até ${new Date(item.expiresAt).toLocaleDateString('pt-BR')}`}`
              : ''}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminCouponForm', { couponId: item.id })}
            style={styles.actionBtn}
          >
            <Edit size={18} color={colors.admin.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id, item.code)} style={styles.actionBtn}>
            <Trash2 size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addBar}
        onPress={() => navigation.navigate('AdminCouponForm', {})}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.addBarText}>Novo Cupom</Text>
      </TouchableOpacity>

      <FlatList
        data={coupons}
        keyExtractor={(item) => item.id}
        renderItem={renderCoupon}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCoupons(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ticket size={40} color={colors.gray[300]} />
              <Text style={styles.emptyText}>Nenhum cupom cadastrado</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.primary,
    margin: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addBarText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  cardExpired: { opacity: 0.6 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponInfo: { flex: 1, marginLeft: 12 },
  couponCode: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  couponValue: { fontSize: 13, color: colors.admin.primary, fontWeight: '600', marginTop: 2 },
  couponMeta: { fontSize: 11, color: colors.gray[400], marginTop: 2 },
  actions: { gap: 8 },
  actionBtn: { padding: 6 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: colors.gray[400] },
});
