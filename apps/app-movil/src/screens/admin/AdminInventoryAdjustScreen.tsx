import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Save, Plus, Minus } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminInventoryAdjust'>;

export function AdminInventoryAdjustScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { productId, productName, currentStock } = route.params;
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('ADJUSTMENT');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Erro', 'Quantidade deve ser maior que zero');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Erro', 'Motivo é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (type === 'ADJUSTMENT') {
        await adminApi.adjustStock({
          productId,
          quantity: qty,
          reason: reason.trim(),
        });
      } else {
        await adminApi.createMovement({
          productId,
          type,
          quantity: qty,
          reason: reason.trim(),
        });
      }
      Alert.alert('Sucesso', 'Estoque atualizado');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível atualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Product info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.currentStock}>Estoque atual: {currentStock}</Text>
        </View>

        {/* Type */}
        <Text style={styles.label}>Tipo de movimentação</Text>
        <View style={styles.typeRow}>
          {([['IN', 'Entrada', Plus], ['OUT', 'Saída', Minus], ['ADJUSTMENT', 'Ajuste', Save]] as const).map(
            ([value, label, Icon]) => (
              <TouchableOpacity
                key={value}
                style={[styles.typeOption, type === value && styles.typeOptionActive]}
                onPress={() => setType(value as any)}
              >
                <Icon size={16} color={type === value ? colors.white : colors.gray[500]} />
                <Text style={[styles.typeOptionText, type === value && styles.typeOptionTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* Quantity */}
        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="0"
          keyboardType="number-pad"
        />

        {/* Reason */}
        <Text style={styles.label}>Motivo *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Motivo do ajuste de estoque"
          multiline
          numberOfLines={3}
        />

        {/* Preview */}
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Novo estoque estimado:</Text>
          <Text style={styles.previewValue}>
            {type === 'IN'
              ? currentStock + (Number(quantity) || 0)
              : type === 'OUT'
              ? Math.max(0, currentStock - (Number(quantity) || 0))
              : Number(quantity) || currentStock}
          </Text>
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
              <Text style={styles.saveButtonText}>Confirmar Ajuste</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  form: { padding: 16 },
  productInfo: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  productName: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  currentStock: { fontSize: 15, color: colors.gray[500], marginTop: 4 },
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    gap: 6,
  },
  typeOptionActive: { backgroundColor: colors.admin.primary },
  typeOptionText: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  typeOptionTextActive: { color: colors.white },
  preview: {
    backgroundColor: colors.admin.light,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  previewLabel: { fontSize: 13, color: colors.gray[500] },
  previewValue: { fontSize: 28, fontWeight: '700', color: colors.admin.primary, marginTop: 4 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.admin.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
