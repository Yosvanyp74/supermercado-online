import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MapPin, Plus, Trash2, Star } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { ProfileStackParamList } from '@/navigation/types';
import { Button, Loading, EmptyState } from '@/components';
import { useAuthStore } from '@/store';
import { usersApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Addresses'>;

export function AddressesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await usersApi.getAddresses(user.id);
      setAddresses(data || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );

  const handleDelete = (addressId: string) => {
    Alert.alert('Excluir Endereço', 'Deseja excluir este endereço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await usersApi.deleteAddress(user!.id, addressId);
            setAddresses((prev) => prev.filter((a) => a.id !== addressId));
            Toast.show({ type: 'success', text1: 'Endereço excluído' });
          } catch {
            Toast.show({ type: 'error', text1: 'Erro ao excluir' });
          }
        },
      },
    ]);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        renderItem={({ item }) => (
          <View style={[styles.card, shadow.sm]}>
            <View style={styles.cardHeader}>
              <View style={styles.labelRow}>
                <MapPin size={16} color={colors.primary[600]} />
                <Text style={styles.label}>{item.label || 'Endereço'}</Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Star size={10} color={colors.primary[600]} fill={colors.primary[600]} />
                    <Text style={styles.defaultText}>Padrão</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 size={18} color={colors.destructive} />
              </TouchableOpacity>
            </View>
            <Text style={styles.address}>
              {item.street}, {item.number}
              {item.complement ? ` - ${item.complement}` : ''}
            </Text>
            <Text style={styles.addressSecondary}>
              {item.neighborhood} - {item.city}/{item.state}
            </Text>
            <Text style={styles.zip}>{item.zipCode}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon={<MapPin size={48} color={colors.gray[300]} />}
            title="Nenhum endereço"
            description="Adicione um endereço para receber entregas"
          />
        }
      />
      <View style={styles.footer}>
        <Button
          title="Adicionar Endereço"
          onPress={() => navigation.navigate('AddAddress', {})}
          icon={<Plus size={18} color={colors.white} />}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    marginLeft: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary[600],
  },
  address: { fontSize: 14, color: colors.gray[600] },
  addressSecondary: { fontSize: 13, color: colors.gray[400], marginTop: 2 },
  zip: { fontSize: 13, color: colors.gray[400], marginTop: 2 },
  footer: { padding: 16 },
});
