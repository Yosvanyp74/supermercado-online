import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { ProfileStackParamList } from '@/navigation/types';
import { Button, Input } from '@/components';
import { useAuthStore } from '@/store';
import { usersApi } from '@/api';
import { colors } from '@/theme';
import { getImageUrl } from '@/config/env';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const currentAvatarUrl = avatarUri || (user?.avatarUrl ? getImageUrl(user.avatarUrl) : null);

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar fotos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAvatarUri(asset.uri);
        await uploadAvatar(asset.uri);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao selecionar imagem' });
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploadingAvatar(true);
    try {
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const { data: uploadData } = await usersApi.uploadAvatar(formData);
      const { data: updatedUser } = await usersApi.updateProfile({ avatarUrl: uploadData.url });
      setUser(updatedUser);
      Toast.show({ type: 'success', text1: 'Foto atualizada!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao enviar foto' });
      setAvatarUri(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) pickImage('camera');
          else if (index === 2) pickImage('gallery');
        },
      );
    } else {
      Alert.alert('Alterar Foto', 'Escolha uma opção', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tirar Foto', onPress: () => pickImage('camera') },
        { text: 'Escolher da Galeria', onPress: () => pickImage('gallery') },
      ]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.updateProfile({ firstName, lastName, phone });
      setUser(data);
      Toast.show({ type: 'success', text1: 'Perfil atualizado!' });
      navigation.goBack();
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao atualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <TouchableOpacity
        style={styles.avatarSection}
        onPress={showImageOptions}
        activeOpacity={0.7}
        disabled={uploadingAvatar}
      >
        {currentAvatarUrl ? (
          <Image source={{ uri: currentAvatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.cameraIcon}>
          <Camera size={16} color={colors.white} />
        </View>
        {uploadingAvatar && (
          <View style={styles.avatarOverlay}>
            <Text style={styles.avatarOverlayText}>Enviando...</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.changePhotoText}>Toque para alterar a foto</Text>

      <Input label="Nome" value={firstName} onChangeText={setFirstName} />
      <Input label="Sobrenome" value={lastName} onChangeText={setLastName} />
      <Input label="Email" value={user?.email || ''} editable={false} />
      <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Button title="Salvar" onPress={handleSave} loading={loading} fullWidth size="lg" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 16 },
  avatarSection: {
    alignSelf: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlayText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  changePhotoText: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 20,
  },
});
