import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Save, X } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi, productsApi, categoriesApi } from '@/api';
import { getImageUrl } from '@/config';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminProductForm'>;

export function AdminProductFormScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const productId = route.params?.productId;
  const isEdit = !!productId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    costPrice: '',
    productRole: 'CONVENIENCIA',
    compareAtPrice: '',
    sku: '',
    barcode: '',
    stock: '',
    minStock: '',
    unit: 'un',
    weight: '',
    brand: '',
    isFeatured: false,
    isOrganic: false,
    status: 'ACTIVE',
    expiresAt: '',
  });

  useEffect(() => {
    loadCategories();
    if (isEdit) loadProduct();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesApi.getAll();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch {
      // Ignore
    }
  };

  const loadProduct = async () => {
    try {
      const { data } = await productsApi.getById(productId!);
      setForm({
        name: data.name || '',
        description: data.description || '',
        costPrice: data.costPrice ? String(data.costPrice) : '',
        productRole: data.productRole || 'CONVENIENCIA',
        compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : '',
        sku: data.sku || '',
        barcode: data.barcode || '',
        stock: String(data.stock ?? ''),
        minStock: String(data.minStock ?? ''),
        unit: data.unit || 'un',
        weight: data.weight ? String(data.weight) : '',
        brand: data.brand?.name || '',
        isFeatured: data.isFeatured || false,
        isOrganic: data.isOrganic || false,
        status: data.status || 'ACTIVE',
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().split('T')[0] : '',
      });
      setSelectedCategoryId(data.categoryId || '');
      if (data.images?.[0]?.url) {
        setImageUri(getImageUrl(data.images[0].url));
      } else if (data.mainImageUrl) {
        setImageUri(getImageUrl(data.mainImageUrl));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o produto');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleImageAction = () => {
    Alert.alert('Imagem do produto', 'Escolha uma opção', [
      { text: 'Câmera', onPress: takePhoto },
      { text: 'Galeria', onPress: pickImage },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Erro', 'Nome do produto é obrigatório');
      return;
    }
    if (!form.costPrice || isNaN(Number(form.costPrice))) {
      Alert.alert('Erro', 'Custo inválido');
      return;
    }
    if (!form.productRole) {
      Alert.alert('Erro', 'Rol estratégico é obrigatório');
      return;
    }

    setSaving(true);
    try {
      // Upload image if new local image
      let uploadedImageUrl: string | undefined;
      if (imageUri && !imageUri.startsWith('http')) {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        formData.append('file', {
          uri: imageUri,
          name: filename,
          type: mimeType,
        } as any);
        const { data: uploadData } = await adminApi.uploadImage(formData);
        uploadedImageUrl = uploadData.url || uploadData.path;
      }

      const productData: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        costPrice: Number(form.costPrice),
        productRole: form.productRole,
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        stock: form.stock ? Number(form.stock) : 0,
        minStock: form.minStock ? Number(form.minStock) : 5,
        unit: form.unit || 'un',
        weight: form.weight ? Number(form.weight) : undefined,
        isFeatured: form.isFeatured,
        isOrganic: form.isOrganic,
        status: form.status,
        categoryId: selectedCategoryId || undefined,
        expiresAt: form.expiresAt || undefined,
      };

      if (uploadedImageUrl) {
        productData.mainImageUrl = uploadedImageUrl;
      }

      if (isEdit) {
        await adminApi.updateProduct(productId!, productData);
        Alert.alert('Sucesso', 'Produto atualizado');
      } else {
        await adminApi.createProduct(productData);
        Alert.alert('Sucesso', 'Produto criado');
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
      {/* Image */}
      <TouchableOpacity style={styles.imageSection} onPress={handleImageAction}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Camera size={32} color={colors.gray[400]} />
            <Text style={styles.imagePlaceholderText}>Adicionar foto</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Form */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          placeholder="Nome do produto"
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          placeholder="Descrição do produto"
          multiline
          numberOfLines={3}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Custo (R$) *</Text>
            <TextInput
              style={styles.input}
              value={form.costPrice}
              onChangeText={(v) => setForm({ ...form, costPrice: v })}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Rol Estratégico *</Text>
            <View style={styles.statusRow}>
              {(['ANCLA', 'CONVENIENCIA', 'IMPULSO', 'PREMIUM'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.statusOption, form.productRole === r && styles.statusOptionActive, { flex: 1, marginHorizontal: 1 }]}
                  onPress={() => setForm({ ...form, productRole: r })}
                >
                  <Text style={[styles.statusOptionText, form.productRole === r && styles.statusOptionTextActive, { fontSize: 9 }]}>
                    {r === 'ANCLA' ? '⚓' : r === 'CONVENIENCIA' ? '🛒' : r === 'IMPULSO' ? '⚡' : '⭐'}
                    {'\n'}{r.slice(0, 4)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Pricing Preview (v1.1 — safe rounding) */}
        {form.costPrice && Number(form.costPrice) > 0 && form.productRole ? (() => {
          const cost = Number(form.costPrice);
          const bands = [{ max: 3, m: 0.30 }, { max: 15, m: 0.20 }, { max: 60, m: 0.15 }, { max: Infinity, m: 0.10 }];
          const adj: Record<string, number> = { ANCLA: -0.05, CONVENIENCIA: 0, IMPULSO: 0.10, PREMIUM: 0.03 };
          let margin = (bands.find(b => cost < b.max)?.m ?? 0.10) + (adj[form.productRole] ?? 0);
          margin = Math.max(0.08, Math.min(0.40, margin));
          const raw = cost * (1 + margin);
          let final: number;
          if (raw < 1) {
            final = Math.ceil(raw * 10) / 10;
          } else {
            const decimal = raw % 1;
            const intPart = Math.floor(raw);
            final = decimal <= 0.49 ? intPart + 0.59 : intPart + 0.99;
          }
          if (final <= cost) final = Number((Math.ceil(cost * 100) / 100 + 0.05).toFixed(2));
          final = Number(final.toFixed(2));
          const appliedMargin = ((final - cost) / cost) * 100;
          return (
            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#bbf7d0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>Preço Final (auto)</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#16a34a' }}>R$ {final.toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>Margem</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700' }}>{appliedMargin.toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          );
        })() : null}

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>SKU</Text>
            <TextInput
              style={styles.input}
              value={form.sku}
              onChangeText={(v) => setForm({ ...form, sku: v })}
              placeholder="SKU-001"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Código de barras</Text>
            <TextInput
              style={styles.input}
              value={form.barcode}
              onChangeText={(v) => setForm({ ...form, barcode: v })}
              placeholder="7891234567890"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Estoque</Text>
            <TextInput
              style={styles.input}
              value={form.stock}
              onChangeText={(v) => setForm({ ...form, stock: v })}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Estoque mínimo</Text>
            <TextInput
              style={styles.input}
              value={form.minStock}
              onChangeText={(v) => setForm({ ...form, minStock: v })}
              placeholder="5"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Unidade</Text>
            <TextInput
              style={styles.input}
              value={form.unit}
              onChangeText={(v) => setForm({ ...form, unit: v })}
              placeholder="un / kg / L"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Peso (g)</Text>
            <TextInput
              style={styles.input}
              value={form.weight}
              onChangeText={(v) => setForm({ ...form, weight: v })}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Expiration date */}
        <Text style={styles.label}>Data de Validade</Text>
        <TextInput
          style={styles.input}
          value={form.expiresAt}
          onChangeText={(v) => setForm({ ...form, expiresAt: v })}
          placeholder="AAAA-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
        {form.expiresAt !== '' && new Date(form.expiresAt) < new Date() && (
          <Text style={{ color: '#dc2626', fontSize: 13, marginTop: -8, marginBottom: 8 }}>
            ⚠ Este produto já está vencido!
          </Text>
        )}

        {/* Category picker */}
        <Text style={styles.label}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategoryId && styles.categoryChipActive]}
            onPress={() => setSelectedCategoryId('')}
          >
            <Text style={[styles.categoryChipText, !selectedCategoryId && styles.categoryChipTextActive]}>
              Nenhuma
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status */}
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {['ACTIVE', 'INACTIVE'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusOption, form.status === s && styles.statusOptionActive]}
              onPress={() => setForm({ ...form, status: s })}
            >
              <Text style={[styles.statusOptionText, form.status === s && styles.statusOptionTextActive]}>
                {s === 'ACTIVE' ? 'Ativo' : 'Inativo'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Destaque</Text>
          <Switch
            value={form.isFeatured}
            onValueChange={(v) => setForm({ ...form, isFeatured: v })}
            trackColor={{ true: colors.admin.primary }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Orgânico</Text>
          <Switch
            value={form.isOrganic}
            onValueChange={(v) => setForm({ ...form, isOrganic: v })}
            trackColor={{ true: colors.admin.primary }}
          />
        </View>

        {/* Save */}
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
              <Text style={styles.saveButtonText}>{isEdit ? 'Atualizar' : 'Criar'} Produto</Text>
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
  imageSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.white,
  },
  productImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: colors.gray[400],
    marginTop: 8,
  },
  formSection: {
    padding: 16,
  },
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  categoryScroll: {
    marginBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.admin.primary,
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: colors.admin.primary,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  statusOptionTextActive: {
    color: colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    fontSize: 15,
    color: colors.foreground,
  },
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
