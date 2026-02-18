import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Package,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Star,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DeliveryStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { deliveryApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryHistory'>;

const STATUS_ICONS: Record<string, any> = {
  DELIVERED: CheckCircle2,
  FAILED: XCircle,
  RETURNED: RotateCcw,
};

const STATUS_LABELS: Record<string, string> = {
  DELIVERED: 'Entregue',
  FAILED: 'Falhou',
  RETURNED: 'Devolvido',
};

export function DeliveryHistoryScreen({}: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const STATUS_COLORS: Record<string, string> = {
    DELIVERED: colors.success,
    FAILED: colors.destructive,
    RETURNED: colors.warning,
  };
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await deliveryApi.getHistory();
      const data = res.data?.data || res.data;
      setDeliveries(Array.isArray(data) ? data : []);
    } catch {
      setDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <Loading fullScreen />;

  if (deliveries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Package size={64} color={colors.gray[300]} />
        <Text style={styles.emptyTitle}>Sem histórico</Text>
        <Text style={styles.emptySubtitle}>
          Entregas concluídas aparecerão aqui.
        </Text>
      </View>
    );
  }

  const renderDelivery = ({ item }: { item: any }) => {
    const StatusIcon = STATUS_ICONS[item.status] || Package;
    const statusColor = STATUS_COLORS[item.status] || colors.gray[500];
    const address = item.order?.deliveryAddress;
    const customer = item.order?.customer;
    const itemCount = item.order?.items?.length || 0;

    const deliveredDate = item.deliveredAt
      ? new Date(item.deliveredAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })
        : '';

    return (
      <View style={[styles.card, shadow.sm]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderIdRow}>
            <Package size={14} color={colors.gray[400]} />
            <Text style={styles.orderId}>
              #{item.order?.id?.slice(0, 8)}
            </Text>
          </View>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: `${statusColor}18` },
            ]}
          >
            <StatusIcon size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>

        {/* Customer + Address */}
        <Text style={styles.customerText}>
          {customer?.firstName} {customer?.lastName}
        </Text>
        <Text style={styles.addressText} numberOfLines={1}>
          {address?.street}, {address?.number}
          {address?.neighborhood ? ` - ${address.neighborhood}` : ''}
        </Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Clock size={12} color={colors.gray[400]} />
            <Text style={styles.footerText}>{deliveredDate}</Text>
          </View>
          <Text style={styles.footerText}>{itemCount} item(ns)</Text>
          {item.actualTime && (
            <Text style={styles.footerText}>{item.actualTime} min</Text>
          )}
          {item.rating && (
            <View style={styles.ratingRow}>
              <Star
                size={12}
                color="#f59e0b"
                fill="#f59e0b"
              />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={deliveries}
      renderItem={renderDelivery}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
        />
      }
    />
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.delivery.background,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.delivery.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  addressText: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 14,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
});
