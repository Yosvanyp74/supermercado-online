import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Badge } from './ui/Badge';
import { shadow, useTheme } from '@/theme';

interface OrderCardProps {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
  onPress: () => void;
}

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'destructive' | 'default' }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'info' },
  PREPARING: { label: 'Preparando', variant: 'info' },
  PICKING: { label: 'Separando', variant: 'info' },
  READY: { label: 'Pronto', variant: 'success' },
  OUT_FOR_DELIVERY: { label: 'Em entrega', variant: 'info' },
  DELIVERED: { label: 'Entregue', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  PROCESSING: { label: 'Processando', variant: 'info' },
  COMPLETED: { label: 'Concluído', variant: 'success' },
  FAILED: { label: 'Falhou', variant: 'destructive' },
  REFUNDED: { label: 'Reembolsado', variant: 'warning' },
};

export function OrderCard({
  orderNumber,
  status,
  total,
  itemCount,
  createdAt,
  onPress,
}: OrderCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const statusInfo = statusMap[status] || { label: status, variant: 'default' as const };
  const date = new Date(createdAt).toLocaleDateString('pt-BR');

  return (
    <TouchableOpacity
      style={[styles.card, shadow.sm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Pedido #{orderNumber}</Text>
        <Badge text={statusInfo.label} variant={statusInfo.variant} />
      </View>
      <View style={styles.details}>
        <Text style={styles.detailText}>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.detailText}>{date}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.total}>R$ {total.toFixed(2)}</Text>
        <ChevronRight size={20} color={colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  dot: {
    marginHorizontal: 6,
    color: colors.gray[300],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 8,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[600],
  },
});
