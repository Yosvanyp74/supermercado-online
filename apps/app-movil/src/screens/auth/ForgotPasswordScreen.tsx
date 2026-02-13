import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Mail, ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AuthStackParamList } from '@/navigation/types';
import { Button, Input } from '@/components';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      Toast.show({ type: 'error', text1: 'Informe um email válido' });
      return;
    }
    setLoading(true);
    try {
      // API call would go here
      setSent(true);
      Toast.show({
        type: 'success',
        text1: 'Email enviado!',
        text2: 'Verifique sua caixa de entrada',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível enviar o email',
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Esqueceu a senha?</Text>
          <Text style={styles.subtitle}>
            {sent
              ? 'Enviamos um link de recuperação para o seu email.'
              : 'Informe seu email e enviaremos um link de recuperação.'}
          </Text>
        </View>

        {!sent && (
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={20} color={colors.gray[400]} />}
            />

            <Button
              title="Enviar Link"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        )}

        {sent && (
          <Button
            title="Voltar ao Login"
            onPress={() => navigation.navigate('Login')}
            fullWidth
            size="lg"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
    lineHeight: 22,
  },
  form: {
    gap: 8,
  },
});
