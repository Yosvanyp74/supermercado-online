import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CheckCircle,
  RefreshCw,
  XCircle,
  Package,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { sellerApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'OrderCompletion'>;

interface CompletionSummary {
  orderId: string;
  orderNumber: string;
  totalItems: number;
  pickedItems: number;
  substitutedItems: number;
  notFoundItems: number;
  customerName: string;
  deliveryMethod: string;
}

export function OrderCompletionScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { pickingOrderId } = route.params;
  const [summary, setSummary] = useState<CompletionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const { data } = await sellerApi.getPickingSummary(pickingOrderId);
      // Map the picking order response to the summary format
      const pickedItems = (data.items || []).filter((i: any) => i.isPicked).length;
      const totalItems = data.totalItems || (data.items || []).length;
      setSummary({
        orderId: data.orderId || data.order?.id || '',
        orderNumber: data.order?.orderNumber || '',
        totalItems,
        pickedItems,
        substitutedItems: 0,
        notFoundItems: totalItems - pickedItems,
        customerName: data.order?.customer
          ? `${data.order.customer.firstName} ${data.order.customer.lastName}`
          : 'Cliente',
        deliveryMethod: 'delivery',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao carregar resumo' });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await sellerApi.completePicking(pickingOrderId);
      Toast.show({
        type: 'success',
        text1: 'Separação concluída!',
        text2: 'Pedido pronto para entrega/retirada',
      });
      navigation.navigate('SellerHome');
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao concluir separação' });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.seller.primary} />
      </View>
    );
  }

  if (!summary) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Package size={40} color={colors.seller.primary} />
          </View>
          <Text style={styles.title}>Resumo da Separação</Text>
          <Text style={styles.orderNumber}>
            Pedido #{summary.orderNumber}
          </Text>
          <Text style={styles.customerName}>{summary.customerName}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <Package size={18} color={colors.gray[500]} />
            </View>
            <Text style={styles.statLabel}>Total de Itens</Text>
            <Text style={styles.statValue}>{summary.totalItems}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <CheckCircle size={18} color={colors.primary[500]} />
            </View>
            <Text style={styles.statLabel}>Coletados</Text>
            <Text style={[styles.statValue, { color: colors.primary[600] }]}>
              {summary.pickedItems}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <RefreshCw size={18} color={colors.warning} />
            </View>
            <Text style={styles.statLabel}>Substituídos</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {summary.substitutedItems}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <XCircle size={18} color={colors.destructive} />
            </View>
            <Text style={styles.statLabel}>Não Encontrados</Text>
            <Text style={[styles.statValue, { color: colors.destructive }]}>
              {summary.notFoundItems}
            </Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryCard}>
          <Text style={styles.deliveryLabel}>Método de Entrega</Text>
          <Text style={styles.deliveryValue}>
            {summary.deliveryMethod === 'delivery'
              ? 'Entrega a domicílio'
              : 'Retirada na loja'}
          </Text>
        </View>

        {/* Warning */}
        {summary.notFoundItems > 0 && (
          <View style={styles.warningCard}>
            <XCircle size={20} color={colors.destructive} />
            <Text style={styles.warningText}>
              {summary.notFoundItems} item(ns) não encontrado(s). O
              cliente será notificado.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={completing ? 'Concluindo...' : 'Concluir Separação'}
          onPress={handleComplete}
          disabled={completing}
          loading={completing}
          icon={<CheckCircle size={20} color={colors.white} />}
          style={{ backgroundColor: colors.primary[600] }}
        />
        <Button
          title="Voltar aos Itens"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any, _shadow = shadow) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  content: { padding: 16, gap: 16 },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.seller.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  orderNumber: {
    fontSize: 15,
    color: colors.gray[500],
    marginTop: 4,
  },
  customerName: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    ...shadow.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: { width: 28 },
  statLabel: { flex: 1, fontSize: 14, color: colors.gray[600] },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: 12,
  },
  deliveryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    ...shadow.sm,
  },
  deliveryLabel: { fontSize: 12, color: colors.gray[500] },
  deliveryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 4,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.destructive,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
});
