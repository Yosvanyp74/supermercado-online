import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, Check } from 'lucide-react-native';
import { ProfileStackParamList } from '@/navigation/types';
import { Loading, EmptyState, Button } from '@/components';
import { notificationsApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationsApi.getAll();
      setNotifications(data || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // Ignore
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  };

  if (loading) return <Loading fullScreen />;

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={48} color={colors.gray[300]} />}
        title="Sem notificações"
      />
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.markAllButton} onPress={markAllRead}>
        <Check size={16} color={colors.primary[600]} />
        <Text style={styles.markAllText}>Marcar todas como lidas</Text>
      </TouchableOpacity>

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
              !item.read && styles.unread,
              shadow.sm,
            ]}
            onPress={() => markRead(item.id)}
          >
            <View style={[styles.dot, item.read && styles.dotRead]} />
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>
                {item.body || item.message}
              </Text>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  markAllText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  list: { paddingHorizontal: 16 },
  item: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 10,
  },
  unread: { backgroundColor: colors.primary[50] },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
    marginTop: 6,
  },
  dotRead: { backgroundColor: 'transparent' },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  body: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  time: { fontSize: 11, color: colors.gray[400], marginTop: 4 },
});
