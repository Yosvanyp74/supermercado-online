import React from 'react';
import {
  View,
  Text,
  Image,
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
  Shield,
  Truck,
  Sun,
  Moon,
  Smartphone,
} from 'lucide-react-native';
import { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store';
import { shadow, useTheme } from '@/theme';
import type { ThemeMode } from '@/theme';
import { getImageUrl } from '@/config/env';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { colors, mode, setMode, isDark } = useTheme();
  const styles = createStyles(colors);
  const { user, logout, isSeller, isAdmin, isDelivery } = useAuthStore();

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

  if (isAdmin) {
    menuItems.push({
      icon: Shield,
      label: 'Modo Administrador',
      onPress: () => (navigation as any).navigate('Admin'),
    });
  }

  if (isDelivery) {
    menuItems.push({
      icon: Truck,
      label: 'Modo Entregador',
      onPress: () => (navigation as any).navigate('Delivery'),
    });
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={[styles.profileCard, shadow.sm]}>
        {user?.avatarUrl ? (
          <Image
            source={{ uri: getImageUrl(user.avatarUrl)! }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
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

      {/* Theme */}
      <View style={[styles.menuCard, shadow.sm, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Aparência</Text>
        <View style={styles.themeRow}>
          {([
            { key: 'light' as ThemeMode, icon: Sun, label: 'Claro' },
            { key: 'dark' as ThemeMode, icon: Moon, label: 'Escuro' },
            { key: 'system' as ThemeMode, icon: Smartphone, label: 'Sistema' },
          ]).map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.themeOption,
                mode === opt.key && styles.themeOptionActive,
              ]}
              onPress={() => setMode(opt.key)}
              activeOpacity={0.6}
            >
              <opt.icon
                size={20}
                color={mode === opt.key ? colors.primary[600] : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.themeOptionLabel,
                  mode === opt.key && styles.themeOptionLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

const createStyles = (colors: any) => StyleSheet.create({
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
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  themeRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.muted,
    gap: 6,
  },
  themeOptionActive: {
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.primary[600],
  },
  themeOptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  themeOptionLabelActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});
