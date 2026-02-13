import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { ProfileStackParamList } from '@/navigation/types';
import { Button, Input } from '@/components';
import { useAuthStore } from '@/store';
import { usersApi } from '@/api';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AddAddress'>;

export function AddAddressScreen({ navigation, route }: Props) {
  const { user } = useAuthStore();
  const existingAddress = route.params?.address;

  const [label, setLabel] = useState(existingAddress?.label || '');
  const [street, setStreet] = useState(existingAddress?.street || '');
  const [number, setNumber] = useState(existingAddress?.number || '');
  const [complement, setComplement] = useState(existingAddress?.complement || '');
  const [neighborhood, setNeighborhood] = useState(existingAddress?.neighborhood || '');
  const [city, setCity] = useState(existingAddress?.city || '');
  const [state, setState] = useState(existingAddress?.state || '');
  const [zipCode, setZipCode] = useState(existingAddress?.zipCode || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!street.trim()) newErrors.street = 'Rua é obrigatória';
    if (!number.trim()) newErrors.number = 'Número é obrigatório';
    if (!neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!state.trim()) newErrors.state = 'Estado é obrigatório';
    if (!zipCode.trim()) newErrors.zipCode = 'CEP é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user?.id) return;
    setLoading(true);
    try {
      const addressData = {
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        label: label.trim() || undefined,
        isDefault: false,
      };

      if (existingAddress?.id) {
        await usersApi.updateAddress(user.id, existingAddress.id, addressData);
        Toast.show({ type: 'success', text1: 'Endereço atualizado!' });
      } else {
        await usersApi.addAddress(user.id, addressData);
        Toast.show({ type: 'success', text1: 'Endereço adicionado!' });
      }
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar endereço',
        text2: err?.response?.data?.message || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Apelido (opcional)"
          placeholder="Ex: Casa, Trabalho"
          value={label}
          onChangeText={setLabel}
        />

        <Input
          label="CEP"
          placeholder="00000-000"
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="numeric"
          error={errors.zipCode}
        />

        <Input
          label="Rua"
          placeholder="Nome da rua"
          value={street}
          onChangeText={setStreet}
          error={errors.street}
        />

        <View style={styles.row}>
          <View style={styles.smallField}>
            <Input
              label="Número"
              placeholder="Nº"
              value={number}
              onChangeText={setNumber}
              keyboardType="numeric"
              error={errors.number}
            />
          </View>
          <View style={styles.largeField}>
            <Input
              label="Complemento"
              placeholder="Apto, Bloco..."
              value={complement}
              onChangeText={setComplement}
            />
          </View>
        </View>

        <Input
          label="Bairro"
          placeholder="Nome do bairro"
          value={neighborhood}
          onChangeText={setNeighborhood}
          error={errors.neighborhood}
        />

        <View style={styles.row}>
          <View style={styles.largeField}>
            <Input
              label="Cidade"
              placeholder="Cidade"
              value={city}
              onChangeText={setCity}
              error={errors.city}
            />
          </View>
          <View style={styles.smallField}>
            <Input
              label="Estado"
              placeholder="UF"
              value={state}
              onChangeText={setState}
              maxLength={2}
              autoCapitalize="characters"
              error={errors.state}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={existingAddress?.id ? 'Atualizar Endereço' : 'Salvar Endereço'}
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  smallField: {
    flex: 1,
  },
  largeField: {
    flex: 2,
  },
  buttonContainer: {
    marginTop: 16,
  },
});
