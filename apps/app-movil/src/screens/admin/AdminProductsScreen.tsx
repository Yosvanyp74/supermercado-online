import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus, Search, Edit, Trash2 } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { getImageUrl } from '@/config';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminProducts'>;

export function AdminProductsScreen({ navigation }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async (pageNum = 1, searchText = search) => {
    try {
      const { data } = await adminApi.getProducts({
        page: pageNum,
        limit: 20,
        search: searchText || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      const items = data.data || data.items || data;
      if (pageNum === 1) {
        setProducts(Array.isArray(items) ? items : []);
      } else {
        setProducts((prev) => [...prev, ...(Array.isArray(items) ? items : [])]);
      }
      setHasMore(Array.isArray(items) && items.length >= 20);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    loadProducts(1);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadProducts(1));
    return unsub;
  }, [navigation]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    loadProducts(1, search);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Excluir produto', `Tem certeza que deseja excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o produto');
          }
        },
      },
    ]);
  };

  const renderProduct = ({ item }: { item: any }) => {
    const imgUri = getImageUrl(item.images?.[0]?.url || item.mainImageUrl);
    return (
      <TouchableOpacity
        style={[styles.productCard, shadow.sm]}
        onPress={() => navigation.navigate('AdminProductForm', { productId: item.id })}
        activeOpacity={0.7}
      >
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productPrice}>R$ {Number(item.price || 0).toFixed(2)}</Text>
          <View style={styles.productMeta}>
            <View style={[styles.statusBadge, {
              backgroundColor: item.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
            }]}>
              <Text style={[styles.statusText, {
                color: item.status === 'ACTIVE' ? '#16a34a' : '#ef4444',
              }]}>
                {item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
            <Text style={styles.stockText}>Estoque: {item.stock ?? 0}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminProductForm', { productId: item.id })}
            style={styles.actionBtn}
          >
            <Edit size={18} color={colors.admin.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, item.name)}
            style={styles.actionBtn}
          >
            <Trash2 size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AdminProductForm', {})}
        >
          <Plus size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProducts(1);
            }}
          />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadProducts(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  searchRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.foreground,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.admin.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[400],
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.admin.primary,
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockText: {
    fontSize: 11,
    color: colors.gray[400],
  },
  actions: {
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[400],
  },
});
