import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Scan, Edit3 } from 'lucide-react-native';
import { Button } from '@/components';
import { getImageUrl } from '@/config';
import { PickingItem } from './OrderPickingScreen';

export function getStatusIcon(status: PickingItem['status']) {
  switch (status) {
    case 'picked':
      return <Text>✓</Text>;
    case 'substituted':
      return <Text>↺</Text>;
    case 'not_found':
      return <Text>✗</Text>;
    default:
      return <Text>○</Text>;
  }
}

export function getStatusColor(status: PickingItem['status'], colors: any) {
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
}

export default function PickingItemRow({ item, pickedQty, onQtyChange, onConfirmQty, colors, styles, handleScanItem, handleManualPick }: {
  item: PickingItem;
  pickedQty: number;
  onQtyChange: (qty: number) => void;
  onConfirmQty: () => void;
  colors: any;
  styles: any;
  handleScanItem: (item: PickingItem) => void;
  handleManualPick: (item: PickingItem) => void;
}) {
  const imageUri = getImageUrl(item.image);
  return (
    <View style={[styles.itemCard, { backgroundColor: getStatusColor(item.status, colors) }]}> 
      <View style={styles.statusIcon}>{getStatusIcon(item.status)}</View>
      {item.image ? (
        <Image source={{ uri: imageUri! }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.placeholder]}>
          <Text style={styles.placeholderText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemQty}>Qtd: {item.quantity}</Text>
        {item.substituteProduct && (<Text style={styles.subNote}>Sub: {item.substituteProduct}</Text>)}
        {item.notes && (<Text style={styles.itemNotes}>{item.notes}</Text>)}
      </View>
      {item.status === 'pending' && (
        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.scanBtn} onPress={() => handleScanItem(item)}>
            <Scan size={18} color={colors.seller.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualBtn} onPress={() => handleManualPick(item)}>
            <Edit3 size={18} color={colors.gray[600]} />
          </TouchableOpacity>
          {/* Selector de cantidad y botón de confirmar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
            <TouchableOpacity onPress={() => onQtyChange(Math.max(1, pickedQty - 1))} style={{ padding: 8 }}>
              <Text style={{ fontSize: 20 }}>-</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, minWidth: 32, textAlign: 'center' }}>{pickedQty}</Text>
            <TouchableOpacity onPress={() => onQtyChange(Math.min(item.quantity, pickedQty + 1))} style={{ padding: 8 }}>
              <Text style={{ fontSize: 20 }}>+</Text>
            </TouchableOpacity>
            <Button
              title="Confirmar"
              onPress={onConfirmQty}
              style={{ marginLeft: 8, backgroundColor: colors.primary[500], paddingHorizontal: 12 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
