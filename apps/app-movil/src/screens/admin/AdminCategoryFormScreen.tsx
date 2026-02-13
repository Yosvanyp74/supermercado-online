import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Save } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi, categoriesApi } from '@/api';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminCategoryForm'>;

export function AdminCategoryFormScreen({ navigation, route }: Props) {
  const categoryId = route.params?.categoryId;
  const isEdit = !!categoryId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isEdit) loadCategory();
  }, []);

  const loadCategory = async () => {
    try {
      const { data } = await categoriesApi.getById(categoryId!);
      setName(data.name || '');
      setDescription(data.description || '');
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a categoria');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const data = { name: name.trim(), description: description.trim() || undefined };
      if (isEdit) {
        await adminApi.updateCategory(categoryId!, data);
        Alert.alert('Sucesso', 'Categoria atualizada');
      } else {
        await adminApi.createCategory(data);
        Alert.alert('Sucesso', 'Categoria criada');
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
        <Text style={styles.label}>Nome *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome da categoria" />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descrição da categoria"
          multiline
          numberOfLines={3}
        />

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
              <Text style={styles.saveButtonText}>{isEdit ? 'Atualizar' : 'Criar'} Categoria</Text>
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
