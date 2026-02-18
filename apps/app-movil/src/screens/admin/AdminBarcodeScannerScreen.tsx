import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CheckCircle, Package } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { productsApi } from '@/api';
import { useTheme } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminBarcodeScanner'>;

export function AdminBarcodeScannerScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setChecking(true);

    try {
      const response = await productsApi.getByBarcode(data);
      const product = response.data;

      // Product exists — go to edit
      Toast.show({
        type: 'info',
        text1: 'Produto encontrado',
        text2: product.name,
      });
      setTimeout(() => {
        navigation.replace('AdminProductForm', { productId: product.id });
      }, 800);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Product not found — go to create with barcode pre-filled
        Toast.show({
          type: 'info',
          text1: 'Código novo',
          text2: 'Criando produto com este código de barras',
        });
        setTimeout(() => {
          navigation.replace('AdminProductForm', { barcode: data });
        }, 800);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro ao buscar produto',
        });
        setScanned(false);
        setChecking(false);
      }
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Package size={48} color={colors.admin.primary} />
        <Text style={styles.permissionTitle}>Acesso à Câmera</Text>
        <Text style={styles.permissionText}>
          Precisamos de acesso à câmera para escanear códigos de barras dos produtos
        </Text>
        <Button title="Permitir Câmera" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={[styles.overlay, StyleSheet.absoluteFill]}>
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Escanear Produto</Text>
          <Text style={styles.headerSubtitle}>
            Escaneie o código de barras para editar ou cadastrar um produto
          </Text>
        </View>

        {/* Scan Area */}
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {checking && (
            <View style={styles.resultOverlay}>
              <ActivityIndicator size="large" color={colors.admin.primary} />
              <Text style={styles.checkingText}>Verificando...</Text>
            </View>
          )}
        </View>

        <Text style={styles.instruction}>
          Aponte a câmera para o código de barras
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.black },
    camera: { flex: 1 },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    headerInfo: {
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 30,
      alignItems: 'center',
      marginHorizontal: 24,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 6,
      textAlign: 'center',
      lineHeight: 18,
    },
    scanArea: {
      width: 280,
      height: 160,
      borderRadius: 12,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    corner: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: colors.admin.primary,
    },
    topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 12,
    },
    topRight: {
      top: 0,
      right: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 12,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 12,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 12,
    },
    resultOverlay: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkingText: {
      fontSize: 11,
      color: colors.admin.primary,
      marginTop: 4,
      fontWeight: '600',
    },
    instruction: {
      color: '#ffffff',
      fontSize: 14,
      marginTop: 24,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.white,
      padding: 24,
      gap: 12,
    },
    permissionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
    },
    permissionText: {
      fontSize: 15,
      color: colors.gray[600],
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 22,
    },
  });
