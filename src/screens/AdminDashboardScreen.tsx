import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../supabase';

// Types
interface UserStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  newUsersToday: number;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'Question' | 'Article' | 'Note';
  status: 'Active' | 'Pending' | 'Rejected';
  createdBy: string;
  createdAt: Date;
}

interface AnalyticsData {
  quizzesTaken: number;
  mockTestsCompleted: number;
  avgScore: number;
  topSubjects: string[];
}

const AdminDashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    newUsersToday: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    quizzesTaken: 0,
    mockTestsCompleted: 0,
    avgScore: 0,
    topSubjects: [],
  });
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    loadDashboardData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (error) {
      console.error('Admin access check failed:', error);
      Alert.alert('Access Denied', 'Admin privileges required.');
    }
  };

  const loadDashboardData = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);

      // Load user stats
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      const { count: premiumUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'premium');
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toDateString());

      setUserStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        premiumUsers: premiumUsers || 0,
        newUsersToday: newUsersToday || 0,
      });

      // Load analytics (mock for demo)
      setAnalytics({
        quizzesTaken: 1250,
        mockTestsCompleted: 450,
        avgScore: 72.5,
        topSubjects: ['Polity', 'Economy', 'History'],
      });

      // Load pending content
      const { data: content } = await supabase
        .from('user_content')
        .select('*')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });
      setContentItems(content || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approveContent = async (item: ContentItem) => {
    try {
      await supabase
        .from('user_content')
        .update({ status: 'Active' })
        .eq('id', item.id);
      setContentItems(prev => prev.filter(c => c.id !== item.id));
      Alert.alert('Approved', 'Content approved successfully!');
    } catch (error) {
      console.error('Approval error:', error);
      Alert.alert('Error', 'Failed to approve content');
    }
  };

  const rejectContent = async (item: ContentItem) => {
    try {
      await supabase
        .from('user_content')
        .update({ status: 'Rejected' })
        .eq('id', item.id);
      setContentItems(prev => prev.filter(c => c.id !== item.id));
      Alert.alert('Rejected', 'Content rejected.');
    } catch (error) {
      console.error('Rejection error:', error);
      Alert.alert('Error', 'Failed to reject content');
    }
  };

  const viewUserDetails = (user: any) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const renderContentItem = ({ item }: { item: ContentItem }) => (
    <View style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <Text style={styles.contentTitle}>{item.title}</Text>
        <Text style={styles.contentType}>{item.type}</Text>
      </View>
      <Text style={styles.contentMeta}>By: {item.createdBy} | {item.createdAt.toLocaleDateString()}</Text>
      <View style={styles.contentActions}>
        <TouchableOpacity style={styles.approveButton} onPress={() => approveContent(item)}>
          <Icon name="check" size={16} color="#FFF" />
          <Text style={styles.actionText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={() => rejectContent(item)}>
          <Icon name="close" size={16} color="#FFF" />
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.accessDenied}>Admin access required</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛠️ Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage users, content, and analytics</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData}>
          <Icon name="refresh" size={20} color="#FFF" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* User Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="people" size={32} color="#007AFF" />
          <Text style={styles.statNumber}>{userStats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="person" size={32} color="#4CAF50" />
          <Text style={styles.statNumber}>{userStats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="star" size={32} color="#FFD700" />
          <Text style={styles.statNumber}>{userStats.premiumUsers}</Text>
          <Text style={styles.statLabel}>Premium Users</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="trending-up" size={32} color="#FF9800" />
          <Text style={styles.statNumber}>+{userStats.newUsersToday}</Text>
          <Text style={styles.statLabel}>New Today</Text>
        </View>
      </View>

      {/* Analytics Section */}
      <View style={styles.analyticsSection}>
        <Text style={styles.sectionTitle}>📊 App Analytics</Text>
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Quizzes Taken:</Text>
            <Text style={styles.analyticsValue}>{analytics.quizzesTaken}</Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Mock Tests:</Text>
            <Text style={styles.analyticsValue}>{analytics.mockTestsCompleted}</Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Avg Score:</Text>
            <Text style={styles.analyticsValue}>{analytics.avgScore}%</Text>
          </View>
          <View style={styles.topSubjects}>
            <Text style={styles.analyticsLabel}>Top Subjects:</Text>
            {analytics.topSubjects.map((subject, index) => (
              <Text key={index} style={styles.subjectTag}>{subject}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* Content Moderation */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>📝 Pending Content ({contentItems.length})</Text>
        <FlatList
          data={contentItems}
          renderItem={renderContentItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* User Management (simplified) */}
      <View style={styles.userSection}>
        <Text style={styles.sectionTitle}>👥 User Management</Text>
        <TouchableOpacity style={styles.userButton} onPress={() => Alert.alert('Users', 'Full user management coming soon')}>
          <Icon name="manage-accounts" size={20} color="#FFF" />
          <Text style={styles.userButtonText}>View All Users</Text>
        </TouchableOpacity>
      </View>

      {/* User Details Modal */}
      <Modal visible={showUserModal} animationType="slide">
        {selectedUser && (
          <View style={styles.userModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedUser.email}</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.userDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedUser.name || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role:</Text>
                <Text style={styles.detailValue}>{selectedUser.role || 'User'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subscription:</Text>
                <Text style={styles.detailValue}>{selectedUser.subscription_status || 'Free'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>{selectedUser.created_at?.toLocaleDateString() || 'N/A'}</Text>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Edit', 'Edit user details')}>
                <Text style={styles.editText}>Edit User</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.banButton} onPress={() => Alert.alert('Ban', 'Ban user?')}>
                <Text style={styles.banText}>Ban User</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  accessDenied: {
    flex: 1,
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 20,
  },
  refreshText: {
    marginLeft: 8,
    color: '#FFF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '45%',
    marginBottom: 16,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  analyticsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  analyticsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analyticsLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  topSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  subjectTag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 14,
  },
  contentSection: {
    padding: 16,
  },
  contentCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  contentType: {
    backgroundColor: '#007AFF',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  contentMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  approveButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  actionText: {
    color: '#FFF',
    marginLeft: 4,
    fontWeight: '600',
  },
  userSection: {
    padding: 16,
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  userButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  userModal: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userDetails: {
    flex: 1,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  editText: {
    color: '#FFF',
    fontWeight: '600',
  },
  banButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F44336',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  banText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;
