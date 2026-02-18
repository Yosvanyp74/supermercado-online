import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { User, Mail, Phone, Shield, Ban } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminUserDetail'>;

const ROLES = ['CUSTOMER', 'SELLER', 'EMPLOYEE', 'MANAGER', 'ADMIN'];
const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Cliente',
  SELLER: 'Vendedor',
  EMPLOYEE: 'Funcionário',
  MANAGER: 'Gerente',
  ADMIN: 'Administrador',
  DELIVERY: 'Entregador',
};

export function AdminUserDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userId } = route.params;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadUser = async () => {
    try {
      const { data } = await adminApi.getUser(userId);
      setUser(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o usuário');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  const handleChangeRole = (newRole: string) => {
    if (newRole === user.role) return;
    Alert.alert(
      'Alterar função',
      `Mudar de "${ROLE_LABELS[user.role]}" para "${ROLE_LABELS[newRole]}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setUpdating(true);
            try {
              await adminApi.updateUser(userId, { role: newRole });
              setUser({ ...user, role: newRole });
            } catch (err: any) {
              Alert.alert('Erro', err?.response?.data?.message || 'Falha ao atualizar');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Desativar usuário',
      `Tem certeza que deseja desativar ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.deleteUser(userId);
              Alert.alert('Sucesso', 'Usuário desativado');
              navigation.goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível desativar o usuário');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.admin.primary} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={[styles.card, shadow.sm, styles.profileCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.firstName?.[0] || '').toUpperCase()}
            {(user.lastName?.[0] || '').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <View style={styles.infoRow}>
          <Mail size={14} color={colors.gray[400]} />
          <Text style={styles.infoText}>{user.email}</Text>
        </View>
        {user.phone && (
          <View style={styles.infoRow}>
            <Phone size={14} color={colors.gray[400]} />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
        )}
        <Text style={styles.joinDate}>
          Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      {/* Role management */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionTitle}>Função</Text>
        <View style={styles.rolesGrid}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleOption, user.role === role && styles.roleOptionActive]}
              onPress={() => handleChangeRole(role)}
              disabled={updating}
            >
              <Shield size={16} color={user.role === role ? colors.white : colors.gray[500]} />
              <Text style={[styles.roleOptionText, user.role === role && styles.roleOptionTextActive]}>
                {ROLE_LABELS[role]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Danger zone */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={[styles.sectionTitle, { color: colors.destructive }]}>Zona de perigo</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDeactivate}>
          <Ban size={18} color={colors.destructive} />
          <Text style={styles.dangerButtonText}>Desativar Usuário</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 12,
    marginBottom: 0,
  },
  profileCard: { alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.admin.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: colors.admin.primary },
  name: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  infoText: { fontSize: 14, color: colors.gray[500] },
  joinDate: { fontSize: 12, color: colors.gray[400], marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground, marginBottom: 12 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    gap: 6,
  },
  roleOptionActive: { backgroundColor: colors.admin.primary },
  roleOptionText: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  roleOptionTextActive: { color: colors.white },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  dangerButtonText: { fontSize: 15, fontWeight: '600', color: colors.destructive },
});
