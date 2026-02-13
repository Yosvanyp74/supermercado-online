import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search, UserPlus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { useSellerStore } from '@/store';
import { sellerApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'CustomerSearch'>;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loyaltyPoints?: number;
}

export function CustomerSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const { setCustomer, customerId } = useSellerStore();

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const { data } = await sellerApi.searchCustomers(query.trim());
      setResults(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao buscar clientes' });
    } finally {
      setLoading(false);
    }
  }, [query]);

  const selectCustomer = (customer: Customer) => {
    setCustomer(customer.id, customer.name);
    Toast.show({ type: 'success', text1: `Cliente: ${customer.name}` });
    navigation.goBack();
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={[
        styles.customerCard,
        item.id === customerId && styles.selectedCard,
      ]}
      onPress={() => selectCustomer(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerEmail}>{item.email}</Text>
        {item.phone && (
          <Text style={styles.customerPhone}>{item.phone}</Text>
        )}
      </View>
      {item.loyaltyPoints !== undefined && item.loyaltyPoints > 0 && (
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{item.loyaltyPoints} pts</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nome, email ou telefone..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <UserPlus size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>
              {query.length > 0 && !loading
                ? 'Nenhum cliente encontrado'
                : 'Busque por clientes'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          setCustomer(null, null);
          navigation.goBack();
        }}
      >
        <Text style={styles.skipText}>Continuar sem cliente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    ...shadow.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.foreground,
  },
  list: { paddingHorizontal: 16, gap: 8, flexGrow: 1 },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    ...shadow.sm,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.seller.primary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.seller.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.seller.primary,
  },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  customerEmail: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  customerPhone: { fontSize: 12, color: colors.gray[400], marginTop: 1 },
  pointsBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: { fontSize: 14, color: colors.gray[400] },
  skipButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  skipText: {
    fontSize: 14,
    color: colors.seller.primary,
    fontWeight: '500',
  },
});
