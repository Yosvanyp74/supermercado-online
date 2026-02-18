import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ShoppingCart,
  Package,
  AlertTriangle,
  Info,
  Trash2,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminNotifications'>;

const TYPE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  ORDER: { icon: ShoppingCart, color: '#3b82f6', bg: '#dbeafe' },
  DELIVERY: { icon: Package, color: '#10b981', bg: '#d1fae5' },
  STOCK: { icon: AlertTriangle, color: '#f59e0b', bg: '#fef3c7' },
  SYSTEM: { icon: Info, color: '#6b7280', bg: '#f3f4f6' },
};

export function AdminNotificationsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const TYPE_ICONS_DEFAULT = { icon: Bell, color: colors.admin.primary, bg: colors.admin.light };
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRead, setShowRead] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.allSettled([
        adminApi.getNotifications({ limit: 50, isRead: showRead ? undefined : false }),
        adminApi.getUnreadCount(),
      ]);

      if (notifRes.status === 'fulfilled') {
        const items = notifRes.value.data?.data || notifRes.value.data;
        setNotifications(Array.isArray(items) ? items : []);
      }
      if (countRes.status === 'fulfilled') {
        setUnreadCount(countRes.value.data?.count || countRes.value.data || 0);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showRead]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadNotifications);
    return unsub;
  }, [navigation]);

  const handleMarkRead = async (id: string) => {
    try {
      await adminApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      setUnreadCount(0);
    } catch {
      Alert.alert('Erro', 'Não foi possível marcar todas como lidas');
    }
  };

  const getTypeConfig = (type?: string) => {
    if (type && TYPE_ICONS[type.toUpperCase()]) return TYPE_ICONS[type.toUpperCase()];
    return TYPE_ICONS_DEFAULT;
  };

  const renderNotification = ({ item }: { item: any }) => {
    const isRead = item.read || item.isRead;
    const config = getTypeConfig(item.type);
    const Icon = config.icon;

    return (
      <TouchableOpacity
        style={[styles.card, shadow.sm, !isRead && styles.unreadCard]}
        onPress={() => !isRead && handleMarkRead(item.id)}
        activeOpacity={isRead ? 1 : 0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
          <Icon size={20} color={config.color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !isRead && styles.unreadTitle]} numberOfLines={2}>
            {item.title || item.message || 'Notificação'}
          </Text>
          {item.body && (
            <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          )}
          <Text style={styles.time}>
            {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : ''}
          </Text>
        </View>
        {!isRead && (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View style={styles.unreadInfo}>
          <Bell size={16} color={colors.admin.primary} />
          <Text style={styles.unreadText}>
            {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowRead(!showRead)}
          >
            {showRead ? <Bell size={16} color={colors.gray[500]} /> : <BellOff size={16} color={colors.admin.primary} />}
            <Text style={styles.filterText}>
              {showRead ? 'Todas' : 'Não lidas'}
            </Text>
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <CheckCheck size={16} color={colors.admin.primary} />
              <Text style={styles.markAllText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Bell size={40} color={colors.gray[300]} />
              <Text style={styles.emptyText}>Nenhuma notificação</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unreadInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadText: { fontSize: 13, fontWeight: '600', color: colors.admin.primary },
  headerActions: { flexDirection: 'row', gap: 10 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  filterText: { fontSize: 12, color: colors.gray[600] },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.admin.light,
    borderRadius: 8,
  },
  markAllText: { fontSize: 12, fontWeight: '600', color: colors.admin.primary },
  list: { paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: colors.admin.light,
    borderLeftWidth: 3,
    borderLeftColor: colors.admin.primary,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, marginLeft: 12 },
  title: { fontSize: 14, color: colors.foreground },
  unreadTitle: { fontWeight: '600' },
  body: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  time: { fontSize: 11, color: colors.gray[400], marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.admin.primary,
    marginLeft: 8,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray[400], marginTop: 12 },
});
