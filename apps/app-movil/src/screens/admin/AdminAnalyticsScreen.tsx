import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { adminApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminAnalytics'>;

const PERIODS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
];

export function AdminAnalyticsScreen({ navigation }: Props) {
  const [sales, setSales] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState(30);

  const getDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const loadData = useCallback(async () => {
    try {
      const range = getDateRange(period);
      const [salesRes, productsRes, customersRes, revenueRes, sellersRes] =
        await Promise.allSettled([
          adminApi.getSalesAnalytics(range),
          adminApi.getTopProducts({ ...range, limit: 10 }),
          adminApi.getCustomerAnalytics(range),
          adminApi.getRevenueByDay(range),
          adminApi.getSellerPerformance(range),
        ]);

      if (salesRes.status === 'fulfilled') setSales(salesRes.value.data);
      if (productsRes.status === 'fulfilled') {
        const d = productsRes.value.data;
        setTopProducts(Array.isArray(d) ? d : d?.data || []);
      }
      if (customersRes.status === 'fulfilled') setCustomers(customersRes.value.data);
      if (revenueRes.status === 'fulfilled') {
        const d = revenueRes.value.data;
        setRevenue(Array.isArray(d) ? d : d?.data || []);
      }
      if (sellersRes.status === 'fulfilled') {
        const d = sellersRes.value.data;
        setSellers(Array.isArray(d) ? d : d?.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  if (loading) return <Loading fullScreen />;

  const maxRevenue = Math.max(...revenue.map((r) => Number(r.total || r.revenue || 0)), 1);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
      }
    >
      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.days}
            style={[styles.periodChip, period === p.days && styles.periodChipActive]}
            onPress={() => setPeriod(p.days)}
          >
            <Text style={[styles.periodText, period === p.days && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sales overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendas</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, shadow.sm]}>
            <DollarSign size={18} color={colors.admin.primary} />
            <Text style={styles.statValue}>
              R$ {Number(sales?.totalRevenue || sales?.total || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Receita Total</Text>
          </View>
          <View style={[styles.statCard, shadow.sm]}>
            <ShoppingCart size={18} color="#3b82f6" />
            <Text style={styles.statValue}>{sales?.totalOrders || sales?.count || 0}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
          <View style={[styles.statCard, shadow.sm]}>
            <TrendingUp size={18} color="#10b981" />
            <Text style={styles.statValue}>
              R$ {Number(sales?.averageOrderValue || sales?.avgTicket || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Ticket Médio</Text>
          </View>
        </View>
      </View>

      {/* Revenue chart (simple bar chart) */}
      {revenue.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receita Diária</Text>
          <View style={[styles.chartCard, shadow.sm]}>
            <View style={styles.barChart}>
              {revenue.slice(-14).map((r, i) => {
                const val = Number(r.total || r.revenue || 0);
                const height = Math.max((val / maxRevenue) * 100, 4);
                const dateLabel = (r.date || r.day || '').slice(-5);
                return (
                  <View key={i} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        { height, backgroundColor: colors.admin.primary },
                      ]}
                    />
                    <Text style={styles.barLabel}>{dateLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Customer stats */}
      {customers && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clientes</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, shadow.sm]}>
              <Users size={18} color="#8b5cf6" />
              <Text style={styles.statValue}>{customers.totalCustomers || customers.total || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, shadow.sm]}>
              <Users size={18} color="#10b981" />
              <Text style={styles.statValue}>{customers.newCustomers || customers.new || 0}</Text>
              <Text style={styles.statLabel}>Novos</Text>
            </View>
            <View style={[styles.statCard, shadow.sm]}>
              <Users size={18} color="#f59e0b" />
              <Text style={styles.statValue}>{customers.returningCustomers || customers.returning || 0}</Text>
              <Text style={styles.statLabel}>Recorrentes</Text>
            </View>
          </View>
        </View>
      )}

      {/* Top products */}
      {topProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Produtos</Text>
          <View style={[styles.listCard, shadow.sm]}>
            {topProducts.slice(0, 10).map((p, i) => (
              <View key={p.id || i} style={[styles.rankItem, i < topProducts.length - 1 && styles.rankBorder]}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>{i + 1}</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName} numberOfLines={1}>
                    {p.name || p.product?.name || 'Produto'}
                  </Text>
                  <Text style={styles.rankMeta}>
                    {p.totalSold || p.quantity || 0} vendidos · R$ {Number(p.totalRevenue || p.revenue || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Seller performance */}
      {sellers.length > 0 && (
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Desempenho dos Vendedores</Text>
          <View style={[styles.listCard, shadow.sm]}>
            {sellers.map((s, i) => (
              <View key={s.id || i} style={[styles.rankItem, i < sellers.length - 1 && styles.rankBorder]}>
                <View style={[styles.rankBadge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.rankNumber, { color: '#f59e0b' }]}>{i + 1}</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName} numberOfLines={1}>
                    {s.firstName || s.name || 'Vendedor'} {s.lastName || ''}
                  </Text>
                  <Text style={styles.rankMeta}>
                    {s.totalSales || s.orderCount || 0} vendas · R$ {Number(s.totalRevenue || s.revenue || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  periodChipActive: { backgroundColor: colors.admin.primary },
  periodText: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  periodTextActive: { color: colors.white },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 10,
  },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 6,
  },
  statLabel: { fontSize: 11, color: colors.gray[400], marginTop: 2, textAlign: 'center' },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 12, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 8, color: colors.gray[400], marginTop: 4 },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  rankBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.admin.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: { fontSize: 12, fontWeight: '700', color: colors.admin.primary },
  rankInfo: { flex: 1, marginLeft: 12 },
  rankName: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  rankMeta: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
});
