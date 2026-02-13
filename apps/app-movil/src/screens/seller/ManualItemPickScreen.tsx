import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CheckCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { sellerApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'ManualItemPick'>;

type PickStatus = 'picked' | 'substituted' | 'not_found';

const statusOptions: { key: PickStatus; label: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'picked',
    label: 'Coletado',
    icon: <CheckCircle size={24} color={colors.primary[500]} />,
    color: colors.primary[50],
  },
  {
    key: 'substituted',
    label: 'Substituído',
    icon: <RefreshCw size={24} color={colors.warning} />,
    color: '#FEF3C7',
  },
  {
    key: 'not_found',
    label: 'Não Encontrado',
    icon: <XCircle size={24} color={colors.destructive} />,
    color: '#FEE2E2',
  },
];

export function ManualItemPickScreen({ navigation, route }: Props) {
  const { pickingOrderId, pickingItemId, productName, quantity } = route.params;
  const [status, setStatus] = useState<PickStatus | null>(null);
  const [substituteProduct, setSubstituteProduct] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!status) return;
    setLoading(true);
    try {
      await sellerApi.manualPickItem(pickingItemId, notes.trim() || undefined);
      Toast.show({ type: 'success', text1: 'Item atualizado' });
      navigation.goBack();
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao atualizar item' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Info */}
        <View style={styles.productCard}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.productQty}>Quantidade: {quantity}</Text>
        </View>

        {/* Status Selection */}
        <Text style={styles.sectionTitle}>Status do Item</Text>
        <View style={styles.statusOptions}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.statusCard,
                status === option.key && {
                  borderColor: option.key === 'picked'
                    ? colors.primary[500]
                    : option.key === 'substituted'
                      ? colors.warning
                      : colors.destructive,
                  backgroundColor: option.color,
                },
              ]}
              onPress={() => setStatus(option.key)}
            >
              {option.icon}
              <Text
                style={[
                  styles.statusLabel,
                  status === option.key && styles.statusLabelActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Substitute Product */}
        {status === 'substituted' && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Produto Substituto</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nome do produto substituto..."
              value={substituteProduct}
              onChangeText={setSubstituteProduct}
              placeholderTextColor={colors.gray[400]}
            />
          </View>
        )}

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Observações (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Adicione observações..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Confirmar"
          onPress={handleConfirm}
          disabled={!status || loading}
          loading={loading}
          style={
            status
              ? {
                  backgroundColor:
                    status === 'picked'
                      ? colors.primary[600]
                      : status === 'substituted'
                        ? colors.warning
                        : colors.destructive,
                }
              : undefined
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, gap: 20 },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    ...shadow.sm,
  },
  productName: { fontSize: 17, fontWeight: '600', color: colors.foreground },
  productQty: { fontSize: 14, color: colors.gray[500], marginTop: 4 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadow.sm,
  },
  statusLabel: { fontSize: 11, fontWeight: '500', color: colors.gray[600], textAlign: 'center' },
  statusLabelActive: { fontWeight: '700' },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: colors.foreground },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 15,
    color: colors.foreground,
  },
  textArea: { minHeight: 80 },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
