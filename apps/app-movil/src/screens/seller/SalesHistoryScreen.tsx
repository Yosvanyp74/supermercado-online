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
import { Calendar, DollarSign, Clock } from 'lucide-react-native';
import { SellerStackParamList } from '@/navigation/types';
import { Loading, EmptyState } from '@/components';
import { sellerApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'SalesHistory'>;

interface Sale {
  id: string;
  total: number;
  paymentMethod: string;
  itemCount: number;
  customerName?: string;
  createdAt: string;
}

const methodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Crédito',
  debit_card: 'Débito',
  pix: 'PIX',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
};

export function SalesHistoryScreen({ navigation }: Props) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSales = useCallback(async () => {
    try {
      const { data } = await sellerApi.getSalesHistory();
      const salesData = Array.isArray(data) ? data : (data as any)?.data || [];
      setSales(salesData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <Loading />;

  const renderSale = ({ item }: { item: Sale }) => (
    <TouchableOpacity style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <Text style={styles.saleId}>#{item.id.slice(-6)}</Text>
        <Text style={styles.saleTotal}>R$ {Number(item.total || 0).toFixed(2)}</Text>
      </View>
      <View style={styles.saleDetails}>
        <View style={styles.detailItem}>
          <Calendar size={14} color={colors.gray[400]} />
          <Text style={styles.detailText}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={14} color={colors.gray[400]} />
          <Text style={styles.detailText}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={styles.detailItem}>
          <DollarSign size={14} color={colors.gray[400]} />
          <Text style={styles.detailText}>
            {methodLabels[item.paymentMethod] || item.paymentMethod}
          </Text>
        </View>
      </View>
      {item.customerName && (
        <Text style={styles.customerName}>Cliente: {item.customerName}</Text>
      )}
      <Text style={styles.itemCount}>{item.itemCount} itens</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={renderSale}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSales();
            }}
            tintColor={colors.seller.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="Nenhuma venda registrada"
            description="Suas vendas aparecerão aqui"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  saleCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    ...shadow.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleId: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  saleTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.seller.primary,
  },
  saleDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: { fontSize: 12, color: colors.gray[500] },
  customerName: { fontSize: 13, color: colors.gray[600] },
  itemCount: { fontSize: 12, color: colors.gray[400] },
});
