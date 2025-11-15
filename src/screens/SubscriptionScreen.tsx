import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Purchases from 'react-native-purchases';
import { revenueCatService } from '../services/revenueCatService';

// Types
interface SubscriptionTier {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  duration: 'Monthly' | 'Yearly';
  isPopular: boolean;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  tier: string;
  expiryDate: Date | null;
  entitlements: string[];
}

const SubscriptionScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    tier: 'Free',
    expiryDate: null,
    entitlements: [],
  });
  const [offerings, setOfferings] = useState<any>(null);
  const [purchasing, setPurchasing] = useState(false);

  // Subscription tiers (static for demo, dynamically from RevenueCat)
  const tiers: SubscriptionTier[] = [
    {
      id: 'free',
      title: 'Free Plan',
      description: 'Basic UPSC preparation tools',
      price: 'Free',
      features: [
        'Syllabus Overview',
        'Basic Quizzes (10/day)',
        'Limited AI Tutor',
        'Progress Tracking',
      ],
      duration: 'Monthly',
      isPopular: false,
    },
    {
      id: 'premium_monthly',
      title: 'Premium Monthly',
      description: 'Full access to all features',
      price: '$9.99',
      features: [
        'Unlimited Quizzes & Mock Tests',
        'Full AI Tutor Access',
        'Advanced Analytics',
        'Hall Mode Simulator',
        'Answer Writing Coach',
        'Interview Lab',
        'AR Visualizations',
        'Offline Mode',
        'Priority Support',
      ],
      duration: 'Monthly',
      isPopular: false,
    },
    {
      id: 'premium_yearly',
      title: 'Premium Yearly',
      description: 'Best value - Save 40%',
      price: '$79.99',
      features: [
        'Everything in Premium',
        'Annual Progress Reports',
        'Exclusive Webinars',
        'Personalized Study Plans',
        'Community Access',
      ],
      duration: 'Yearly',
      isPopular: true,
    },
  ];

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const status = await revenueCatService.getSubscriptionStatus();
      setSubscriptionStatus(status);

      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOfferings(offerings.current);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const purchaseSubscription = async (tierId: string) => {
    if (subscriptionStatus.isSubscribed) {
      Alert.alert('Already Subscribed', 'You already have an active subscription.');
      return;
    }

    setPurchasing(true);
    try {
      const success = await revenueCatService.purchaseSubscription(tierId);
      if (success) {
        Alert.alert('Success', 'Subscription purchased successfully!');
        loadSubscriptionStatus(); // Refresh status
      } else {
        Alert.alert('Failed', 'Subscription purchase failed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Payment failed. Check your connection and try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    setLoading(true);
    try {
      const success = await Purchases.restorePurchases();
      if (success) {
        Alert.alert('Restored', 'Purchases restored successfully!');
        loadSubscriptionStatus();
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const renderTierCard = (tier: SubscriptionTier) => (
    <View key={tier.id} style={[styles.tierCard, tier.isPopular && styles.popularCard]}>
      {tier.isPopular && <Text style={styles.popularBadge}>Most Popular</Text>}
      <Text style={styles.tierTitle}>{tier.title}</Text>
      <Text style={styles.tierDescription}>{tier.description}</Text>
      <Text style={styles.price}>{tier.price} / {tier.duration}</Text>
      <View style={styles.featuresList}>
        {tier.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name="check" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.subscribeButton, tier.id === 'free' && styles.freeButton]}
        onPress={() => purchaseSubscription(tier.id)}
        disabled={tier.id === 'free' || purchasing || subscriptionStatus.isSubscribed}
      >
        {tier.id === 'free' ? (
          <Text style={styles.freeButtonText}>Current Plan</Text>
        ) : (
          <>
            {purchasing ? <ActivityIndicator color="#FFF" /> : <Icon name="credit-card" size={20} color="#FFF" />}
            <Text style={styles.subscribeText}>
              {subscriptionStatus.isSubscribed ? 'Manage Subscription' : 'Subscribe Now'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👑 Premium Subscription</Text>
          <Text style={styles.headerSubtitle}>
            Unlock unlimited access to all UPSC AI Mentor features
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon name={subscriptionStatus.isSubscribed ? 'check-circle' : 'info'} size={24} color={subscriptionStatus.isSubscribed ? '#4CAF50' : '#FF9800'} />
            <Text style={styles.statusTitle}>Current Status: {subscriptionStatus.tier}</Text>
          </View>
          {subscriptionStatus.isSubscribed && (
            <View style={styles.statusDetails}>
              <Text style={styles.statusDetail}>Expires: {subscriptionStatus.expiryDate?.toLocaleDateString() || 'N/A'}</Text>
              <Text style={styles.statusDetail}>Entitlements: {subscriptionStatus.entitlements.join(', ') || 'Basic'}</Text>
            </View>
          )}
          {!subscriptionStatus.isSubscribed && (
            <Text style={styles.upgradePrompt}>Upgrade to Premium for complete UPSC preparation!</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        <View style={styles.tiersContainer}>
          {tiers.map(renderTierCard)}
        </View>
      </ScrollView>

      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.restoreButton} onPress={restorePurchases} disabled={loading}>
          <Icon name="restore" size={20} color="#007AFF" />
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.termsButton} onPress={() => Alert.alert('Terms', 'Subscription terms and conditions...')}>
          <Text style={styles.termsText}>Terms & Privacy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    margin: 16,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusDetails: {
    marginTop: 8,
  },
  statusDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  upgradePrompt: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    margin: 24,
    marginBottom: 16,
  },
  tiersContainer: {
    paddingHorizontal: 16,
  },
  tierCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    position: 'relative',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    elevation: 5,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#007AFF',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tierTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  subscribeButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeButton: {
    backgroundColor: '#F3F4F6',
  },
  freeButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  subscribeText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restoreText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '600',
  },
  termsButton: {
    padding: 8,
  },
  termsText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default SubscriptionScreen;
