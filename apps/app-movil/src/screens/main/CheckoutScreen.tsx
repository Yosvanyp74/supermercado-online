import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  MapPin,
  Truck,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { CartStackParamList } from '@/navigation/types';
import { Button, Input } from '@/components';
import { useAuthStore, useCartStore } from '@/store';
import { ordersApi, usersApi, couponsApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<CartStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { items, subtotal, total, couponCode, couponDiscount, applyCoupon, clearCart } =
    useCartStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [couponInput, setCouponInput] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const loadAddresses = useCallback(() => {
    if (user?.id) {
      usersApi.getAddresses(user.id).then((res) => {
        setAddresses(res.data || []);
        const defaultAddr = res.data?.find((a: any) => a.isDefault);
        if (defaultAddr && !selectedAddress) setSelectedAddress(defaultAddr.id);
      });
    }
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );

  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const { data } = await couponsApi.validate(couponInput.trim());
      applyCoupon(couponInput.trim(), data.discount || 0);
      Toast.show({ type: 'success', text1: 'Cupom aplicado!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Cupom inválido' });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (deliveryMethod === 'delivery' && !selectedAddress) {
      Toast.show({ type: 'error', text1: 'Selecione um endereço de entrega' });
      return;
    }

    Alert.alert(
      'Confirmar Pedido',
      `Total: R$ ${total().toFixed(2)}\nDeseja confirmar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              const orderItems = items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              }));
              await ordersApi.create({
                items: orderItems,
                fulfillmentType: deliveryMethod === 'delivery' ? 'DELIVERY' : 'PICKUP',
                deliveryAddressId: deliveryMethod === 'delivery' ? (selectedAddress || undefined) : undefined,
                couponCode: couponCode || undefined,
                notes: notes || undefined,
              });
              clearCart();
              Toast.show({
                type: 'success',
                text1: 'Pedido realizado!',
                text2: 'Acompanhe em Meus Pedidos',
              });
              (navigation as any).navigate('OrdersTab');
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Erro ao criar pedido',
                text2: err?.response?.data?.message || 'Tente novamente',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const deliveryFee = deliveryMethod === 'delivery' ? 5.99 : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Delivery Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Entrega</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.option,
                deliveryMethod === 'delivery' && styles.optionActive,
              ]}
              onPress={() => setDeliveryMethod('delivery')}
            >
              <Truck
                size={20}
                color={
                  deliveryMethod === 'delivery'
                    ? colors.primary[600]
                    : colors.gray[400]
                }
              />
              <Text
                style={[
                  styles.optionText,
                  deliveryMethod === 'delivery' && styles.optionTextActive,
                ]}
              >
                Entrega
              </Text>
              <Text style={styles.optionPrice}>R$ 5,99</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.option,
                deliveryMethod === 'pickup' && styles.optionActive,
              ]}
              onPress={() => setDeliveryMethod('pickup')}
            >
              <MapPin
                size={20}
                color={
                  deliveryMethod === 'pickup'
                    ? colors.primary[600]
                    : colors.gray[400]
                }
              />
              <Text
                style={[
                  styles.optionText,
                  deliveryMethod === 'pickup' && styles.optionTextActive,
                ]}
              >
                Retirada
              </Text>
              <Text style={styles.optionPrice}>Grátis</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address */}
        {deliveryMethod === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço</Text>
            {addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressItem,
                  selectedAddress === addr.id && styles.addressActive,
                ]}
                onPress={() => setSelectedAddress(addr.id)}
              >
                <MapPin
                  size={18}
                  color={
                    selectedAddress === addr.id
                      ? colors.primary[600]
                      : colors.gray[400]
                  }
                />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>
                    {addr.label || 'Endereço'}
                  </Text>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {addr.street}, {addr.number}
                    {addr.complement ? ` - ${addr.complement}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() =>
                (navigation as any).navigate('ProfileTab', {
                  screen: 'AddAddress',
                  params: {},
                })
              }
            >
              <Plus size={18} color={colors.primary[600]} />
              <Text style={styles.addAddressText}>Adicionar Endereço</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagamento</Text>
          {[
            {
              key: 'credit_card',
              label: 'Cartão de Crédito',
              icon: CreditCard,
            },
            { key: 'debit_card', label: 'Cartão de Débito', icon: CreditCard },
            { key: 'pix', label: 'PIX', icon: Smartphone },
            { key: 'cash', label: 'Dinheiro', icon: Banknote },
          ].map((method) => (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.paymentOption,
                paymentMethod === method.key && styles.paymentActive,
              ]}
              onPress={() => setPaymentMethod(method.key)}
            >
              <method.icon
                size={20}
                color={
                  paymentMethod === method.key
                    ? colors.primary[600]
                    : colors.gray[400]
                }
              />
              <Text
                style={[
                  styles.paymentText,
                  paymentMethod === method.key && styles.paymentTextActive,
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cupom de Desconto</Text>
          <View style={styles.couponRow}>
            <Input
              placeholder="Digite o código"
              value={couponInput}
              onChangeText={setCouponInput}
              containerStyle={styles.couponInput}
              icon={<Tag size={18} color={colors.gray[400]} />}
            />
            <Button
              title="Aplicar"
              onPress={handleValidateCoupon}
              loading={validatingCoupon}
              variant="outline"
              size="sm"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Input
            label="Observações (opcional)"
            placeholder="Ex: Sem sacolas plásticas"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Total */}
      <View style={[styles.summary, shadow.lg]}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Subtotal ({items.length} itens)
          </Text>
          <Text style={styles.summaryValue}>R$ {subtotal().toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Entrega</Text>
          <Text style={styles.summaryValue}>
            {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'}
          </Text>
        </View>
        {couponCode && (
          <View style={styles.summaryRow}>
            <Text style={styles.couponLabel}>Desconto</Text>
            <Text style={styles.couponValue}>
              -R$ {couponDiscount.toFixed(2)}
            </Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            R$ {(total() + deliveryFee).toFixed(2)}
          </Text>
        </View>
        <Button
          title="Confirmar Pedido"
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { paddingBottom: 220 },
  section: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  optionRow: { flexDirection: 'row', gap: 12 },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  optionActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  optionText: { fontSize: 14, fontWeight: '500', color: colors.gray[600] },
  optionTextActive: { color: colors.primary[600] },
  optionPrice: { fontSize: 12, color: colors.gray[400] },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  addressActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  addressText: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  paymentActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  paymentText: { fontSize: 14, color: colors.gray[600] },
  paymentTextActive: { color: colors.primary[600], fontWeight: '500' },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  couponInput: { flex: 1, marginBottom: 0 },
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
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 14, color: colors.gray[500] },
  summaryValue: { fontSize: 14, fontWeight: '500', color: colors.gray[700] },
  couponLabel: { fontSize: 14, color: colors.primary[600] },
  couponValue: { fontSize: 14, fontWeight: '500', color: colors.primary[600] },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary[600] },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary[600],
    borderRadius: 10,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 4,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[600],
  },
});
