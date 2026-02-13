import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { getImageUrl } from '@/config';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  CheckCircle,
  Circle,
  Scan,
  Edit3,
  XCircle,
  RefreshCw,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SellerStackParamList } from '@/navigation/types';
import { Button, Loading } from '@/components';
import { sellerApi } from '@/api';
import { colors, shadow } from '@/theme';

type Props = NativeStackScreenProps<SellerStackParamList, 'OrderPicking'>;

interface PickingItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  image?: string;
  barcode?: string;
  status: 'pending' | 'picked' | 'substituted' | 'not_found';
  substituteProduct?: string;
  notes?: string;
}

export function OrderPickingScreen({ navigation, route }: Props) {
  const { pickingOrderId } = route.params;
  const [items, setItems] = useState<PickingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderItems();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrderItems();
    }, [pickingOrderId])
  );

  const loadOrderItems = async () => {
    try {
      const { data } = await sellerApi.getPickingOrder(pickingOrderId);
      const pickingItems: PickingItem[] = (data.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        name: item.product?.name || 'Produto',
        quantity: item.quantity,
        image: item.product?.images?.[0]?.url || item.product?.mainImageUrl,
        barcode: item.product?.barcode,
        status: item.isPicked ? 'picked' : 'pending',
        notes: item.notes,
      }));
      setItems(pickingItems);
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao carregar itens' });
    } finally {
      setLoading(false);
    }
  };

  const pickedCount = items.filter(
    (i) => i.status === 'picked' || i.status === 'substituted'
  ).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? pickedCount / totalCount : 0;

  const allDone = items.length > 0 && items.every((i) => i.status !== 'pending');

  const handleScanItem = (item: PickingItem) => {
    navigation.navigate('BarcodeScannerPicking', {
      pickingOrderId,
      pickingItemId: item.id,
      expectedBarcode: item.barcode,
      productName: item.name,
    });
  };

  const handleManualPick = (item: PickingItem) => {
    navigation.navigate('ManualItemPick', {
      pickingOrderId,
      pickingItemId: item.id,
      productName: item.name,
      quantity: item.quantity,
    });
  };

  const handleComplete = () => {
    const notFound = items.filter((i) => i.status === 'not_found').length;
    const subs = items.filter((i) => i.status === 'substituted').length;

    let message = 'Confirmar conclusão da separação?';
    if (notFound > 0)
      message += `\n${notFound} item(ns) não encontrado(s)`;
    if (subs > 0) message += `\n${subs} substituição(ões)`;

    Alert.alert('Concluir Separação', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Concluir',
        onPress: () =>
          navigation.navigate('OrderCompletion', { pickingOrderId }),
      },
    ]);
  };

  const getStatusIcon = (status: PickingItem['status']) => {
    switch (status) {
      case 'picked':
        return <CheckCircle size={22} color={colors.primary[500]} />;
      case 'substituted':
        return <RefreshCw size={22} color={colors.warning} />;
      case 'not_found':
        return <XCircle size={22} color={colors.destructive} />;
      default:
        return <Circle size={22} color={colors.gray[300]} />;
    }
  };

  const getStatusColor = (status: PickingItem['status']) => {
    switch (status) {
      case 'picked':
        return colors.primary[50];
      case 'substituted':
        return '#FEF3C7';
      case 'not_found':
        return '#FEE2E2';
      default:
        return colors.white;
    }
  };

  if (loading) return <Loading />;

  const renderItem = ({ item }: { item: PickingItem }) => {
    const imageUri = getImageUrl(item.image);

    return (
      <View
        style={[
          styles.itemCard,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <View style={styles.statusIcon}>{getStatusIcon(item.status)}</View>

        {item.image ? (
          <Image source={{ uri: imageUri! }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemQty}>Qtd: {item.quantity}</Text>
          {item.substituteProduct && (
            <Text style={styles.subNote}>Sub: {item.substituteProduct}</Text>
          )}
          {item.notes && (
            <Text style={styles.itemNotes}>{item.notes}</Text>
          )}
        </View>

        {item.status === 'pending' && (
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => handleScanItem(item)}
            >
              <Scan size={18} color={colors.seller.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualBtn}
              onPress={() => handleManualPick(item)}
            >
              <Edit3 size={18} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progresso</Text>
          <Text style={styles.progressCount}>
            {pickedCount}/{totalCount}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {/* Complete Button */}
      {allDone && (
        <View style={styles.footer}>
          <Button
            title="Concluir Separação"
            onPress={handleComplete}
            icon={<CheckCircle size={20} color={colors.white} />}
            style={{ backgroundColor: colors.primary[600] }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  progressContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, color: colors.gray[500] },
  progressCount: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  list: { padding: 16, gap: 8 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    ...shadow.sm,
  },
  statusIcon: { width: 28 },
  itemImage: { width: 48, height: 48, borderRadius: 8 },
  placeholder: {
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 16, fontWeight: '600', color: colors.gray[400] },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500', color: colors.foreground },
  itemQty: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  subNote: {
    fontSize: 11,
    color: colors.warning,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemNotes: { fontSize: 11, color: colors.gray[400], marginTop: 2 },
  itemActions: { gap: 6 },
  scanBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.seller.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
