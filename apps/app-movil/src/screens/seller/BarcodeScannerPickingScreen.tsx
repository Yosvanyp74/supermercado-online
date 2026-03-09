import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CheckCircle, XCircle, Minus, Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Button } from '@/components';
import { sellerApi } from '@/api';
import { useTheme } from '@/theme';

type Props = NativeStackScreenProps<
  SellerStackParamList,
  'BarcodeScannerPicking'
>;

export function BarcodeScannerPickingScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { pickingOrderId, pickingItemId, expectedBarcode, productName, requiredQuantity } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'match' | 'mismatch' | null>(null);
  // Quantity confirmation step
  const [confirming, setConfirming] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [confirmedQty, setConfirmedQty] = useState(requiredQuantity);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);

    const isMatch = !expectedBarcode || data === expectedBarcode;

    if (!isMatch) {
      setResult('mismatch');
      Alert.alert(
        'Código não confere',
        `Esperado: ${expectedBarcode}\nEscaneado: ${data}`,
        [
          {
            text: 'Tentar novamente',
            onPress: () => { setScanned(false); setResult(null); },
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
      return;
    }

    // Barcode matched — enter quantity confirmation step
    setScannedBarcode(data);
    setConfirmedQty(requiredQuantity);
    setConfirming(true);
  };

  const handleConfirmQuantity = async () => {
    setLoading(true);
    try {
      const response = await sellerApi.scanPickingItem(pickingOrderId, scannedBarcode, confirmedQty);
      if (response.data?.success === false) {
        Alert.alert('Atenção', response.data.message ?? 'Item não encontrado', [
          {
            text: 'OK',
            onPress: () => {
              setConfirming(false);
              setScanned(false);
              setResult(null);
            },
          },
        ]);
      } else {
        setResult('match');
        Toast.show({ type: 'success', text1: `✓ ${confirmedQty} unidade(s) coletada(s)!` });
        setTimeout(() => navigation.navigate('OrderPicking', { pickingOrderId }), 1000);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao registrar item';
      Alert.alert('Erro', msg, [
        {
          text: 'OK',
          onPress: () => {
            setConfirming(false);
            setScanned(false);
            setResult(null);
          },
        },
      ]);
    } finally {
      setLoading(false);
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

  // ── Step 2: Quantity Confirmation Screen ──────────────────────────
  if (confirming) {
    return (
      <View style={styles.confirmContainer}>
        <CheckCircle size={56} color={colors.primary[500]} style={styles.confirmIcon} />
        <Text style={styles.confirmTitle}>Código confirmado!</Text>
        <Text style={styles.confirmProduct}>{productName}</Text>

        <View style={styles.qtyBox}>
          <Text style={styles.qtyLabel}>
            Unidades solicitadas: <Text style={styles.qtyRequired}>{requiredQuantity}</Text>
          </Text>
          <Text style={styles.qtyLabel}>Quantidade coletada:</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, confirmedQty <= 1 && styles.qtyBtnDisabled]}
              onPress={() => setConfirmedQty(q => Math.max(1, q - 1))}
              disabled={confirmedQty <= 1}
            >
              <Minus size={20} color={confirmedQty <= 1 ? colors.gray[400] : colors.primary[500]} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{confirmedQty}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, confirmedQty >= requiredQuantity && styles.qtyBtnDisabled]}
              onPress={() => setConfirmedQty(q => Math.min(requiredQuantity, q + 1))}
              disabled={confirmedQty >= requiredQuantity}
            >
              <Plus size={20} color={confirmedQty >= requiredQuantity ? colors.gray[400] : colors.primary[500]} />
            </TouchableOpacity>
          </View>
          {confirmedQty < requiredQuantity && (
            <Text style={styles.qtyWarning}>
              ⚠️ Coletando menos do que o pedido
            </Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 24 }} />
        ) : result === 'match' ? (
          <CheckCircle size={48} color={colors.primary[500]} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.confirmActions}>
            <Button
              title={`Confirmar ${confirmedQty} unidade(s)`}
              onPress={handleConfirmQuantity}
            />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setConfirming(false); setScanned(false); }}
            >
              <Text style={styles.cancelText}>Voltar e escanear novamente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── Step 1: Camera / Barcode Scanner ─────────────────────────────
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
          <Text style={styles.productQtyHint}>Qtd. solicitada: {requiredQuantity}</Text>
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

const createStyles = (colors: any) => StyleSheet.create({
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
  productQtyHint: {
    fontSize: 13,
    color: colors.primary[300],
    marginTop: 4,
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
    top: 0, left: 0,
    borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12,
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
  // ── Confirmation screen styles ──────────────────────
  confirmContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmIcon: {
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 6,
  },
  confirmProduct: {
    fontSize: 16,
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: 28,
  },
  qtyBox: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  qtyLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 8,
  },
  qtyRequired: {
    fontWeight: '700',
    color: colors.gray[800],
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    gap: 20,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: {
    borderColor: colors.gray[300],
  },
  qtyValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray[900],
    minWidth: 48,
    textAlign: 'center',
  },
  qtyWarning: {
    fontSize: 12,
    color: colors.warning ?? '#f59e0b',
    marginTop: 4,
    textAlign: 'center',
  },
  confirmActions: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 14,
    color: colors.gray[500],
    textDecorationLine: 'underline',
  },
});
