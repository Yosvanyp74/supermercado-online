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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Save } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi } from '@/api';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminSupplierForm'>;

export function AdminSupplierFormScreen({ navigation, route }: Props) {
  const supplierId = route.params?.supplierId;
  const isEdit = !!supplierId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    cnpj: '',
    notes: '',
  });

  useEffect(() => {
    if (isEdit) loadSupplier();
  }, []);

  const loadSupplier = async () => {
    try {
      const { data } = await adminApi.getSupplier(supplierId!);
      setForm({
        name: data.name || data.companyName || '',
        contactName: data.contactName || data.contact || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        cnpj: data.cnpj || data.taxId || '',
        notes: data.notes || '',
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o fornecedor');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        contactName: form.contactName.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        cnpj: form.cnpj.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (isEdit) {
        await adminApi.updateSupplier(supplierId!, payload);
        Alert.alert('Sucesso', 'Fornecedor atualizado');
      } else {
        await adminApi.createSupplier(payload);
        Alert.alert('Sucesso', 'Fornecedor criado');
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
        <Text style={styles.label}>Nome da empresa *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          placeholder="Empresa LTDA"
        />

        <Text style={styles.label}>Nome do contato</Text>
        <TextInput
          style={styles.input}
          value={form.contactName}
          onChangeText={(v) => setForm({ ...form, contactName: v })}
          placeholder="João Silva"
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          placeholder="contato@empresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={(v) => setForm({ ...form, phone: v })}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>CNPJ</Text>
        <TextInput
          style={styles.input}
          value={form.cnpj}
          onChangeText={(v) => setForm({ ...form, cnpj: v })}
          placeholder="00.000.000/0000-00"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Endereço</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.address}
          onChangeText={(v) => setForm({ ...form, address: v })}
          placeholder="Endereço completo"
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Observações</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.notes}
          onChangeText={(v) => setForm({ ...form, notes: v })}
          placeholder="Notas sobre o fornecedor..."
          multiline
          numberOfLines={3}
        />

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
              <Text style={styles.saveButtonText}>
                {isEdit ? 'Atualizar' : 'Criar'} Fornecedor
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { padding: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 6,
    marginTop: 12,
  },
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
  textArea: { minHeight: 70, textAlignVertical: 'top' },
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
  saveButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
