import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  User,
  Star,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DeliveryStackParamList } from '@/navigation/types';
import { Loading } from '@/components';
import { deliveryApi } from '@/api';
import { useAuthStore } from '@/store';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryProfile'>;

export function DeliveryProfileScreen({}: Props) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    failed: 0,
    avgRating: 0,
    ratedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await deliveryApi.getHistory();
      const data = res.data?.data || res.data;
      const history = Array.isArray(data) ? data : [];

      const delivered = history.filter(
        (d: any) => d.status === 'DELIVERED',
      ).length;
      const failed = history.filter(
        (d: any) => d.status === 'FAILED',
      ).length;
      const rated = history.filter((d: any) => d.rating != null);
      const avgRating =
        rated.length > 0
          ? rated.reduce((sum: number, d: any) => sum + d.rating, 0) /
            rated.length
          : 0;

      setStats({
        total: history.length,
        delivered,
        failed,
        avgRating,
        ratedCount: rated.length,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={[styles.profileCard, shadow.sm]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0)?.toUpperCase() || 'E'}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.role}>Entregador</Text>

        <View style={styles.contactRow}>
          {user?.email && (
            <View style={styles.contactItem}>
              <Mail size={14} color={colors.gray[400]} />
              <Text style={styles.contactText}>{user.email}</Text>
            </View>
          )}
          {user?.phone && (
            <View style={styles.contactItem}>
              <Phone size={14} color={colors.gray[400]} />
              <Text style={styles.contactText}>{user.phone}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Rating */}
      <View style={[styles.ratingCard, shadow.sm]}>
        <View style={styles.ratingMainRow}>
          <Star size={28} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.ratingValue}>
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          </Text>
        </View>
        <Text style={styles.ratingLabel}>
          {stats.ratedCount > 0
            ? `Baseado em ${stats.ratedCount} avaliação(ões)`
            : 'Sem avaliações ainda'}
        </Text>

        {/* Stars visualization */}
        {stats.avgRating > 0 && (
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={22}
                color="#f59e0b"
                fill={s <= Math.round(stats.avgRating) ? '#f59e0b' : 'none'}
              />
            ))}
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={[styles.statsCard, shadow.sm]}>
        <Text style={styles.statsTitle}>Estatísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.delivery.light },
              ]}
            >
              <Truck size={20} color={colors.delivery.primary} />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <View
              style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}
            >
              <CheckCircle2 size={20} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.delivered}</Text>
            <Text style={styles.statLabel}>Entregues</Text>
          </View>
          <View style={styles.statItem}>
            <View
              style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}
            >
              <XCircle size={20} color={colors.destructive} />
            </View>
            <Text style={styles.statValue}>{stats.failed}</Text>
            <Text style={styles.statLabel}>Falhas</Text>
          </View>
          <View style={styles.statItem}>
            <View
              style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}
            >
              <Clock size={20} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>
              {stats.total > 0
                ? (
                    (stats.delivered / stats.total) *
                    100
                  ).toFixed(0)
                : '0'}
              %
            </Text>
            <Text style={styles.statLabel}>Taxa de Sucesso</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.delivery.background,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    margin: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.delivery.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  role: {
    fontSize: 14,
    color: colors.delivery.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  contactRow: {
    marginTop: 16,
    gap: 8,
    width: '100%',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  ratingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  ratingMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.foreground,
  },
  ratingLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '46%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
});
