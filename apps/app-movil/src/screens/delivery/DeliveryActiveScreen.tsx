import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  MapPin,
  Phone,
  Navigation,
  Package,
} from 'lucide-react-native';
import { DeliveryStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { deliveryApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryActive'>;

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Aguardando Retirada',
  PICKED_UP: 'Retirado',
  IN_TRANSIT: 'Em Trânsito',
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: colors.delivery.primary,
  PICKED_UP: '#f59e0b',
  IN_TRANSIT: '#3b82f6',
};

export function DeliveryActiveScreen({ navigation }: Props) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await deliveryApi.getActive();
      const data = res.data?.data || res.data;
      setDeliveries(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation]);

  if (loading) return <Loading fullScreen />;

  if (deliveries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Package size={64} color={colors.gray[300]} />
        <Text style={styles.emptyTitle}>Nenhuma entrega ativa</Text>
        <Text style={styles.emptySubtitle}>
          Quando você receber entregas, elas aparecerão aqui.
        </Text>
      </View>
    );
  }

  const renderDelivery = ({ item }: { item: any }) => {
    const address = item.order?.deliveryAddress;
    const customer = item.order?.customer;
    const itemCount = item.order?.items?.length || 0;
    const statusColor = STATUS_COLORS[item.status] || colors.gray[500];

    return (
      <TouchableOpacity
        style={[styles.card, shadow.sm]}
        onPress={() =>
          navigation.navigate('DeliveryDetail', { deliveryId: item.id })
        }
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderIdContainer}>
            <Package size={16} color={colors.delivery.primary} />
            <Text style={styles.orderId}>
              #{item.order?.id?.slice(0, 8)}
            </Text>
          </View>
          <View
            style={[styles.statusChip, { backgroundColor: `${statusColor}18` }]}
          >
            <View
              style={[styles.statusIndicator, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.infoRow}>
          <Phone size={14} color={colors.gray[400]} />
          <Text style={styles.infoText}>
            {customer?.firstName} {customer?.lastName}
            {customer?.phone ? ` • ${customer.phone}` : ''}
          </Text>
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <MapPin size={14} color={colors.gray[400]} />
          <Text style={styles.infoText} numberOfLines={2}>
            {address?.street}, {address?.number}
            {address?.neighborhood ? ` - ${address.neighborhood}` : ''}
            {address?.city ? `, ${address.city}` : ''}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.itemCount}>{itemCount} item(ns)</Text>
          {item.estimatedTime && (
            <Text style={styles.estimatedTime}>
              ~{item.estimatedTime} min
            </Text>
          )}
          <View style={styles.navigateButton}>
            <Navigation size={14} color={colors.white} />
            <Text style={styles.navigateText}>Ver Detalhes</Text>
          </View>
        </View>
      </TouchableOpacity>
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

const styles = StyleSheet.create({
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
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 12,
  },
  itemCount: {
    fontSize: 12,
    color: colors.gray[500],
  },
  estimatedTime: {
    fontSize: 12,
    color: colors.gray[500],
  },
  navigateButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.delivery.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  navigateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
});
