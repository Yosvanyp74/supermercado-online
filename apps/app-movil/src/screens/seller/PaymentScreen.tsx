import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CreditCard,
  Banknote,
  Smartphone,
  DollarSign,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { sellerApi } from '@/api';
import { useSellerStore } from '@/store';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'Payment'>;

type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';

export function PaymentScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const paymentMethods: {
    key: PaymentMethod;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'CASH',
      label: 'Dinheiro',
      icon: <Banknote size={24} color={colors.seller.primary} />,
    },
    {
      key: 'CREDIT_CARD',
      label: 'Cartão de Crédito',
      icon: <CreditCard size={24} color={colors.seller.primary} />,
    },
    {
      key: 'DEBIT_CARD',
      label: 'Cartão de Débito',
      icon: <DollarSign size={24} color={colors.seller.primary} />,
    },
    {
      key: 'PIX',
      label: 'PIX',
      icon: <Smartphone size={24} color={colors.seller.primary} />,
    },
  ];
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const { activeItems, customerId, saleTotal, clearSale } = useSellerStore();

  const cashAmount = parseFloat(cashReceived.replace(',', '.')) || 0;
  const change = cashAmount - saleTotal();

  const canFinalize =
    selectedMethod !== null &&
    activeItems.length > 0 &&
    (selectedMethod !== 'CASH' || cashAmount >= saleTotal());

  const handleFinalize = async () => {
    if (!canFinalize || !selectedMethod) return;

    Alert.alert(
      'Finalizar Venda',
      `Total: R$ ${saleTotal().toFixed(2)}\nMétodo: ${paymentMethods.find((m) => m.key === selectedMethod)?.label}${selectedMethod === 'CASH' ? `\nTroco: R$ ${change.toFixed(2)}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              const { data } = await sellerApi.createSale({
                items: activeItems.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.price,
                })),
                paymentMethod: selectedMethod,
                customerId: customerId || undefined,
                paidAmount:
                  selectedMethod === 'CASH' ? cashAmount : undefined,
              });
              clearSale();
              navigation.replace('PaymentSuccess', {
                saleId: data.id,
                total: saleTotal(),
                paymentMethod: selectedMethod,
                change: selectedMethod === 'CASH' ? change : undefined,
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Erro ao finalizar venda',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total da Venda</Text>
          <Text style={styles.totalValue}>R$ {saleTotal().toFixed(2)}</Text>
          <Text style={styles.itemCount}>
            {activeItems.reduce((s, i) => s + i.quantity, 0)} itens
          </Text>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
        <View style={styles.methods}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.methodCard,
                selectedMethod === method.key && styles.methodSelected,
              ]}
              onPress={() => setSelectedMethod(method.key)}
            >
              {method.icon}
              <Text
                style={[
                  styles.methodLabel,
                  selectedMethod === method.key && styles.methodLabelSelected,
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cash Input */}
        {selectedMethod === 'CASH' && (
          <View style={styles.cashSection}>
            <Text style={styles.sectionTitle}>Valor Recebido</Text>
            <View style={styles.cashInput}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.cashTextInput}
                placeholder="0,00"
                value={cashReceived}
                onChangeText={setCashReceived}
                keyboardType="decimal-pad"
                autoFocus
                placeholderTextColor={colors.gray[400]}
              />
            </View>
            {cashAmount > 0 && (
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Troco:</Text>
                <Text
                  style={[
                    styles.changeValue,
                    change < 0 && styles.changeNegative,
                  ]}
                >
                  R$ {Math.max(0, change).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <Button
          title={loading ? 'Processando...' : 'Finalizar Venda'}
          onPress={handleFinalize}
          disabled={!canFinalize || loading}
          style={{ backgroundColor: colors.seller.primary }}
          icon={
            loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : undefined
          }
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any, _shadow = shadow) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, gap: 20 },
  totalCard: {
    backgroundColor: colors.seller.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    marginTop: 4,
  },
  itemCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  methods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadow.sm,
  },
  methodSelected: {
    borderColor: colors.seller.primary,
    backgroundColor: colors.seller.light,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
    textAlign: 'center',
  },
  methodLabelSelected: {
    color: colors.seller.primary,
    fontWeight: '600',
  },
  cashSection: { gap: 12 },
  cashInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[400],
    marginRight: 8,
  },
  cashTextInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: colors.foreground,
    paddingVertical: 16,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    ...shadow.sm,
  },
  changeLabel: { fontSize: 16, color: colors.gray[600] },
  changeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary[600],
  },
  changeNegative: { color: colors.destructive },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
