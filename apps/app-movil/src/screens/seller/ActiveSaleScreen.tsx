import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Plus,
  Minus,
  Trash2,
  Scan,
  UserSearch,
  Pause,
  CreditCard,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { useSellerStore } from '@/store';
import { sellerApi } from '@/api';
import { getImageUrl } from '@/config';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'ActiveSale'>;

export function ActiveSaleScreen({ navigation }: Props) {
  const {
    activeItems,
    customerId,
    saleTotal,
    saleItemCount,
    updateItemQuantity,
    removeProduct,
    clearSale,
  } = useSellerStore();

  const handleSuspend = async () => {
    if (activeItems.length === 0) return;
    Alert.alert('Suspender Venda', 'Deseja suspender a venda atual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Suspender',
        onPress: async () => {
          try {
            // Create sale first, then suspend it
            const { data: sale } = await sellerApi.createSale({
              items: activeItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.price,
              })),
              paymentMethod: 'CASH',
              customerId: customerId || undefined,
            });
            await sellerApi.suspendSale(sale.id);
            clearSale();
            Toast.show({ type: 'success', text1: 'Venda suspensa' });
            navigation.goBack();
          } catch {
            Toast.show({ type: 'error', text1: 'Erro ao suspender venda' });
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: (typeof activeItems)[0] }) => {
    const imageUri = getImageUrl(item.image);

    return (
      <View style={styles.itemCard}>
        {item.image ? (
          <Image source={{ uri: imageUri! }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>
            R$ {item.price.toFixed(2)}
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              item.quantity <= 1
                ? removeProduct(item.productId)
                : updateItemQuantity(item.productId, item.quantity - 1)
            }
          >
            {item.quantity <= 1 ? (
              <Trash2 size={14} color={colors.destructive} />
            ) : (
              <Minus size={14} color={colors.seller.primary} />
            )}
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              updateItemQuantity(item.productId, item.quantity + 1)
            }
          >
            <Plus size={14} color={colors.seller.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemTotal}>
          R$ {(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Actions Bar */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ProductScanner')}
        >
          <Scan size={20} color={colors.seller.primary} />
          <Text style={styles.actionText}>Escanear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('CustomerSearch')}
        >
          <UserSearch size={20} color={colors.seller.primary} />
          <Text style={styles.actionText}>Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSuspend}>
          <Pause size={20} color={colors.warning} />
          <Text style={styles.actionText}>Suspender</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={activeItems}
        keyExtractor={(item) => item.productId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Scan size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhum produto adicionado</Text>
            <Text style={styles.emptySubtext}>
              Escaneie ou busque um produto
            </Text>
          </View>
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total ({saleItemCount()} {saleItemCount() === 1 ? 'item' : 'itens'})
          </Text>
          <Text style={styles.totalValue}>R$ {saleTotal().toFixed(2)}</Text>
        </View>
        <Button
          title="Pagamento"
          onPress={() => navigation.navigate('Payment')}
          disabled={activeItems.length === 0}
          icon={<CreditCard size={20} color={colors.white} />}
          style={{ backgroundColor: colors.seller.primary }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  actionsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
  },
  actionText: { fontSize: 11, color: colors.gray[600], fontWeight: '500' },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    ...shadow.sm,
  },
  itemImage: { width: 44, height: 44, borderRadius: 8 },
  placeholder: {
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 16, fontWeight: '600', color: colors.gray[400] },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500', color: colors.foreground },
  itemPrice: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    minWidth: 70,
    textAlign: 'right',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.gray[400] },
  emptySubtext: { fontSize: 13, color: colors.gray[400] },
  footer: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, color: colors.gray[600] },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.foreground },
});
