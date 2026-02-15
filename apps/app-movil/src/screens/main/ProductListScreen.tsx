import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  ScrollView,
  TouchableOpacity,
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
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(categoryId);
  const [parentCategoryName, setParentCategoryName] = useState<string | undefined>();

  // Load subcategories for the current category
  useEffect(() => {
    if (!categoryId) return;
    categoriesApi.getById(categoryId).then(({ data }) => {
      if (data?.children?.length > 0) {
        setSubcategories(data.children);
        setParentCategoryName(data.name);
      } else if (data?.parent) {
        // We're on a subcategory — load siblings from parent
        categoriesApi.getById(data.parent.id).then(({ data: parentData }) => {
          setSubcategories(parentData?.children || []);
          setParentCategoryName(parentData?.name);
        });
      }
    }).catch(() => {});
  }, [categoryId]);

  const loadProducts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        let res;
        if (activeCategoryId) {
          res = await categoriesApi.getProducts(activeCategoryId, {
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
    [activeCategoryId, search],
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

  const handleSubcategoryPress = (subId: string) => {
    setActiveCategoryId(subId === activeCategoryId ? categoryId : subId);
    setLoading(true);
    setProducts([]);
  };

  return (
    <FlatList
      style={styles.container}
      data={products}
      ListHeaderComponent={
        subcategories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsContainer}
            contentContainerStyle={styles.chipsContent}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                activeCategoryId === categoryId && styles.chipActive,
              ]}
              onPress={() => {
                setActiveCategoryId(categoryId);
                setLoading(true);
                setProducts([]);
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  activeCategoryId === categoryId && styles.chipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {subcategories.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.chip,
                  activeCategoryId === sub.id && styles.chipActive,
                ]}
                onPress={() => handleSubcategoryPress(sub.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeCategoryId === sub.id && styles.chipTextActive,
                  ]}
                >
                  {sub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null
      }
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
  chipsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  chipsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    paddingBottom: 16,
  },
  row: {
    paddingHorizontal: 12,
  },
});
