import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search, User, Shield, ShoppingBag, Truck } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminUsers'>;

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ADMIN: { label: 'Admin', color: '#7c3aed', bg: '#ede9fe', icon: Shield },
  MANAGER: { label: 'Gerente', color: '#2563eb', bg: '#dbeafe', icon: Shield },
  EMPLOYEE: { label: 'Funcionário', color: '#0891b2', bg: '#cffafe', icon: Shield },
  SELLER: { label: 'Vendedor', color: '#f59e0b', bg: '#fef3c7', icon: ShoppingBag },
  DELIVERY: { label: 'Entregador', color: '#10b981', bg: '#d1fae5', icon: Truck },
  CUSTOMER: { label: 'Cliente', color: '#6b7280', bg: '#f3f4f6', icon: User },
};

const ROLE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SELLER', label: 'Vendedor' },
  { value: 'CUSTOMER', label: 'Cliente' },
  { value: 'DELIVERY', label: 'Entregador' },
];

export function AdminUsersScreen({ navigation }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async (pageNum = 1, searchText = search, role = roleFilter) => {
    try {
      const { data } = await adminApi.getUsers({
        page: pageNum,
        limit: 20,
        search: searchText || undefined,
        role: role || undefined,
      });
      const items = data.data || data.items || data;
      if (pageNum === 1) {
        setUsers(Array.isArray(items) ? items : []);
      } else {
        setUsers((prev) => [...prev, ...(Array.isArray(items) ? items : [])]);
      }
      setHasMore(Array.isArray(items) && items.length >= 20);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { loadUsers(1); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadUsers(1));
    return unsub;
  }, [navigation]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    loadUsers(1, search, roleFilter);
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setPage(1);
    setLoading(true);
    loadUsers(1, search, role);
  };

  const renderUser = ({ item }: { item: any }) => {
    const role = ROLE_CONFIG[item.role] || ROLE_CONFIG['CUSTOMER'];
    const RoleIcon = role.icon;
    return (
      <TouchableOpacity
        style={[styles.userCard, shadow.sm]}
        onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.firstName?.[0] || '').toUpperCase()}
            {(item.lastName?.[0] || '').toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: role.bg }]}>
            <RoleIcon size={12} color={role.color} />
            <Text style={[styles.roleText, { color: role.color }]}>{role.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuário..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={ROLE_FILTERS}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, roleFilter === item.value && styles.filterChipActive]}
            onPress={() => handleRoleFilter(item.value)}
          >
            <Text style={[styles.filterChipText, roleFilter === item.value && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(1); }} />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadUsers(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  searchRow: { padding: 12, paddingBottom: 0 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.foreground },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 4,
  },
  filterChipActive: { backgroundColor: colors.admin.primary },
  filterChipText: { fontSize: 13, color: colors.gray[600] },
  filterChipTextActive: { color: colors.white, fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.admin.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.admin.primary,
  },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  userEmail: { fontSize: 13, color: colors.gray[400], marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
  },
  roleText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray[400] },
});
