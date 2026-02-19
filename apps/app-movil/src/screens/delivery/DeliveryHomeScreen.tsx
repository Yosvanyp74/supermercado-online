import React, { useEffect, useState, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { useSocket } from '@/components/SocketProvider';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Package,
  MapPin,
  Clock,
  History,
  User,
  ArrowLeftCircle,
  CheckCircle2,
  TrendingUp,
  Truck,
  ClipboardList,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DeliveryStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { deliveryApi } from '@/api';
import { useAuthStore } from '@/store';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryHome'>;

export function DeliveryHomeScreen({ navigation }: Props) {
  const isMounted = useRef(true);
  const socket = useSocket();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const rootNavigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showToast = false) => {
    try {
      const [activeRes, availableRes] = await Promise.all([
        deliveryApi.getActive().catch(() => ({ data: [] })),
        deliveryApi.getAvailable().catch(() => ({ data: [] })),
      ]);
      const activeData = activeRes.data?.data || activeRes.data;
      setActiveDeliveries(Array.isArray(activeData) ? activeData : []);
      const availableData = Array.isArray(availableRes.data) ? availableRes.data : [];
      setAvailableCount(availableData.length);
      if (showToast) {
        Toast.show({
          type: 'info',
          text1: `Pedidos disponíveis: ${availableData.length}`,
          text2: 'Lista atualizada após evento socket',
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    isMounted.current = true;
    loadData();
    return () => { isMounted.current = false; };
  }, []);

  // WebSocket: refrescar datos en tiempo real
  useEffect(() => {
    if (!socket) return;
    const handleOrderReady = (payload: any) => {
      console.log('Socket event recebido (delivery):', payload);
      loadData(true);
    };
    const handleOrderAccepted = (payload: any) => {
      console.log('Socket event recebido (delivery accepted):', payload);
      loadData(true);
    };
    socket.on('orderReadyForPickup', handleOrderReady);
    socket.on('deliveryAssigned', handleOrderAccepted);
    return () => {
      socket.off('orderReadyForPickup', handleOrderReady);
      socket.off('deliveryAssigned', handleOrderAccepted);
    };
  }, [socket]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadData();
    });
    return unsub;
  }, [navigation]);

  const handleExitDeliveryMode = () => {
    rootNavigation.navigate('Main');
  };

  const assignedCount = activeDeliveries.filter(
    (d) => d.status === 'ASSIGNED',
  ).length;
  const inTransitCount = activeDeliveries.filter(
    (d) => d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT',
  ).length;

  const menuItems = [
    {
      icon: ClipboardList,
      label: 'Pedidos Disponíveis',
      subtitle: 'Aceitar entregas',
      color: '#15803d',
      bg: '#f0fdf4',
      onPress: () => navigation.navigate('DeliveryAvailableOrders'),
      badge: availableCount > 0 ? availableCount : undefined,
    },
    {
      icon: Package,
      label: 'Entregas Ativas',
      subtitle: `${activeDeliveries.length} entrega(s)`,
      color: colors.delivery.primary,
      bg: colors.delivery.light,
      onPress: () => navigation.navigate('DeliveryActive'),
      badge: activeDeliveries.length > 0 ? activeDeliveries.length : undefined,
    },
    {
      icon: History,
      label: 'Histórico',
      subtitle: 'Entregas concluídas',
      color: colors.gray[600],
      bg: colors.gray[100],
      onPress: () => navigation.navigate('DeliveryHistory'),
    },
    {
      icon: User,
      label: 'Meu Perfil',
      subtitle: 'Dados e avaliação',
      color: '#3b82f6',
      bg: '#dbeafe',
      onPress: () => navigation.navigate('DeliveryProfile'),
    },
  ];

  if (loading) return <Loading fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
        />
      }
    >
      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIcon}>
          <Truck size={32} color={colors.delivery.primary} />
        </View>
        <Text style={styles.welcomeText}>
          Olá, {user?.firstName || 'Entregador'}!
        </Text>
        <Text style={styles.welcomeSubtext}>
          Gerencie suas entregas por aqui.
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, shadow.sm]}>
          <MapPin size={20} color={colors.delivery.primary} />
          <Text style={styles.statValue}>{assignedCount}</Text>
          <Text style={styles.statLabel}>A Retirar</Text>
        </View>
        <View style={[styles.statCard, shadow.sm]}>
          <TrendingUp size={20} color="#3b82f6" />
          <Text style={styles.statValue}>{inTransitCount}</Text>
          <Text style={styles.statLabel}>Em Trânsito</Text>
        </View>
        <View style={[styles.statCard, shadow.sm]}>
          <CheckCircle2 size={20} color={colors.success} />
          <Text style={styles.statValue}>{activeDeliveries.length}</Text>
          <Text style={styles.statLabel}>Total Ativas</Text>
        </View>
      </View>

      {/* Exit button */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={handleExitDeliveryMode}
        activeOpacity={0.7}
      >
        <ArrowLeftCircle size={20} color={colors.delivery.primary} />
        <Text style={styles.exitButtonText}>Voltar ao modo cliente</Text>
      </TouchableOpacity>

      {/* Quick access: active deliveries */}
      {activeDeliveries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entregas Pendentes</Text>
          {activeDeliveries.slice(0, 3).map((delivery) => (
            <TouchableOpacity
              key={delivery.id}
              style={[styles.deliveryCard, shadow.sm]}
              onPress={() =>
                navigation.navigate('DeliveryDetail', { deliveryId: delivery.id })
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      delivery.status === 'IN_TRANSIT'
                        ? '#3b82f6'
                        : delivery.status === 'PICKED_UP'
                          ? '#f59e0b'
                          : colors.delivery.primary,
                  },
                ]}
              />
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryOrder}>
                  Pedido #{delivery.order?.id?.slice(0, 8)}
                </Text>
                <Text style={styles.deliveryAddress} numberOfLines={1}>
                  {delivery.order?.deliveryAddress?.street},{' '}
                  {delivery.order?.deliveryAddress?.number}
                </Text>
                <Text style={styles.deliveryCustomer}>
                  {delivery.order?.customer?.firstName}{' '}
                  {delivery.order?.customer?.lastName}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {delivery.status === 'ASSIGNED'
                    ? 'Retirar'
                    : delivery.status === 'PICKED_UP'
                      ? 'Retirado'
                      : 'Em Trânsito'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {activeDeliveries.length > 3 && (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('DeliveryActive')}
            >
              <Text style={styles.seeAllText}>
                Ver todas ({activeDeliveries.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuCard, shadow.sm]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
              <item.icon size={28} color={item.color} />
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.delivery.background,
  },
  welcomeCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.delivery.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 2,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.delivery.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.delivery.accent,
    gap: 8,
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.delivery.primary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryOrder: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  deliveryAddress: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  deliveryCustomer: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: colors.delivery.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.delivery.primary,
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.delivery.primary,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  menuCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    margin: 4,
    alignItems: 'center',
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.destructive,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  menuBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
    textAlign: 'center',
  },
});
