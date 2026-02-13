import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  User,
  MapPin,
  Heart,
  Star,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Store,
  Package,
} from 'lucide-react-native';
import { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, logout, isSeller } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const menuItems = [
    {
      icon: User,
      label: 'Editar Perfil',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: MapPin,
      label: 'Meus Endereços',
      onPress: () => navigation.navigate('Addresses'),
    },
    {
      icon: Heart,
      label: 'Lista de Desejos',
      onPress: () => navigation.navigate('Wishlist'),
    },
    {
      icon: Star,
      label: 'Programa de Fidelidade',
      onPress: () => navigation.navigate('Loyalty'),
      badge: user?.loyaltyPoints ? `${user.loyaltyPoints} pts` : undefined,
    },
    {
      icon: Bell,
      label: 'Notificações',
      onPress: () => navigation.navigate('Notifications'),
    },
  ];

  if (isSeller) {
    menuItems.push({
      icon: Store,
      label: 'Modo Vendedor',
      onPress: () => (navigation as any).navigate('Seller'),
    });
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={[styles.profileCard, shadow.sm]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, shadow.sm]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <item.icon size={20} color={colors.gray[500]} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <ChevronRight size={18} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, shadow.sm]}
        onPress={handleLogout}
      >
        <LogOut size={20} color={colors.destructive} />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>

      <Text style={styles.version}>SuperMercado v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50], padding: 16 },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  profileInfo: { marginLeft: 16 },
  name: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  email: { fontSize: 14, color: colors.gray[500], marginTop: 2 },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  logoutButton: {
    backgroundColor: colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.destructive,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 24,
    marginBottom: 32,
  },
});
