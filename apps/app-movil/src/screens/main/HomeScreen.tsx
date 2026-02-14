import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search, Bell, Store, Shield, Truck } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { HomeStackParamList } from '@/navigation/types';
import { ProductCard, Loading } from '@/components';
import { useAuthStore, useCartStore } from '@/store';
import { productsApi, categoriesApi } from '@/api';
import { colors, shadow } from '@/theme';
import { getImageUrl } from '@/config/env';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, isSeller, isAdmin, isDelivery } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        categoriesApi.getAll(),
        productsApi.getFeatured(),
      ]);
      setCategories(catRes.data?.slice(0, 8) || []);
      setFeaturedProducts(prodRes.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddToCart = async (product: any) => {
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Olá, {user?.firstName || 'Visitante'} 👋
          </Text>
          <Text style={styles.headerSubtitle}>O que vai querer hoje?</Text>
        </View>
        <View style={styles.headerActions}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => (navigation as any).navigate('Admin')}
            >
              <Shield size={22} color={colors.admin.primary} />
            </TouchableOpacity>
          )}
          {isSeller && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => (navigation as any).navigate('Seller')}
            >
              <Store size={22} color={colors.seller.primary} />
            </TouchableOpacity>
          )}
          {isDelivery && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => (navigation as any).navigate('Delivery')}
            >
              <Truck size={22} color={colors.delivery.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              (navigation as any).navigate('ProfileTab', {
                screen: 'Notifications',
              })
            }
          >
            <Bell size={22} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={[styles.searchBar, shadow.sm]}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.7}
      >
        <Search size={20} color={colors.gray[400]} />
        <Text style={styles.searchPlaceholder}>Buscar produtos...</Text>
      </TouchableOpacity>

      {/* Banner */}
      <View style={[styles.banner, shadow.md]}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Ofertas da Semana</Text>
          <Text style={styles.bannerSubtitle}>Até 40% de desconto</Text>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() =>
              navigation.navigate('ProductList', { title: 'Ofertas' })
            }
          >
            <Text style={styles.bannerButtonText}>Ver ofertas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <TouchableOpacity
            onPress={() =>
              (navigation as any).navigate('CategoriesTab')
            }
          >
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() =>
                navigation.navigate('ProductList', {
                  categoryId: cat.id,
                  title: cat.name,
                })
              }
            >
              <View style={styles.categoryIcon}>
                {cat.imageUrl ? (
                  <Image
                    source={{ uri: getImageUrl(cat.imageUrl)! }}
                    style={styles.categoryImg}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.categoryEmoji}>
                    {cat.icon || '📦'}
                  </Text>
                )}
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Destaques</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ProductList', { title: 'Destaques' })
            }
          >
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featuredProducts}
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
          columnWrapperStyle={styles.productRow}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 16,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: colors.gray[400],
  },
  banner: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    overflow: 'hidden',
    marginBottom: 24,
  },
  bannerContent: {
    padding: 20,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.primary[100],
    marginTop: 4,
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  categoryItem: {
    alignItems: 'center',
    marginLeft: 16,
    width: 72,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  categoryImg: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
  },
  productRow: {
    paddingHorizontal: 12,
    gap: 0,
  },
});
