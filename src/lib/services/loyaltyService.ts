import { supabase } from '../supabase/config';
import { Database } from '../../types/supabase';

type LoyaltyAccount = Database['public']['Tables']['loyalty_accounts']['Row'];
type PointsTransaction = Database['public']['Tables']['points_transactions']['Row'];

interface RewardOption {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  requiredTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

const REWARD_OPTIONS: RewardOption[] = [
  {
    id: 'SEAT_UPGRADE',
    name: 'Cabin Upgrade',
    description: 'Upgrade to the next cabin class',
    pointsCost: 25000,
    requiredTier: 'SILVER'
  },
  {
    id: 'LOUNGE_ACCESS',
    name: 'Airport Lounge Access',
    description: 'One-time airport lounge access',
    pointsCost: 15000,
    requiredTier: 'BRONZE'
  },
  {
    id: 'EXTRA_BAGGAGE',
    name: 'Extra Baggage Allowance',
    description: '+23kg baggage allowance',
    pointsCost: 10000,
    requiredTier: 'BRONZE'
  },
  {
    id: 'PRIORITY_BOARDING',
    name: 'Priority Boarding',
    description: 'Board first with priority access',
    pointsCost: 5000,
    requiredTier: 'BRONZE'
  },
  {
    id: 'FREE_FLIGHT',
    name: 'Free Flight Reward',
    description: 'Book any economy flight for free',
    pointsCost: 50000,
    requiredTier: 'GOLD'
  }
];

class LoyaltyService {
  async createAccount(userId: string): Promise<LoyaltyAccount> {
    try {
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .insert({ user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating loyalty account:', error);
      throw error;
    }
  }

  async getAccount(userId: string): Promise<LoyaltyAccount | null> {
    try {
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data;
    } catch (error) {
      console.error('Error fetching loyalty account:', error);
      throw error;
    }
  }

  async getTransactionHistory(accountId: string): Promise<PointsTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('loyalty_account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  async getAvailableRewards(accountId: string): Promise<RewardOption[]> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) throw new Error('Loyalty account not found');

      return REWARD_OPTIONS.filter(reward => {
        const tierLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
        const accountTierLevel = tierLevels.indexOf(account.tier);
        const requiredTierLevel = tierLevels.indexOf(reward.requiredTier);
        
        return accountTierLevel >= requiredTierLevel && account.points >= reward.pointsCost;
      });
    } catch (error) {
      console.error('Error getting available rewards:', error);
      throw error;
    }
  }

  async redeemReward(accountId: string, rewardId: string): Promise<void> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) throw new Error('Loyalty account not found');

      const reward = REWARD_OPTIONS.find(r => r.id === rewardId);
      if (!reward) throw new Error('Invalid reward');

      if (account.points < reward.pointsCost) {
        throw new Error('Insufficient points');
      }

      const tierLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
      const accountTierLevel = tierLevels.indexOf(account.tier);
      const requiredTierLevel = tierLevels.indexOf(reward.requiredTier);
      
      if (accountTierLevel < requiredTierLevel) {
        throw new Error('Insufficient tier level');
      }

      const { error } = await supabase
        .from('points_transactions')
        .insert({
          loyalty_account_id: accountId,
          points_spent: reward.pointsCost,
          transaction_type: 'REWARD_REDEMPTION',
          description: `Redeemed ${reward.name}`
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  private async getAccountById(accountId: string): Promise<LoyaltyAccount | null> {
    try {
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching loyalty account by id:', error);
      throw error;
    }
  }

  async getTierProgress(accountId: string): Promise<{
    currentTier: string;
    nextTier: string | null;
    pointsToNextTier: number | null;
    progress: number;
  }> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) throw new Error('Loyalty account not found');

      const tierThresholds = {
        BRONZE: 0,
        SILVER: 25000,
        GOLD: 50000,
        PLATINUM: 100000
      };

      const tiers = Object.entries(tierThresholds);
      const currentTierIndex = tiers.findIndex(([tier]) => tier === account.tier);
      const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

      let pointsToNextTier = null;
      let progress = 100;

      if (nextTier) {
        pointsToNextTier = nextTier[1] - account.lifetime_points;
        const tierRange = nextTier[1] - tiers[currentTierIndex][1];
        progress = ((tierRange - pointsToNextTier) / tierRange) * 100;
      }

      return {
        currentTier: account.tier,
        nextTier: nextTier ? nextTier[0] : null,
        pointsToNextTier,
        progress: Math.max(0, Math.min(100, progress))
      };
    } catch (error) {
      console.error('Error calculating tier progress:', error);
      throw error;
    }
  }
}

export const loyaltyService = new LoyaltyService();
