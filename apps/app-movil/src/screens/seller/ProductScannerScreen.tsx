import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Search, Keyboard } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { sellerApi } from '@/api';
import { useSellerStore } from '@/store';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'ProductScanner'>;

export function ProductScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [barcode, setBarcode] = useState('');
  const { addProduct } = useSellerStore();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const { data: product } = await sellerApi.getProductByBarcode(data);
      addProduct({
        productId: product.id,
        name: product.name,
        price: product.price,
        barcode: data,
        image: product.images?.[0],
      });
      Toast.show({ type: 'success', text1: `${product.name} adicionado` });
      setTimeout(() => setScanned(false), 1500);
    } catch {
      Alert.alert('Produto não encontrado', `Código: ${data}`);
      setScanned(false);
    }
  };

  const handleManualSearch = async () => {
    if (!barcode.trim()) return;
    try {
      const { data: product } = await sellerApi.getProductByBarcode(barcode.trim());
      addProduct({
        productId: product.id,
        name: product.name,
        price: product.price,
        barcode: barcode.trim(),
        image: product.images?.[0],
      });
      Toast.show({ type: 'success', text1: `${product.name} adicionado` });
      setBarcode('');
    } catch {
      Toast.show({ type: 'error', text1: 'Produto não encontrado' });
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Precisamos de acesso à câmera para escanear códigos de barras
        </Text>
        <Button title="Permitir Câmera" onPress={requestPermission} />
        <Button
          title="Digitar Código Manual"
          onPress={() => setManualMode(true)}
          variant="outline"
          style={{ marginTop: 12 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!manualMode ? (
        <>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanText}>
                Aponte para o código de barras
              </Text>
            </View>
          </CameraView>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setManualMode(true)}
          >
            <Keyboard size={20} color={colors.white} />
            <Text style={styles.manualButtonText}>Digitar código</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.manualContainer}>
          <Text style={styles.manualTitle}>Código de Barras</Text>
          <View style={styles.manualInput}>
            <TextInput
              style={styles.input}
              placeholder="Digite o código..."
              value={barcode}
              onChangeText={setBarcode}
              keyboardType="number-pad"
              autoFocus
              placeholderTextColor={colors.gray[400]}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleManualSearch}
            >
              <Search size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Button
            title="Usar Câmera"
            onPress={() => setManualMode(false)}
            variant="outline"
            style={{ marginTop: 16 }}
          />
        </View>
      )}
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanArea: {
    width: 280,
    height: 160,
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary[500],
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanText: {
    color: colors.white,
    fontSize: 14,
    marginTop: 20,
  },
  manualButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  manualButtonText: { color: colors.white, fontSize: 14, fontWeight: '500' },
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
  manualContainer: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 24,
    justifyContent: 'center',
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
    textAlign: 'center',
  },
  manualInput: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    color: colors.foreground,
  },
  searchButton: {
    backgroundColor: colors.seller.primary,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
