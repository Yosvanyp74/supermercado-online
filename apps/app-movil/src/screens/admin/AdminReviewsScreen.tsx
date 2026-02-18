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
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Search,
  Star,
  CheckCircle,
  Trash2,
  User,
  MessageSquare,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { getImageUrl } from '@/config';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminReviews'>;

export function AdminReviewsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [reviews, setReviews] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load products for search
  const searchProducts = useCallback(async () => {
    if (!productSearch.trim()) return;
    try {
      const { data } = await adminApi.getProducts({
        search: productSearch,
        limit: 10,
      });
      const items = data?.data || data?.items || data;
      setProducts(Array.isArray(items) ? items : []);
    } catch {
      // Ignore
    }
  }, [productSearch]);

  // Load reviews for selected product
  const loadReviews = useCallback(async (productId: string) => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data } = await adminApi.getReviews(productId, { limit: 50 });
      const items = data?.data || data?.items || data;
      setReviews(Array.isArray(items) ? items : []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSelectProduct = (product: any) => {
    setSelectedProductId(product.id);
    setProductSearch(product.name);
    setProducts([]);
    loadReviews(product.id);
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveReview(id);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, approved: true, status: 'APPROVED' } : r)),
      );
      Alert.alert('Sucesso', 'Avaliação aprovada');
    } catch {
      Alert.alert('Erro', 'Não foi possível aprovar');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Excluir avaliação', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteReview(id);
            setReviews((prev) => prev.filter((r) => r.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir');
          }
        },
      },
    ]);
  };

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          color={i <= rating ? '#f59e0b' : colors.gray[300]}
          fill={i <= rating ? '#f59e0b' : 'none'}
        />
      ))}
    </View>
  );

  const renderReview = ({ item }: { item: any }) => {
    const isApproved = item.approved || item.status === 'APPROVED';
    return (
      <View style={[styles.reviewCard, shadow.sm, !isApproved && styles.unapproved]}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewer}>
            <View style={styles.avatar}>
              <User size={14} color={colors.gray[400]} />
            </View>
            <View>
              <Text style={styles.reviewerName}>
                {item.user?.firstName || 'Usuário'} {item.user?.lastName || ''}
              </Text>
              <Text style={styles.reviewDate}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : ''}
              </Text>
            </View>
          </View>
          {renderStars(item.rating || 0)}
        </View>
        {item.comment && (
          <Text style={styles.comment} numberOfLines={4}>{item.comment}</Text>
        )}
        <View style={styles.reviewActions}>
          {!isApproved && (
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
              <CheckCircle size={16} color="#16a34a" />
              <Text style={styles.approveBtnText}>Aprovar</Text>
            </TouchableOpacity>
          )}
          {isApproved && (
            <View style={styles.approvedBadge}>
              <CheckCircle size={14} color="#16a34a" />
              <Text style={styles.approvedText}>Aprovada</Text>
            </View>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Trash2 size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Product search */}
      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>Buscar por produto:</Text>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nome do produto..."
            value={productSearch}
            onChangeText={setProductSearch}
            onSubmitEditing={searchProducts}
            returnKeyType="search"
          />
        </View>
        {products.length > 0 && (
          <View style={styles.suggestions}>
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.suggestion}
                onPress={() => handleSelectProduct(p)}
              >
                <Text style={styles.suggestionText} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.suggestionMeta}>
                  {p._count?.reviews || 0} avaliações
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedProductId ? (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReview}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadReviews(selectedProductId);
              }}
            />
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {reviews.length} avaliação(ões)
            </Text>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <MessageSquare size={40} color={colors.gray[300]} />
                <Text style={styles.emptyText}>Nenhuma avaliação encontrada</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.empty}>
          <Star size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>Busque um produto para ver suas avaliações</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  searchSection: { padding: 12 },
  searchLabel: { fontSize: 13, fontWeight: '600', color: colors.gray[600], marginBottom: 6 },
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
  suggestions: {
    backgroundColor: colors.white,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: { fontSize: 14, color: colors.foreground, flex: 1 },
  suggestionMeta: { fontSize: 12, color: colors.gray[400], marginLeft: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  listHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 8,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  unapproved: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerName: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  reviewDate: { fontSize: 11, color: colors.gray[400] },
  starsRow: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: 14, color: colors.gray[600], lineHeight: 20 },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
  },
  approveBtnText: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  approvedText: { fontSize: 13, color: '#16a34a' },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray[400], marginTop: 12, textAlign: 'center' },
});
