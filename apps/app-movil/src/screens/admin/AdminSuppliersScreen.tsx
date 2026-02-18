import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  FileText,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminSuppliers'>;

export function AdminSuppliersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuppliers = useCallback(async (pageNum = 1, searchText = search) => {
    try {
      const { data } = await adminApi.getSuppliers({
        page: pageNum,
        limit: 20,
        search: searchText || undefined,
      });
      const items = data?.data || data?.items || data;
      if (pageNum === 1) {
        setSuppliers(Array.isArray(items) ? items : []);
      } else {
        setSuppliers((prev) => [...prev, ...(Array.isArray(items) ? items : [])]);
      }
      setHasMore(Array.isArray(items) && items.length >= 20);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { loadSuppliers(1); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadSuppliers(1));
    return unsub;
  }, [navigation]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    loadSuppliers(1, search);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Excluir fornecedor', `Tem certeza que deseja excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteSupplier(id);
            setSuppliers((prev) => prev.filter((s) => s.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o fornecedor');
          }
        },
      },
    ]);
  };

  const renderSupplier = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, shadow.sm]}
      onPress={() => navigation.navigate('AdminSupplierForm', { supplierId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Building2 size={22} color={colors.admin.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name || item.companyName || '—'}</Text>
        {(item.contactName || item.contact) && (
          <Text style={styles.contact} numberOfLines={1}>
            {item.contactName || item.contact}
          </Text>
        )}
        <View style={styles.metaRow}>
          {item.phone && (
            <View style={styles.metaItem}>
              <Phone size={11} color={colors.gray[400]} />
              <Text style={styles.metaText}>{item.phone}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.metaItem}>
              <Mail size={11} color={colors.gray[400]} />
              <Text style={styles.metaText} numberOfLines={1}>{item.email}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminSupplierForm', { supplierId: item.id })}
          style={styles.actionBtn}
        >
          <Edit size={18} color={colors.admin.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id, item.name || item.companyName)}
          style={styles.actionBtn}
        >
          <Trash2 size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar fornecedor..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AdminSupplierForm', {})}
      >
        <Plus size={18} color={colors.white} />
        <Text style={styles.addButtonText}>Novo Fornecedor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.poButton}
        onPress={() => navigation.navigate('AdminPurchaseOrders')}
      >
        <FileText size={18} color={colors.admin.primary} />
        <Text style={styles.poButtonText}>Ordens de Compra</Text>
      </TouchableOpacity>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSuppliers(1); }} />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadSuppliers(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Building2 size={40} color={colors.gray[300]} />
              <Text style={styles.emptyText}>Nenhum fornecedor encontrado</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  topRow: { padding: 12, paddingBottom: 0 },
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.primary,
    margin: 12,
    marginBottom: 0,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  poButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.light,
    margin: 12,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.admin.accent,
  },
  poButtonText: { color: colors.admin.primary, fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.admin.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  contact: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: colors.gray[400] },
  actions: { gap: 8 },
  actionBtn: { padding: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray[400], marginTop: 12 },
});
