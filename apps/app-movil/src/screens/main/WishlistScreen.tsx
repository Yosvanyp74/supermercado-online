import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Heart } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { ProfileStackParamList } from '@/navigation/types';
import { ProductCard, Loading, EmptyState, Button } from '@/components';
import { wishlistApi } from '@/api';
import { useCartStore } from '@/store';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Wishlist'>;

export function WishlistScreen({ navigation }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const { data } = await wishlistApi.get();
      setItems(data?.items || data || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await wishlistApi.remove(productId);
      setItems((prev) => prev.filter((i) => (i.product?.id || i.productId) !== productId));
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao remover' });
    }
  };

  if (loading) return <Loading fullScreen />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={48} color={colors.gray[300]} />}
        title="Lista vazia"
        description="Adicione produtos à sua lista de desejos"
        action={
          <Button
            title="Ver Produtos"
            onPress={() => (navigation as any).navigate('HomeTab')}
          />
        }
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={items}
      numColumns={2}
      renderItem={({ item }) => {
        const product = item.product || item;
        return (
          <View style={styles.cardWrapper}>
            <ProductCard
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.images?.[0]?.url || product.mainImageUrl}
              onPress={() =>
                (navigation as any).navigate('HomeTab', {
                  screen: 'ProductDetail',
                  params: { productId: product.id },
                })
              }
              onAddToCart={() => {
                useCartStore.getState().addItem({
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  quantity: 1,
                  image: product.images?.[0]?.url || product.mainImageUrl,
                });
                Toast.show({ type: 'success', text1: 'Adicionado!' });
              }}
              onToggleWishlist={() => handleRemove(product.id)}
              isWishlisted
            />
          </View>
        );
      }}
      keyExtractor={(item) => item.id || item.product?.id}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  list: { padding: 12 },
  cardWrapper: { flex: 1, maxWidth: '50%' },
});
