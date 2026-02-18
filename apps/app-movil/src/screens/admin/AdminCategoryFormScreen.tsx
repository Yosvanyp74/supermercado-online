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
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Save, Camera, X, ImageIcon } from 'lucide-react-native';
import { AdminStackParamList } from '@/navigation/types';
import { adminApi, categoriesApi } from '@/api';
import { getImageUrl } from '@/config';
import { shadow, useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminCategoryForm'>;

export function AdminCategoryFormScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const categoryId = route.params?.categoryId;
  const isEdit = !!categoryId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) loadCategory();
  }, []);

  const loadCategory = async () => {
    try {
      const { data } = await categoriesApi.getById(categoryId!);
      setName(data.name || '');
      setDescription(data.description || '');
      if (data.imageUrl) {
        setImageUri(getImageUrl(data.imageUrl));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a categoria');
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
    Alert.alert('Imagem da categoria', 'Escolha uma opção', [
      { text: 'Câmera', onPress: takePhoto },
      { text: 'Galeria', onPress: pickImage },
      ...(imageUri ? [{ text: 'Remover', style: 'destructive' as const, onPress: () => setImageUri(null) }] : []),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }
    setSaving(true);
    try {
      // Upload image if new local file
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

      const data: { name: string; description?: string; imageUrl?: string } = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      if (uploadedImageUrl) {
        data.imageUrl = uploadedImageUrl;
      } else if (imageUri === null) {
        // Image was removed
        data.imageUrl = '';
      }

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
        {/* Image picker */}
        <Text style={styles.label}>Imagem</Text>
        <TouchableOpacity
          style={[styles.imageContainer, shadow.sm]}
          onPress={handleImageAction}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <X size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Camera size={32} color={colors.gray[400]} />
              <Text style={styles.imagePlaceholderText}>Toque para adicionar imagem</Text>
              <Text style={styles.imagePlaceholderHint}>Câmera ou galeria</Text>
            </View>
          )}
        </TouchableOpacity>

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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  imageContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[500],
  },
  imagePlaceholderHint: {
    fontSize: 12,
    color: colors.gray[400],
  },
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
