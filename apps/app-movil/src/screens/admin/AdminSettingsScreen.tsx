import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bell,
  Mail,
  Smartphone,
  ShoppingCart,
  Package,
  AlertTriangle,
  Star,
  Truck,
  Save,
  Info,
} from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminSettings'>;

interface NotifPref {
  orderUpdates: boolean;
  stockAlerts: boolean;
  reviewAlerts: boolean;
  deliveryUpdates: boolean;
  promotions: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

const DEFAULT_PREFS: NotifPref = {
  orderUpdates: true,
  stockAlerts: true,
  reviewAlerts: true,
  deliveryUpdates: true,
  promotions: true,
  emailNotifications: true,
  pushNotifications: true,
};

export function AdminSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [prefs, setPrefs] = useState<NotifPref>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data } = await adminApi.getNotificationPreferences();
      if (data) {
        setPrefs({
          orderUpdates: data.orderUpdates ?? true,
          stockAlerts: data.stockAlerts ?? true,
          reviewAlerts: data.reviewAlerts ?? true,
          deliveryUpdates: data.deliveryUpdates ?? true,
          promotions: data.promotions ?? true,
          emailNotifications: data.emailNotifications ?? data.email ?? true,
          pushNotifications: data.pushNotifications ?? data.push ?? true,
        });
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateNotificationPreferences(prefs as unknown as Record<string, unknown>);
      Alert.alert('Sucesso', 'Preferências atualizadas');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof NotifPref) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.admin.primary} />
      </View>
    );
  }

  const notifItems = [
    { key: 'orderUpdates' as const, icon: ShoppingCart, label: 'Atualizações de pedidos', description: 'Receber notificações sobre novos pedidos e mudanças de status' },
    { key: 'stockAlerts' as const, icon: AlertTriangle, label: 'Alertas de estoque', description: 'Avisos quando o estoque de um produto está baixo' },
    { key: 'reviewAlerts' as const, icon: Star, label: 'Alertas de avaliações', description: 'Notificações sobre novas avaliações de produtos' },
    { key: 'deliveryUpdates' as const, icon: Truck, label: 'Atualizações de entregas', description: 'Status das entregas em andamento' },
    { key: 'promotions' as const, icon: Info, label: 'Promoções e novidades', description: 'Informações sobre promoções e atualizações do sistema' },
  ];

  const channelItems = [
    { key: 'emailNotifications' as const, icon: Mail, label: 'Notificações por e-mail' },
    { key: 'pushNotifications' as const, icon: Smartphone, label: 'Notificações push' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Notification categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell size={18} color={colors.admin.primary} />
          <Text style={styles.sectionTitle}>Tipos de Notificação</Text>
        </View>
        <View style={[styles.card, shadow.sm]}>
          {notifItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <View
                key={item.key}
                style={[styles.settingRow, index < notifItems.length - 1 && styles.settingBorder]}
              >
                <View style={styles.settingLeft}>
                  <Icon size={18} color={colors.gray[500]} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                </View>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ true: colors.admin.primary }}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Channels */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Smartphone size={18} color={colors.admin.primary} />
          <Text style={styles.sectionTitle}>Canais</Text>
        </View>
        <View style={[styles.card, shadow.sm]}>
          {channelItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <View
                key={item.key}
                style={[styles.settingRow, index < channelItems.length - 1 && styles.settingBorder]}
              >
                <View style={styles.settingLeft}>
                  <Icon size={18} color={colors.gray[500]} />
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ true: colors.admin.primary }}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Save size={20} color={colors.white} />
            <Text style={styles.saveButtonText}>Salvar Configurações</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: colors.foreground },
  settingDescription: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.primary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
