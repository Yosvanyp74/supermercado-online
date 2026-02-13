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
import { useNavigation } from '@react-navigation/native';
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Tag,
  Ticket,
  Warehouse,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowLeftCircle,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { adminApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminHome'>;

export function AdminHomeScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data } = await adminApi.getDashboard();
      setStats(data);
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
      icon: Package,
      label: 'Produtos',
      subtitle: 'Gerenciar catálogo',
      color: colors.admin.primary,
      bg: colors.admin.light,
      onPress: () => navigation.navigate('AdminProducts'),
    },
    {
      icon: Tag,
      label: 'Categorias',
      subtitle: 'Organizar produtos',
      color: '#f59e0b',
      bg: '#fef3c7',
      onPress: () => navigation.navigate('AdminCategories'),
    },
    {
      icon: ShoppingCart,
      label: 'Pedidos',
      subtitle: `${stats?.pendingOrders || 0} pendentes`,
      color: '#3b82f6',
      bg: '#dbeafe',
      onPress: () => navigation.navigate('AdminOrders'),
      badge: stats?.pendingOrders > 0 ? stats.pendingOrders : undefined,
    },
    {
      icon: Users,
      label: 'Usuários',
      subtitle: 'Gerenciar contas',
      color: '#10b981',
      bg: '#d1fae5',
      onPress: () => navigation.navigate('AdminUsers'),
    },
    {
      icon: Warehouse,
      label: 'Estoque',
      subtitle: `${stats?.lowStockProducts || 0} em baixa`,
      color: '#ef4444',
      bg: '#fee2e2',
      onPress: () => navigation.navigate('AdminInventory'),
      badge: stats?.lowStockProducts > 0 ? stats.lowStockProducts : undefined,
    },
    {
      icon: Ticket,
      label: 'Cupons',
      subtitle: 'Promoções',
      color: '#8b5cf6',
      bg: '#ede9fe',
      onPress: () => navigation.navigate('AdminCoupons'),
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
          <DollarSign size={20} color={colors.admin.primary} />
          <Text style={styles.statValue}>
            R$ {(stats?.totalRevenue || stats?.todaySales || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Receita</Text>
        </View>
        <View style={[styles.statCard, shadow.sm]}>
          <TrendingUp size={20} color="#3b82f6" />
          <Text style={styles.statValue}>{stats?.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>
        <View style={[styles.statCard, shadow.sm]}>
          <AlertTriangle size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats?.lowStockProducts || 0}</Text>
          <Text style={styles.statLabel}>Estoque Baixo</Text>
        </View>
      </View>

      {/* Exit admin mode */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => rootNavigation.navigate('Main')}
        activeOpacity={0.7}
      >
        <ArrowLeftCircle size={20} color={colors.admin.primary} />
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

const styles = StyleSheet.create({
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
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.admin.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.admin.accent,
    gap: 8,
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.admin.primary,
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
});
