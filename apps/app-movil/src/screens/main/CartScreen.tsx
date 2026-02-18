import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShoppingCart } from 'lucide-react-native';
import { CartStackParamList } from '@/navigation/types';
import { CartItemCard, Button, EmptyState } from '@/components';
import { useCartStore } from '@/store';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<CartStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { items, subtotal, total, couponCode, couponDiscount, updateQuantity, removeItem } =
    useCartStore();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart size={48} color={colors.gray[300]} />}
        title="Seu carrinho está vazio"
        description="Adicione produtos para começar"
        action={
          <Button
            title="Ver Produtos"
            onPress={() => (navigation as any).navigate('HomeTab')}
            variant="primary"
          />
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <CartItemCard
            id={item.id}
            name={item.name}
            price={item.price}
            quantity={item.quantity}
            image={item.image}
            maxStock={item.maxStock}
            onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <View style={[styles.summary, shadow.lg]}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>R$ {subtotal().toFixed(2)}</Text>
        </View>
        {couponCode && (
          <View style={styles.summaryRow}>
            <Text style={styles.couponLabel}>Cupom ({couponCode})</Text>
            <Text style={styles.couponValue}>
              -R$ {couponDiscount.toFixed(2)}
            </Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {total().toFixed(2)}</Text>
        </View>
        <Button
          title="Finalizar Pedido"
          onPress={() => navigation.navigate('Checkout')}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  list: {
    padding: 16,
    paddingBottom: 240,
  },
  summary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  couponLabel: {
    fontSize: 14,
    color: colors.primary[600],
  },
  couponValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[600],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[600],
  },
});
