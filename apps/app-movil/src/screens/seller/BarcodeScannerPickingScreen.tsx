import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CheckCircle, XCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { sellerApi } from '@/api';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<
  SellerStackParamList,
  'BarcodeScannerPicking'
>;

export function BarcodeScannerPickingScreen({ navigation, route }: Props) {
  const { pickingOrderId, pickingItemId, expectedBarcode, productName } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<'match' | 'mismatch' | null>(null);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const isMatch = !expectedBarcode || data === expectedBarcode;

    if (isMatch) {
      setResult('match');
      try {
        await sellerApi.scanPickingItem(pickingOrderId, data);
        Toast.show({ type: 'success', text1: 'Item confirmado!' });
        setTimeout(() => navigation.goBack(), 1200);
      } catch {
        Toast.show({ type: 'error', text1: 'Erro ao confirmar item' });
        setScanned(false);
        setResult(null);
      }
    } else {
      setResult('mismatch');
      Alert.alert(
        'Código não confere',
        `Esperado: ${expectedBarcode}\nEscaneado: ${data}`,
        [
          {
            text: 'Tentar novamente',
            onPress: () => {
              setScanned(false);
              setResult(null);
            },
          },
          {
            text: 'Registro manual',
            onPress: () => {
              navigation.replace('ManualItemPick', {
                pickingOrderId,
                pickingItemId,
                productName,
                quantity: 1,
              });
            },
          },
        ]
      );
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Precisamos de acesso à câmera para escanear
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
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={[styles.overlay, StyleSheet.absoluteFill]}>
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{productName}</Text>
          {expectedBarcode && (
            <Text style={styles.expectedCode}>
              Código esperado: {expectedBarcode}
            </Text>
          )}
        </View>

        {/* Scan Area */}
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {result === 'match' && (
            <View style={styles.resultOverlay}>
              <CheckCircle size={60} color={colors.primary[500]} />
            </View>
          )}
          {result === 'mismatch' && (
            <View style={styles.resultOverlay}>
              <XCircle size={60} color={colors.destructive} />
            </View>
          )}
        </View>

        <Text style={styles.instruction}>
          Aponte para o código de barras do produto
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  productInfo: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  expectedCode: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
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
    borderColor: colors.primary[500],
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    color: colors.white,
    fontSize: 14,
    marginTop: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
});
