import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MapPin, Package, Truck, CheckCircle } from 'lucide-react-native';
import { OrdersStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { ordersApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<OrdersStackParamList, 'TrackOrder'>;

const stages = [
  { key: 'CONFIRMED', label: 'Pedido Confirmado', icon: CheckCircle },
  { key: 'PREPARING', label: 'Em Preparação', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Em Entrega', icon: Truck },
  { key: 'DELIVERED', label: 'Entregue', icon: MapPin },
];

export function TrackOrderScreen({ route }: Props) {
  const { orderId } = route.params;
  const [tracking, setTracking] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracking();
  }, [orderId]);

  const loadTracking = async () => {
    try {
      const [trackRes, orderRes] = await Promise.all([
        ordersApi.getTracking(orderId).catch(() => ({ data: null })),
        ordersApi.getById(orderId),
      ]);
      setTracking(trackRes.data);
      setOrder(orderRes.data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  const currentStageIndex = stages.findIndex(
    (s) => s.key === order?.status,
  );

  return (
    <View style={styles.container}>
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.title}>
          Pedido #{order?.orderNumber || orderId.slice(-6)}
        </Text>

        <View style={styles.timeline}>
          {stages.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const Icon = stage.icon;

            return (
              <View key={stage.key} style={styles.stage}>
                <View style={styles.stageLeft}>
                  <View
                    style={[
                      styles.stageCircle,
                      isCompleted && styles.stageCircleActive,
                      isCurrent && styles.stageCircleCurrent,
                    ]}
                  >
                    <Icon
                      size={16}
                      color={isCompleted ? colors.white : colors.gray[400]}
                    />
                  </View>
                  {index < stages.length - 1 && (
                    <View
                      style={[
                        styles.stageLine,
                        isCompleted && styles.stageLineActive,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stageContent}>
                  <Text
                    style={[
                      styles.stageLabel,
                      isCompleted && styles.stageLabelActive,
                    ]}
                  >
                    {stage.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.stageCurrent}>Status atual</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {tracking?.estimatedDelivery && (
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.sectionTitle}>Previsão de Entrega</Text>
          <Text style={styles.estimate}>
            {new Date(tracking.estimatedDelivery).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50], padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 20,
  },
  timeline: {},
  stage: { flexDirection: 'row', minHeight: 60 },
  stageLeft: { alignItems: 'center', width: 40 },
  stageCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageCircleActive: { backgroundColor: colors.primary[600] },
  stageCircleCurrent: {
    backgroundColor: colors.primary[600],
    borderWidth: 3,
    borderColor: colors.primary[200],
  },
  stageLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 4,
  },
  stageLineActive: { backgroundColor: colors.primary[600] },
  stageContent: { flex: 1, marginLeft: 12, paddingTop: 4 },
  stageLabel: { fontSize: 14, color: colors.gray[400], fontWeight: '500' },
  stageLabelActive: { color: colors.foreground },
  stageCurrent: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  estimate: { fontSize: 15, color: colors.gray[600] },
});
