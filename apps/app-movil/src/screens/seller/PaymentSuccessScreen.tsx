import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle } from 'lucide-react-native';
import { SellerStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { useTheme } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'PaymentSuccess'>;

const methodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
};

export function PaymentSuccessScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { saleId, total, paymentMethod, change } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <CheckCircle size={80} color={colors.primary[500]} />
      </View>

      <Text style={styles.title}>Venda Concluída!</Text>
      <Text style={styles.saleId}>#{saleId}</Text>

      <View style={styles.detailsCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.value}>R$ {Number(total || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Pagamento</Text>
          <Text style={styles.value}>
            {methodLabels[paymentMethod] || paymentMethod}
          </Text>
        </View>
        {change !== undefined && change > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Troco</Text>
              <Text style={[styles.value, styles.changeValue]}>
                R$ {Number(change || 0).toFixed(2)}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title="Nova Venda"
          onPress={() => navigation.navigate('ProductScanner')}
          style={{ backgroundColor: colors.seller.primary }}
        />
        <Button
          title="Voltar ao Início"
          onPress={() => navigation.navigate('SellerHome')}
          variant="outline"
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 4,
  },
  saleId: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 14, color: colors.gray[500] },
  value: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  changeValue: { color: colors.primary[600] },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
});
