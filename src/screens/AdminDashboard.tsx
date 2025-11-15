import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getAIInstance } from '../services/aiService'; // Enhanced

const Tab = createBottomTabNavigator();

// Users Tab
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();

    const sub = supabase.channel('profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers).subscribe();
    return () => sub.unsubscribe();
  }, []);

  const banUser = (id: string) => {
    supabase.from('profiles').update({ banned: true }).eq('id', id);
    Alert.alert('User banned');
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.userRow}>
          <Text>{item.email} - {item.role}</Text>
          <TouchableOpacity onPress={() => banUser(item.id)}><Text>Ban</Text></TouchableOpacity>
        </View>
      )}
    />
  );
};

// Content Tab (moderate notes/quizzes)
const ContentTab = () => {
  // Similar to Users, fetch from notes/quizzes tables, approve/reject
  return <Text>Content Moderation</Text>;
};

// Analytics Tab
const AnalyticsTab = () => {
  const chartConfig = { backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff', color: (opacity = 1) => `rgba(0,0,0,${opacity})` };
  const data = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ data: [Math.random() * 100, Math.random() * 100, Math.random() * 100] }],
  };

  return <LineChart data={data} width={width - 40} height={220} chartConfig={chartConfig} style={styles.chart} />;
};

// AI Configs Tab
const AIConfigsTab = () => {
  const [config, setConfig] = useState({ provider: 'openai', apiKey: '', endpoint: '' });
  const [loading, setLoading] = useState(false);

  const saveConfig = async () => {
    await supabase.from('ai_settings').upsert({ id: 1, ...config });
    Alert.alert('Config saved');
  };

  const testAI = async () => {
    setLoading(true);
    try {
      const ai = getAIInstance(config.provider, { apiKey: config.apiKey, endpoint: config.endpoint });
      const response = await ai.generate('Test query: What is UPSC?');
      Alert.alert('Test', response);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.form}>
      <Text>Provider: <TextInput value={config.provider} onChangeText={(v) => setConfig({...config, provider: v})} /></Text>
      <Text>API Key: <TextInput secureTextEntry value={config.apiKey} onChangeText={(v) => setConfig({...config, apiKey: v})} /></Text>
      <Text>Endpoint: <TextInput value={config.endpoint} onChangeText={(v) => setConfig({...config, endpoint: v})} /></Text>
      <TouchableOpacity onPress={testAI} disabled={loading}><Text>{loading ? 'Testing...' : 'Test AI'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={saveConfig}><Text>Save</Text></TouchableOpacity>
    </View>
  );
};

const AdminDashboard = () => (
  <Tab.Navigator>
    <Tab.Screen name="Users" component={UsersTab} />
    <Tab.Screen name="Content" component={ContentTab} />
    <Tab.Screen name="Analytics" component={AnalyticsTab} />
    <Tab.Screen name="AI Configs" component={AIConfigsTab} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  userRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  chart: { marginVertical: 8, borderRadius: 16 },
  form: { padding: 20 },
});

export default AdminDashboard;
