import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { getImageUrl } from '@/config';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Star,
  Share2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { HomeStackParamList } from '@/navigation/types';
import { Button, Badge, Loading } from '@/components';
import { productsApi, wishlistApi, reviewsApi } from '@/api';
import { useCartStore } from '@/store';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductDetail'>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const [prodRes, revRes] = await Promise.all([
        productsApi.getById(productId),
        reviewsApi.getByProduct(productId).catch(() => ({ data: [] })),
      ]);
      setProduct(prodRes.data);
      setReviews(revRes.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao carregar produto' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const imgUrl = product.images?.[0]?.url || product.images?.[0];
    useCartStore.getState().addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: imgUrl,
      maxStock: product.stock,
    });
    Toast.show({ type: 'success', text1: 'Adicionado ao carrinho!' });
  };

  const toggleWishlist = async () => {
    try {
      if (isWishlisted) {
        await wishlistApi.remove(productId);
      } else {
        await wishlistApi.add(productId);
      }
      setIsWishlisted(!isWishlisted);
    } catch {
      // Ignore
    }
  };

  if (loading || !product) return <Loading fullScreen />;

  const imageUrls: (string | null)[] = product.images?.length
    ? product.images.map((img: any) => (typeof img === 'object' ? img.url : img))
    : [null];
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((s: number, r: any) => s + r.rating, 0) /
          reviews.length
        ).toFixed(1)
      : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            );
            setActiveImage(idx);
          }}
        >
          {imageUrls.map((img: string | null, index: number) => (
            <Image
              key={index}
              source={
                img
                  ? { uri: getImageUrl(img)! }
                  : require('@/assets/placeholder.png')
              }
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {imageUrls.length > 1 && (
          <View style={styles.dots}>
            {imageUrls.map((_: any, i: number) => (
              <View
                key={i}
                style={[styles.dot, activeImage === i && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.row}>
            {product.category && (
              <Badge text={product.category.name} variant="default" />
            )}
            {discount > 0 && (
              <Badge text={`-${discount}%`} variant="destructive" />
            )}
          </View>

          <Text style={styles.name}>{product.name}</Text>

          {avgRating && (
            <View style={styles.ratingRow}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{avgRating}</Text>
              <Text style={styles.reviewCount}>
                ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
              </Text>
            </View>
          )}

          <View style={styles.priceSection}>
            <Text style={styles.price}>R$ {product.price.toFixed(2)}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                R$ {product.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>

          <Text style={styles.stock}>
            {product.stock > 0
              ? `${product.stock} em estoque`
              : 'Produto esgotado'}
          </Text>

          {product.description && (
            <View style={styles.descSection}>
              <Text style={styles.descTitle}>Descrição</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.descTitle}>
                Avaliações ({reviews.length})
              </Text>
              {reviews.slice(0, 3).map((review: any) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.user?.firstName || 'Anônimo'}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          color="#f59e0b"
                          fill={i < review.rating ? '#f59e0b' : 'none'}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      {product.stock > 0 && (
        <View style={[styles.bottomBar, shadow.lg]}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus size={18} color={colors.gray[600]} />
            </TouchableOpacity>
            <Text style={styles.qty}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() =>
                setQuantity(Math.min(product.stock, quantity + 1))
              }
            >
              <Plus size={18} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.wishBtn} onPress={toggleWishlist}>
            <Heart
              size={22}
              color={isWishlisted ? colors.destructive : colors.gray[400]}
              fill={isWishlisted ? colors.destructive : 'none'}
            />
          </TouchableOpacity>

          <Button
            title={`Adicionar • R$ ${(product.price * quantity).toFixed(2)}`}
            onPress={handleAddToCart}
            icon={<ShoppingCart size={18} color={colors.white} />}
            style={styles.addButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -20,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.primary[600],
    width: 20,
  },
  info: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  reviewCount: {
    fontSize: 13,
    color: colors.gray[400],
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary[600],
  },
  originalPrice: {
    fontSize: 16,
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  stock: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 16,
  },
  descSection: {
    marginTop: 8,
  },
  descTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 22,
  },
  reviewsSection: {
    marginTop: 24,
  },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingVertical: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  qtyBtn: {
    padding: 10,
  },
  qty: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'center',
  },
  wishBtn: {
    padding: 10,
  },
  addButton: {
    flex: 1,
  },
});
