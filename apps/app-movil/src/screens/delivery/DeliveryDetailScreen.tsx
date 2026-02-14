import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  MapPin,
  Phone,
  User,
  Package,
  CheckCircle2,
  XCircle,
  Navigation,
  Clock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { DeliveryStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { deliveryApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryDetail'>;

const STATUS_FLOW = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Aguardando Retirada',
  PICKED_UP: 'Retirado',
  IN_TRANSIT: 'Em Trânsito',
  DELIVERED: 'Entregue',
  FAILED: 'Falhou',
  RETURNED: 'Devolvido',
};
const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: colors.delivery.primary,
  PICKED_UP: '#f59e0b',
  IN_TRANSIT: '#3b82f6',
  DELIVERED: colors.success,
  FAILED: colors.destructive,
  RETURNED: colors.gray[500],
};

export function DeliveryDetailScreen({ route, navigation }: Props) {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDelivery = async () => {
    try {
      // We need to load from active deliveries or by order
      const res = await deliveryApi.getActive();
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : [];
      const found = list.find((d: any) => d.id === deliveryId);
      if (found) {
        setDelivery(found);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a entrega');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDelivery();
    startLocationUpdates();
    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, []);

  const startLocationUpdates = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    locationInterval.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await deliveryApi
          .updateLocation(deliveryId, {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
          .catch(() => {});
      } catch {
        // ignore
      }
    }, 30000); // Every 30 seconds
  };

  const handleAdvanceStatus = () => {
    if (!delivery) return;
    const currentIdx = STATUS_FLOW.indexOf(delivery.status);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return;

    const nextStatus = STATUS_FLOW[currentIdx + 1];
    const nextLabel = STATUS_LABELS[nextStatus];

    Alert.alert(
      'Atualizar Status',
      `Deseja alterar o status para "${nextLabel}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setUpdating(true);
            try {
              await deliveryApi.updateStatus(deliveryId, {
                status: nextStatus,
              });
              if (nextStatus === 'DELIVERED') {
                Alert.alert('Sucesso', 'Entrega concluída com sucesso!');
                navigation.goBack();
              } else {
                await loadDelivery();
              }
            } catch {
              Alert.alert('Erro', 'Não foi possível atualizar o status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  const handleReportProblem = () => {
    Alert.prompt(
      'Reportar Problema',
      'Descreva o problema com esta entrega:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason?.trim()) return;
            setUpdating(true);
            try {
              await deliveryApi.updateStatus(deliveryId, {
                status: 'FAILED',
              });
              Alert.alert('Reportado', 'O problema foi registrado.');
              navigation.goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível reportar o problema');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const openMaps = () => {
    const address = delivery?.order?.deliveryAddress;
    if (!address) return;

    const lat = address.latitude;
    const lng = address.longitude;

    if (lat && lng) {
      const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lng}`,
        android: `google.navigation:q=${lat},${lng}`,
      });
      if (url) Linking.openURL(url).catch(() => {});
    } else {
      const query = encodeURIComponent(
        `${address.street}, ${address.number}, ${address.city}`,
      );
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
      ).catch(() => {});
    }
  };

  const callCustomer = () => {
    const phone = delivery?.order?.customer?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  if (loading || !delivery) return <Loading fullScreen />;

  const address = delivery.order?.deliveryAddress;
  const customer = delivery.order?.customer;
  const items = delivery.order?.items || [];
  const currentIdx = STATUS_FLOW.indexOf(delivery.status);
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
  const nextLabel =
    currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
      ? STATUS_LABELS[STATUS_FLOW[currentIdx + 1]]
      : '';

  return (
    <ScrollView style={styles.container}>
      {/* Status Timeline */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.cardTitle}>Status da Entrega</Text>
        <View style={styles.timeline}>
          {STATUS_FLOW.map((status, idx) => {
            const isActive = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            const statusColor = isActive
              ? STATUS_COLORS[status] || colors.delivery.primary
              : colors.gray[300];

            return (
              <View key={status} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: statusColor,
                      borderWidth: isCurrent ? 3 : 0,
                      borderColor: isCurrent ? `${statusColor}40` : 'transparent',
                    },
                  ]}
                >
                  {isActive && (
                    <CheckCircle2 size={14} color={colors.white} />
                  )}
                </View>
                {idx < STATUS_FLOW.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: isActive
                          ? statusColor
                          : colors.gray[200],
                      },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.timelineLabel,
                    {
                      color: isActive ? colors.foreground : colors.gray[400],
                      fontWeight: isCurrent ? '700' : '400',
                    },
                  ]}
                >
                  {STATUS_LABELS[status]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Customer Card */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.cardTitle}>Cliente</Text>
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <User size={20} color={colors.delivery.primary} />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {customer?.firstName} {customer?.lastName}
            </Text>
            {customer?.phone && (
              <Text style={styles.customerPhone}>{customer.phone}</Text>
            )}
          </View>
          {customer?.phone && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={callCustomer}
            >
              <Phone size={18} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Address Card */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.cardTitle}>Endereço de Entrega</Text>
        <View style={styles.addressRow}>
          <MapPin size={18} color={colors.delivery.primary} />
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>
              {address?.street}, {address?.number}
            </Text>
            {address?.complement && (
              <Text style={styles.addressComplement}>
                {address.complement}
              </Text>
            )}
            <Text style={styles.addressCity}>
              {address?.neighborhood}
              {address?.city ? ` - ${address.city}` : ''}
              {address?.zipCode ? ` • CEP ${address.zipCode}` : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.navigateMapButton}
          onPress={openMaps}
          activeOpacity={0.7}
        >
          <Navigation size={16} color={colors.white} />
          <Text style={styles.navigateMapText}>Abrir no Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* Order Items */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.cardTitle}>
          Itens do Pedido ({items.length})
        </Text>
        {items.map((item: any, idx: number) => (
          <View
            key={item.id || idx}
            style={[
              styles.itemRow,
              idx < items.length - 1 && styles.itemBorder,
            ]}
          >
            <View style={styles.itemQty}>
              <Text style={styles.itemQtyText}>{item.quantity}x</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item.product?.name || item.productName || 'Produto'}
              </Text>
            </View>
            <Text style={styles.itemPrice}>
              R$ {(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            R${' '}
            {items
              .reduce(
                (sum: number, item: any) =>
                  sum + item.price * item.quantity,
                0,
              )
              .toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Delivery Info */}
      {delivery.estimatedTime && (
        <View style={[styles.card, shadow.sm]}>
          <View style={styles.infoRow}>
            <Clock size={16} color={colors.gray[500]} />
            <Text style={styles.infoLabel}>Tempo estimado:</Text>
            <Text style={styles.infoValue}>
              {delivery.estimatedTime} minutos
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {canAdvance && (
          <TouchableOpacity
            style={[styles.advanceButton, updating && styles.buttonDisabled]}
            onPress={handleAdvanceStatus}
            disabled={updating}
            activeOpacity={0.7}
          >
            <ChevronRight size={20} color={colors.white} />
            <Text style={styles.advanceButtonText}>
              {updating ? 'Atualizando...' : `Marcar como "${nextLabel}"`}
            </Text>
          </TouchableOpacity>
        )}
        {delivery.status !== 'DELIVERED' &&
          delivery.status !== 'FAILED' && (
            <TouchableOpacity
              style={styles.problemButton}
              onPress={handleReportProblem}
              disabled={updating}
              activeOpacity={0.7}
            >
              <AlertTriangle size={18} color={colors.destructive} />
              <Text style={styles.problemButtonText}>
                Reportar Problema
              </Text>
            </TouchableOpacity>
          )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.delivery.background,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
  },
  // Timeline
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-40%',
    height: 3,
    zIndex: -1,
  },
  timelineLabel: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  // Customer
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.delivery.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  customerPhone: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Address
  addressRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  addressComplement: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  addressCity: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  navigateMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.delivery.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    gap: 6,
  },
  navigateMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemQty: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.delivery.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemQtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.delivery.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: colors.foreground,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.delivery.primary,
  },
  // Info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.gray[500],
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  // Actions
  actionsContainer: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.delivery.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  advanceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  problemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.destructive,
    gap: 8,
  },
  problemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.destructive,
  },
});
