import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { getImageUrl } from '@/config';
import { shadow, useTheme } from '@/theme';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  rating?: number;
  inStock?: boolean;
  onPress: () => void;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  compact?: boolean;
}

export function ProductCard({
  name,
  price,
  originalPrice,
  image,
  category,
  inStock = true,
  onPress,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  compact = false,
}: ProductCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const imgUrl = typeof image === 'object' && image !== null ? (image as any).url : image;
  const imageSource = imgUrl
    ? { uri: getImageUrl(imgUrl)! }
    : require('@/assets/placeholder.png');

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, shadow.sm]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image source={imageSource} style={styles.compactImage} />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.price}>R$ {price.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, shadow.sm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        {onToggleWishlist && (
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={onToggleWishlist}
          >
            <Heart
              size={20}
              color={isWishlisted ? colors.destructive : colors.gray[400]}
              fill={isWishlisted ? colors.destructive : 'none'}
            />
          </TouchableOpacity>
        )}
        {!inStock && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Esgotado</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        {category && (
          <Text style={styles.category} numberOfLines={1}>
            {category}
          </Text>
        )}
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>R$ {price.toFixed(2)}</Text>
            {originalPrice && originalPrice > price && (
              <Text style={styles.originalPrice}>
                R$ {originalPrice.toFixed(2)}
              </Text>
            )}
          </View>
          {onAddToCart && inStock && (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={onAddToCart}
            >
              <ShoppingCart size={18} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any, _shadow = shadow) => StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    margin: 4,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.destructive,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 6,
    ...shadow.sm,
  },
  outOfStock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    padding: 10,
  },
  category: {
    fontSize: 11,
    color: colors.primary[600],
    fontWeight: '500',
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[600],
  },
  originalPrice: {
    fontSize: 12,
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    padding: 8,
  },
  // Compact
  compactCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
    marginBottom: 4,
  },
});
