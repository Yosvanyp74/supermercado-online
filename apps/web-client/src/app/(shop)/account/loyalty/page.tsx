'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Star, Gift, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { loyaltyApi } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function LoyaltyPage() {
  const { data: account, isLoading: loadingAccount } = useQuery({
    queryKey: ['loyaltyAccount'],
    queryFn: async () => {
      const res = await loyaltyApi.getAccount();
      return res.data;
    },
  });

  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ['loyaltyTransactions'],
    queryFn: async () => {
      const res = await loyaltyApi.getTransactions();
      return res.data;
    },
  });

  const { data: rewardsData } = useQuery({
    queryKey: ['loyaltyRewards'],
    queryFn: async () => {
      const res = await loyaltyApi.getRewards();
      return res.data;
    },
  });

  const redeemMutation = useMutation({
    mutationFn: (rewardId: string) => loyaltyApi.redeemPoints(rewardId),
    onSuccess: () => toast.success('Pontos resgatados com sucesso!'),
    onError: () => toast.error('Pontos insuficientes ou erro ao resgatar'),
  });

  const transactions = Array.isArray(transactionsData) ? transactionsData : transactionsData?.data || [];
  const rewards = Array.isArray(rewardsData) ? rewardsData : rewardsData?.data || [];

  if (loadingAccount) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Balance */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Seus pontos</p>
              <p className="text-4xl font-bold text-primary">{account?.points || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Nível: <span className="font-medium text-foreground">{account?.tier || 'Bronze'}</span>
              </p>
            </div>
            <Star className="h-16 w-16 text-primary/20" />
          </div>
        </CardContent>
      </Card>

      {/* Rewards */}
      {rewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Recompensas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {rewards.map((reward: any) => (
                <div key={reward.id} className="p-4 rounded-lg border space-y-2">
                  <p className="font-medium">{reward.name}</p>
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="secondary">{reward.pointsCost} pontos</Badge>
                    <Button
                      size="sm"
                      onClick={() => redeemMutation.mutate(reward.id)}
                      disabled={
                        (account?.points || 0) < reward.pointsCost || redeemMutation.isPending
                      }
                    >
                      Resgatar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Pontos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma transação registrada</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {tx.points > 0 ? (
                      <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <ArrowDownRight className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
