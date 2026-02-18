import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Star, Gift, Trophy } from 'lucide-react-native';
import { ProfileStackParamList } from '@/navigation/types';
import { Button, Loading, Badge } from '@/components';
import { loyaltyApi } from '@/api';
import { shadow, useTheme } from '@/theme';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Loyalty'>;

export function LoyaltyScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ptsRes, histRes, rewRes] = await Promise.all([
        loyaltyApi.getPoints(),
        loyaltyApi.getHistory().catch(() => ({ data: [] })),
        loyaltyApi.getRewards().catch(() => ({ data: [] })),
      ]);
      setPoints(ptsRes.data?.points || 0);
      setHistory(histRes.data || []);
      setRewards(rewRes.data || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (points < cost) {
      Toast.show({ type: 'error', text1: 'Pontos insuficientes' });
      return;
    }
    try {
      await loyaltyApi.redeem({ points: cost, rewardId });
      setPoints((p) => p - cost);
      Toast.show({ type: 'success', text1: 'Recompensa resgatada!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao resgatar' });
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.pointsCard, shadow.md]}>
        <Trophy size={32} color={colors.white} />
        <Text style={styles.pointsLabel}>Seus Pontos</Text>
        <Text style={styles.pointsValue}>{points}</Text>
      </View>

      {rewards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recompensas Disponíveis</Text>
          {rewards.map((reward: any) => (
            <View key={reward.id} style={[styles.rewardCard, shadow.sm]}>
              <View style={styles.rewardInfo}>
                <Gift size={20} color={colors.primary[600]} />
                <View style={styles.rewardText}>
                  <Text style={styles.rewardName}>{reward.name}</Text>
                  <Text style={styles.rewardCost}>{reward.points} pontos</Text>
                </View>
              </View>
              <Button
                title="Resgatar"
                onPress={() => handleRedeem(reward.id, reward.points)}
                size="sm"
                disabled={points < reward.points}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum histórico</Text>
        ) : (
          history.slice(0, 20).map((entry: any, idx: number) => (
            <View key={idx} style={styles.historyItem}>
              <View>
                <Text style={styles.historyDesc}>
                  {entry.description || entry.type}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Text
                style={[
                  styles.historyPoints,
                  entry.points > 0 ? styles.positive : styles.negative,
                ]}
              >
                {entry.points > 0 ? '+' : ''}{entry.points}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  pointsCard: {
    backgroundColor: colors.primary[600],
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  pointsLabel: { fontSize: 14, color: colors.primary[100], marginTop: 8 },
  pointsValue: { fontSize: 48, fontWeight: '700', color: colors.white },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  rewardCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rewardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  rewardText: { flex: 1 },
  rewardName: { fontSize: 15, fontWeight: '500', color: colors.foreground },
  rewardCost: { fontSize: 13, color: colors.primary[600], marginTop: 2 },
  historyItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDesc: { fontSize: 14, color: colors.gray[700] },
  historyDate: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  historyPoints: { fontSize: 16, fontWeight: '700' },
  positive: { color: colors.success },
  negative: { color: colors.destructive },
  emptyText: { fontSize: 14, color: colors.gray[400], textAlign: 'center' },
});
