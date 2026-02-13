import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { HomeStackParamList } from '@/navigation/types';
import { ProductCard } from '@/components';
import { productsApi } from '@/api';
import { useCartStore } from '@/store';
import { colors } from '@/theme';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await productsApi.search(query.trim());
      setResults(data?.data || (Array.isArray(data) ? data : []));
    } catch {
      Toast.show({ type: 'error', text1: 'Erro na busca' });
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchIcon size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.input}
          placeholder="Buscar produtos..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
          placeholderTextColor={colors.gray[400]}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <X size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard
                id={item.id}
                name={item.name}
                price={item.price}
                originalPrice={item.originalPrice}
                image={item.images?.[0]?.url || item.images?.[0]}
                category={item.category?.name}
                inStock={item.stock > 0}
                onPress={() =>
                  navigation.navigate('ProductDetail', { productId: item.id })
                }
                onAddToCart={() => {
                  useCartStore.getState().addItem({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    image: item.images?.[0]?.url || item.images?.[0],
                  });
                  Toast.show({ type: 'success', text1: 'Adicionado ao carrinho!' });
                }}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
        />
      ) : searched ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          <Text style={styles.emptyHint}>Tente buscar com outras palavras</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <SearchIcon size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>Buscar Produtos</Text>
          <Text style={styles.emptyHint}>
            Digite o nome do produto que procura
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[600],
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 12,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '50%',
  },
});
