import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { getImageUrl } from '@/config';
import { colors } from '@/theme';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxStock?: number;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemCard({
  name,
  price,
  quantity,
  image,
  maxStock,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const imgUri = getImageUrl(image);
  const imageSource = imgUri
    ? { uri: imgUri }
    : require('@/assets/placeholder.png');

  return (
    <View style={styles.container}>
      <Image source={imageSource} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.price}>R$ {(price * quantity).toFixed(2)}</Text>
        <Text style={styles.unitPrice}>
          R$ {price.toFixed(2)} / un.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Trash2 size={16} color={colors.destructive} />
        </TouchableOpacity>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(quantity - 1)}
          >
            <Minus size={16} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              maxStock && quantity >= maxStock ? styles.quantityDisabled : undefined,
            ]}
            onPress={() =>
              (!maxStock || quantity < maxStock) && onUpdateQuantity(quantity + 1)
            }
          >
            <Plus size={16} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[600],
  },
  unitPrice: {
    fontSize: 12,
    color: colors.gray[400],
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  quantityButton: {
    padding: 8,
  },
  quantityDisabled: {
    opacity: 0.3,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
    minWidth: 28,
    textAlign: 'center',
  },
});
