import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { HomeStackParamList } from '@/navigation/types';
import { ProductCard, Loading, EmptyState } from '@/components';
import { productsApi, categoriesApi } from '@/api';
import { useCartStore } from '@/store';
import { colors } from '@/theme';
import { ShoppingBag } from 'lucide-react-native';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductList'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ProductListScreen({ route, navigation }: Props) {
  const { categoryId, search } = route.params || {};
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadProducts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        let res;
        if (categoryId) {
          res = await categoriesApi.getProducts(categoryId, {
            page: pageNum,
            limit: 20,
          });
        } else {
          res = await productsApi.getAll({
            page: pageNum,
            limit: 20,
            search: search,
          });
        }
        const items = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setProducts((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length === 20);
        setPage(pageNum);
      } catch {
        Toast.show({ type: 'error', text1: 'Erro ao carregar produtos' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [categoryId, search],
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadProducts(page + 1, true);
    }
  };

  const handleAddToCart = (product: any) => {
    const imgUrl = product.images?.[0]?.url || product.mainImageUrl;
    useCartStore.getState().addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: imgUrl,
    });
    Toast.show({ type: 'success', text1: 'Adicionado ao carrinho!' });
  };

  if (loading) return <Loading fullScreen />;

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={48} color={colors.gray[300]} />}
        title="Nenhum produto encontrado"
        description="Tente buscar por outra categoria ou termo"
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={products}
      renderItem={({ item }) => (
        <View style={{ width: (SCREEN_WIDTH - 48) / 2 }}>
          <ProductCard
            id={item.id}
            name={item.name}
            price={item.price}
            originalPrice={item.originalPrice}
            image={item.images?.[0]?.url || item.mainImageUrl}
            category={item.category?.name}
            inStock={item.stock > 0}
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: item.id })
            }
            onAddToCart={() => handleAddToCart(item)}
          />
        </View>
      )}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  list: {
    paddingBottom: 16,
  },
  row: {
    paddingHorizontal: 12,
  },
});
