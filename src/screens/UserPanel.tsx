import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getOfferings, purchasePackage, checkTrialStatus, PACKAGE_IDS, syncSubscription } from '../services/subscriptionService';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

const Tab = createBottomTabNavigator();

// Profile Tab
const ProfileTab = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({ progress: 0, quizzes: 0, notes: 0 });

  useEffect(() => {
    if (user) {
      // Fetch stats from Supabase
      supabase.from('user_stats').select('*').eq('user_id', user.id).single().then(({ data }) => {
        setStats(data || { progress: 0, quizzes: 0, notes: 0 });
      });
    }
  }, [user]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.header}>
        <Text style={[styles.title, { fontFamily: theme.fonts.heading, color: 'white' }]}>Profile</Text>
      </LinearGradient>
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.accent + '20' }]}>
          <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
          <Text style={[styles.statText, { color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 16 }]}>Progress: {stats.progress}%</Text>
        </View>
        {/* More stats cards */}
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.buttonText}>Edit Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Subscriptions Tab
const SubscriptionsTab = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState({ hasTrial: false, expiry: '' });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const pkgs = await getOfferings();
      setOfferings(pkgs);
      const status = await checkTrialStatus();
      setTrialStatus(status);
      setLoading(false);
    };
    init();
  }, []);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      const customerInfo = await purchasePackage(pkg);
      if (user) await syncSubscription(customerInfo, user.id);
      Alert.alert('Success', 'Subscription activated!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.header}>
        <Text style={[styles.title, { fontFamily: theme.fonts.heading, color: 'white' }]}>Subscriptions</Text>
      </LinearGradient>
      {trialStatus.hasTrial && (
        <View style={[styles.trialCard, { backgroundColor: theme.colors.accent + '20' }]}>
          <Text style={[styles.trialText, { color: theme.colors.text, fontSize: 16 }]}>3-Day Free Trial Active until {trialStatus.expiry}</Text>
        </View>
      )}
      {offerings.map((pkg) => (
        <TouchableOpacity key={pkg.identifier} style={[styles.planCard, { backgroundColor: theme.colors.background }]} onPress={() => handlePurchase(pkg)}>
          <Text style={[styles.planTitle, { fontSize: 18, fontFamily: theme.fonts.heading, color: theme.colors.text }]}>{pkg.product.name}</Text>
          <Text style={[styles.planPrice, { fontSize: 24, color: theme.colors.primary }]}>₹{pkg.product.price}</Text>
          <Text style={[styles.planDesc, { color: theme.colors.text, fontSize: 14 }]}>{pkg.product.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Settings Tab (placeholder)
const SettingsTab = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={{ fontSize: 18, color: theme.colors.text }}>Settings</Text>
      {/* Add toggles, etc. */}
    </View>
  );
};

const UserPanel = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color }) => <Ionicons name={route.name === 'Profile' ? 'person' : route.name === 'Subscriptions' ? 'card' : 'settings'} size={24} color={color} />,
      tabBarActiveTintColor: theme.colors.primary,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Profile" component={ProfileTab} />
    <Tab.Screen name="Subscriptions" component={SubscriptionsTab} />
    <Tab.Screen name="Settings" component={SettingsTab} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderRadius: 20, margin: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  statCard: { padding: 20, borderRadius: 12, alignItems: 'center' },
  statText: { marginTop: 8 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center', margin: 20 },
  buttonText: { color: 'white', fontSize: 16 },
  trialCard: { padding: 16, margin: 20, borderRadius: 12 },
  trialText: { textAlign: 'center' },
  planCard: { margin: 10, padding: 20, borderRadius: 12, elevation: 2 },
  planTitle: { fontWeight: 'bold' },
  planPrice: { marginVertical: 8 },
  planDesc: { textAlign: 'center' },
});

export default UserPanel;
