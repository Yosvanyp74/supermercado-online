import React, { useEffect, useState } from 'react';
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
  Scan,
  ShoppingBag,
  Clock,
  PauseCircle,
  History,
  Package,
  TrendingUp,
  DollarSign,
  ArrowLeftCircle,
  Truck,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SellerStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { sellerApi } from '@/api';
import { useAuthStore, useSellerStore } from '@/store';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'SellerHome'>;

export function SellerHomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const rootNavigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { activeItems } = useSellerStore();

  const handleExitSellerMode = () => {
    rootNavigation.navigate('Main');
  };
  const [stats, setStats] = useState<any>(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [readyOrders, setReadyOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes, readyRes] = await Promise.all([
        sellerApi.getStats().catch(() => ({ data: null })),
        sellerApi.getPendingOrders().catch(() => ({ data: [] })),
        sellerApi.getReadyForDeliveryOrders().catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setPendingOrders(
        Array.isArray(ordersRes.data) ? ordersRes.data.length : ordersRes.data?.total || 0,
      );
      setReadyOrders(
        Array.isArray(readyRes.data) ? readyRes.data.length : 0,
      );
    } catch {
      // Ignore
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

  const menuItems = [
    {
      icon: Scan,
      label: 'Nova Venda',
      subtitle: 'Escanear produto',
      color: colors.primary[600],
      bg: colors.primary[50],
      onPress: () => navigation.navigate('ProductScanner'),
    },
    {
      icon: ShoppingBag,
      label: 'Venda Ativa',
      subtitle: activeItems.length > 0 ? `${activeItems.length} itens` : 'Nenhum item',
      color: '#f59e0b',
      bg: '#fef3c7',
      onPress: () => navigation.navigate('ActiveSale'),
      badge: activeItems.length > 0 ? activeItems.length : undefined,
    },
    {
      icon: Package,
      label: 'Fila de Pedidos',
      subtitle: `${pendingOrders} pendentes`,
      color: '#3b82f6',
      bg: '#dbeafe',
      onPress: () => navigation.navigate('OrderQueue'),
      badge: pendingOrders > 0 ? pendingOrders : undefined,
    },
    {
      icon: PauseCircle,
      label: 'Vendas Suspensas',
      subtitle: 'Retomar venda',
      color: '#8b5cf6',
      bg: '#ede9fe',
      onPress: () => navigation.navigate('SuspendedSales'),
    },
    {
      icon: Truck,
      label: 'Prontos p/ Entrega',
      subtitle: `${readyOrders} prontos`,
      color: '#ea580c',
      bg: '#fff7ed',
      onPress: () => navigation.navigate('ReadyForDelivery'),
      badge: readyOrders > 0 ? readyOrders : undefined,
    },
    {
      icon: History,
      label: 'Histórico',
      subtitle: 'Vendas anteriores',
      color: colors.gray[600],
      bg: colors.gray[100],
      onPress: () => navigation.navigate('SalesHistory'),
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
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, shadow.sm]}>
          <DollarSign size={20} color={colors.primary[600]} />
          <Text style={styles.statValue}>
            R$ {(stats?.todaySales || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Vendas Hoje</Text>
        </View>
        <View style={[styles.statCard, shadow.sm]}>
          <TrendingUp size={20} color="#3b82f6" />
          <Text style={styles.statValue}>{stats?.todayTransactions || 0}</Text>
          <Text style={styles.statLabel}>Transações</Text>
        </View>
        <View style={[styles.statCard, shadow.sm]}>
          <Package size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{pendingOrders}</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>
      </View>

      {/* Exit seller mode */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={handleExitSellerMode}
        activeOpacity={0.7}
      >
        <ArrowLeftCircle size={20} color={colors.primary[600]} />
        <Text style={styles.exitButtonText}>Voltar ao modo cliente</Text>
      </TouchableOpacity>

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
    backgroundColor: colors.gray[50],
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 2,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 0,
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
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: 8,
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
