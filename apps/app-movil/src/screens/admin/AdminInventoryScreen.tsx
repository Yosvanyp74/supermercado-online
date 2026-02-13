import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search, AlertTriangle, Package, ArrowUpDown } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminInventory'>;

export function AdminInventoryScreen({ navigation }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInventory = useCallback(async (pageNum = 1, searchText = search, lowStock = lowStockOnly) => {
    try {
      const { data } = await adminApi.getInventory({
        page: pageNum,
        limit: 20,
        search: searchText || undefined,
        lowStock: lowStock || undefined,
      });
      const list = data.data || data.items || data;
      if (pageNum === 1) {
        setItems(Array.isArray(list) ? list : []);
      } else {
        setItems((prev) => [...prev, ...(Array.isArray(list) ? list : [])]);
      }
      setHasMore(Array.isArray(list) && list.length >= 20);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, lowStockOnly]);

  useEffect(() => { loadInventory(1); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadInventory(1));
    return unsub;
  }, [navigation]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    loadInventory(1, search, lowStockOnly);
  };

  const handleLowStockToggle = (v: boolean) => {
    setLowStockOnly(v);
    setPage(1);
    setLoading(true);
    loadInventory(1, search, v);
  };

  const renderItem = ({ item }: { item: any }) => {
    const product = item.product || item;
    const stock = item.stock ?? product.stock ?? 0;
    const minStock = item.minStock ?? product.minStock ?? 5;
    const isLow = stock <= minStock;

    return (
      <TouchableOpacity
        style={[styles.card, shadow.sm]}
        onPress={() =>
          navigation.navigate('AdminInventoryAdjust', {
            productId: product.id || item.productId,
            productName: product.name || 'Produto',
            currentStock: stock,
          })
        }
        activeOpacity={0.7}
      >
        <View style={[styles.stockIndicator, { backgroundColor: isLow ? '#fef3c7' : '#dcfce7' }]}>
          {isLow ? (
            <AlertTriangle size={20} color="#f59e0b" />
          ) : (
            <Package size={20} color="#16a34a" />
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{product.name || 'Produto'}</Text>
          <Text style={styles.itemSku}>{product.sku || product.barcode || ''}</Text>
        </View>
        <View style={styles.stockInfo}>
          <Text style={[styles.stockValue, isLow && styles.stockLow]}>{stock}</Text>
          <Text style={styles.stockLabel}>
            {isLow ? 'BAIXO' : 'OK'}
          </Text>
        </View>
        <ArrowUpDown size={16} color={colors.gray[300]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Apenas estoque baixo</Text>
        <Switch
          value={lowStockOnly}
          onValueChange={handleLowStockToggle}
          trackColor={{ true: colors.admin.primary }}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id || item.productId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInventory(1); }} />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadInventory(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum item de estoque encontrado</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  searchRow: { padding: 12, paddingBottom: 0 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.foreground },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterLabel: { fontSize: 14, color: colors.gray[600] },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  stockIndicator: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  itemSku: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  stockInfo: { alignItems: 'center', marginRight: 8 },
  stockValue: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  stockLow: { color: '#f59e0b' },
  stockLabel: { fontSize: 10, fontWeight: '600', color: colors.gray[400] },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray[400] },
});
