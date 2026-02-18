import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Save } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminCouponForm'>;

export function AdminCouponFormScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const couponId = route.params?.couponId;
  const isEdit = !!couponId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
    value: '',
    minOrderAmount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  });

  useEffect(() => {
    if (isEdit) loadCoupon();
  }, []);

  const loadCoupon = async () => {
    try {
      // Get list and find the coupon
      const { data } = await adminApi.getCoupons({ limit: 100 });
      const items = data.data || data.items || data;
      const coupon = Array.isArray(items) ? items.find((c: any) => c.id === couponId) : null;
      if (coupon) {
        setForm({
          code: coupon.code || '',
          type: coupon.type || 'PERCENTAGE',
          value: String(coupon.value || ''),
          minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
          usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
          expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
          isActive: coupon.isActive !== false,
        });
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o cupom');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      Alert.alert('Erro', 'Código é obrigatório');
      return;
    }
    if (!form.value || isNaN(Number(form.value))) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }

    setSaving(true);
    try {
      const couponData: Record<string, unknown> = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: form.isActive,
      };

      if (isEdit) {
        await adminApi.updateCoupon(couponId!, couponData);
        Alert.alert('Sucesso', 'Cupom atualizado');
      } else {
        await adminApi.createCoupon(couponData);
        Alert.alert('Sucesso', 'Cupom criado');
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.admin.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.label}>Código *</Text>
        <TextInput
          style={styles.input}
          value={form.code}
          onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })}
          placeholder="PROMO10"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.typeRow}>
          {([
            ['PERCENTAGE', 'Porcentagem'],
            ['FIXED_AMOUNT', 'Valor fixo'],
            ['FREE_SHIPPING', 'Frete grátis'],
          ] as const).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[styles.typeOption, form.type === value && styles.typeOptionActive]}
              onPress={() => setForm({ ...form, type: value as any })}
            >
              <Text style={[styles.typeOptionText, form.type === value && styles.typeOptionTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>
              Valor * {form.type === 'PERCENTAGE' ? '(%)' : '(R$)'}
            </Text>
            <TextInput
              style={styles.input}
              value={form.value}
              onChangeText={(v) => setForm({ ...form, value: v })}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Pedido mínimo (R$)</Text>
            <TextInput
              style={styles.input}
              value={form.minOrderAmount}
              onChangeText={(v) => setForm({ ...form, minOrderAmount: v })}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Limite de uso</Text>
            <TextInput
              style={styles.input}
              value={form.usageLimit}
              onChangeText={(v) => setForm({ ...form, usageLimit: v })}
              placeholder="Ilimitado"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Expira em (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.expiresAt}
              onChangeText={(v) => setForm({ ...form, expiresAt: v })}
              placeholder="2026-12-31"
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Ativo</Text>
          <Switch
            value={form.isActive}
            onValueChange={(v) => setForm({ ...form, isActive: v })}
            trackColor={{ true: colors.admin.primary }}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Save size={20} color={colors.white} />
              <Text style={styles.saveButtonText}>{isEdit ? 'Atualizar' : 'Criar'} Cupom</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[600], marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  typeOptionActive: { backgroundColor: colors.admin.primary },
  typeOptionText: { fontSize: 12, fontWeight: '600', color: colors.gray[600] },
  typeOptionTextActive: { color: colors.white },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 8,
  },
  toggleLabel: { fontSize: 15, color: colors.foreground },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
    marginBottom: 40,
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
