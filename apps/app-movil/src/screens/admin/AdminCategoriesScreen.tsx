import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus, Edit, Trash2, Folder } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminCategories'>;

export function AdminCategoriesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = async () => {
    try {
      const { data } = await adminApi.getCategories();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadCategories);
    return unsub;
  }, [navigation]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Excluir categoria', `Tem certeza que deseja excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteCategory(id);
            setCategories((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a categoria');
          }
        },
      },
    ]);
  };

  const flattenCategories = (cats: any[], level = 0): any[] => {
    const result: any[] = [];
    for (const cat of cats) {
      result.push({ ...cat, level });
      if (cat.children?.length) {
        result.push(...flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  };

  const flatList = flattenCategories(categories);

  const renderCategory = ({ item }: { item: any }) => (
    <View style={[styles.card, shadow.sm, { marginLeft: item.level * 20 }]}>
      <View style={styles.iconWrap}>
        <Folder size={22} color="#f59e0b" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.count}>{item._count?.products ?? item.productCount ?? 0} produtos</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminCategoryForm', { categoryId: item.id })}
          style={styles.actionBtn}
        >
          <Edit size={18} color={colors.admin.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionBtn}>
          <Trash2 size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addBar}
        onPress={() => navigation.navigate('AdminCategoryForm', {})}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.addBarText}>Nova Categoria</Text>
      </TouchableOpacity>

      <FlatList
        data={flatList}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCategories(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhuma categoria cadastrada</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.primary,
    margin: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addBarText: { color: colors.white, fontSize: 15, fontWeight: '600' },
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
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  description: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  count: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  actions: { gap: 8 },
  actionBtn: { padding: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray[400] },
});
