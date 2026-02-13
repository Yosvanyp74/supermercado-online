import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Play, Trash2, ShoppingCart } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Loading, EmptyState } from '@/components';
import { sellerApi } from '@/api';
import { useSellerStore } from '@/store';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'SuspendedSales'>;

interface SuspendedSale {
  id: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  total: number;
  itemCount: number;
  customerName?: string;
  createdAt: string;
}

export function SuspendedSalesScreen({ navigation }: Props) {
  const [sales, setSales] = useState<SuspendedSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { clearSale, addProduct, setCustomer } = useSellerStore();

  const loadSales = useCallback(async () => {
    try {
      const { data } = await sellerApi.getSuspendedSales();
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

  const handleResume = async (sale: SuspendedSale) => {
    Alert.alert('Retomar Venda', 'Deseja retomar esta venda?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Retomar',
        onPress: async () => {
          try {
            clearSale();
            sale.items.forEach((item: any) => {
              for (let i = 0; i < item.quantity; i++) {
                addProduct({
                  productId: item.productId,
                  name: item.productName || item.name || 'Produto',
                  price: item.unitPrice || item.price || 0,
                  image: item.image,
                });
              }
            });
            await sellerApi.resumeSale(sale.id);
            Toast.show({ type: 'success', text1: 'Venda retomada' });
            navigation.navigate('ActiveSale');
          } catch {
            Toast.show({ type: 'error', text1: 'Erro ao retomar venda' });
          }
        },
      },
    ]);
  };

  const handleDelete = (saleId: string) => {
    Alert.alert('Excluir Venda', 'Deseja excluir esta venda suspensa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await sellerApi.deleteSuspendedSale(saleId);
            setSales((prev) => prev.filter((s) => s.id !== saleId));
            Toast.show({ type: 'success', text1: 'Venda excluída' });
          } catch {
            Toast.show({ type: 'error', text1: 'Erro ao excluir' });
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardId}>
                  #{item.id.slice(-6)}
                </Text>
                <Text style={styles.cardDate}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <Text style={styles.cardTotal}>
                R$ {Number(item.total || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.itemsPreview}>
              <ShoppingCart size={14} color={colors.gray[400]} />
              <Text style={styles.itemsText}>
                {item.items?.length || 0} {(item.items?.length || 0) === 1 ? 'item' : 'itens'}
              </Text>
              {item.customerName && (
                <Text style={styles.customerText}>
                  • {item.customerName}
                </Text>
              )}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.resumeBtn}
                onPress={() => handleResume(item)}
              >
                <Play size={16} color={colors.white} />
                <Text style={styles.resumeText}>Retomar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
              >
                <Trash2 size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Nenhuma venda suspensa"
            description="Vendas suspensas aparecerão aqui"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardId: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  cardDate: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  cardTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.seller.primary,
  },
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsText: { fontSize: 13, color: colors.gray[500] },
  customerText: { fontSize: 13, color: colors.gray[500] },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.seller.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  resumeText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
});
