import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { ProfileStackParamList } from '@/navigation/types';
import { Button, Input } from '@/components';
import { useAuthStore } from '@/store';
import { usersApi } from '@/api';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

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
});
