import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  Switch,
  DatePickerAndroid,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../supabase';

import DateTimePicker from '@react-native-community/datetimepicker';

// Types
interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  date: Date;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
  notes: string;
  createdAt: Date;
}

interface Goal {
  id: string;
  title: string;
  targetDate: Date;
  progress: number; // 0-100
  achieved: boolean;
}

const StudyPlannerScreen: React.FC = () => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<StudyPlan>>({ completed: false });
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({ achieved: false, progress: 0 });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'plan' | 'goal'>('plan');
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'goals'>('daily');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load study plans
      const { data: plansData } = await supabase
        .from('study_plans')
        .select('*')
        .order('date', { ascending: true });
      setStudyPlans(plansData || []);

      // Load goals
      const { data: goalsData } = await supabase
        .from('study_goals')
        .select('*')
        .order('targetDate', { ascending: true });
      setGoals(goalsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load study data');
      // Fallback to mock data
      setStudyPlans([
        {
          id: '1',
          title: 'Polity - Fundamental Rights',
          subject: 'Polity',
          duration: 120,
          date: new Date(),
          completed: false,
          priority: 'High',
          notes: 'Focus on Articles 14-18',
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Economy - Budget Analysis',
          subject: 'Economy',
          duration: 90,
          date: new Date(Date.now() + 86400000),
          completed: true,
          priority: 'Medium',
          notes: 'Review key allocations',
          createdAt: new Date(),
        },
      ]);
      setGoals([
        {
          id: '1',
          title: 'Complete GS Paper 1 Syllabus',
          targetDate: new Date(Date.now() + 30 * 86400000),
          progress: 45,
          achieved: false,
        },
        {
          id: '2',
          title: 'Score 120+ in Mock Test',
          targetDate: new Date(Date.now() + 7 * 86400000),
          progress: 80,
          achieved: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    try {
      const planToSave = { ...newPlan, id: Date.now().toString() };
      setStudyPlans(prev => [...prev, planToSave as StudyPlan]);
      // Save to Supabase
      await supabase.from('study_plans').insert(planToSave);
      setShowAddPlanModal(false);
      setNewPlan({ completed: false });
      Alert.alert('Success', 'Study plan added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save study plan');
    }
  };

  const saveGoal = async () => {
    try {
      const goalToSave = { ...newGoal, id: Date.now().toString() };
      setGoals(prev => [...prev, goalToSave as Goal]);
      // Save to Supabase
      await supabase.from('study_goals').insert(goalToSave);
      setShowAddGoalModal(false);
      setNewGoal({ achieved: false, progress: 0 });
      Alert.alert('Success', 'Goal added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal');
    }
  };

  const togglePlanCompletion = (id: string) => {
    setStudyPlans(prev =>
      prev.map(plan =>
        plan.id === id ? { ...plan, completed: !plan.completed } : plan
      )
    );
    // Update in Supabase
    supabase.from('study_plans').update({ completed: true }).eq('id', id);
  };

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id ? { ...goal, progress } : goal
      )
    );
    // Update in Supabase
    supabase.from('study_goals').update({ progress }).eq('id', id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#FF3B30';
      case 'Medium': return '#FF9500';
      case 'Low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const renderPlanItem = ({ item }: { item: StudyPlan }) => (
    <View style={styles.planCard}>
      <LinearGradient
        colors={item.completed ? ['#34C759', '#30D158'] : ['#007AFF', '#00C6FF']}
        style={styles.planGradient}
      >
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planTitle}>{item.title}</Text>
            <Text style={styles.planSubject}>{item.subject}</Text>
          </View>
          <View style={styles.priorityBadge}>
            <Text style={[styles.priorityText, { color: '#FFF' }]}>{item.priority}</Text>
          </View>
        </View>
        <View style={styles.planDetails}>
          <View style={styles.detailRow}>
            <Icon name="schedule" size={16} color="#FFF" />
            <Text style={styles.detailText}>{item.duration} mins</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="today" size={16} color="#FFF" />
            <Text style={styles.detailText}>{item.date.toLocaleDateString()}</Text>
          </View>
          {item.notes && (
            <View style={styles.notesRow}>
              <Icon name="note" size={16} color="#FFF" />
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>
        <View style={styles.planActions}>
          <Switch
            value={item.completed}
            onValueChange={() => togglePlanCompletion(item.id)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={item.completed ? '#f4f3f4' : '#f4f3f4'}
          />
          <TouchableOpacity style={styles.editButton}>
            <Icon name="edit" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderGoalItem = ({ item }: { item: Goal }) => (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{item.title}</Text>
        <Text style={styles.goalDate}>{item.targetDate.toLocaleDateString()}</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{item.progress}%</Text>
      </View>
      <TouchableOpacity style={styles.achieveButton} onPress={() => updateGoalProgress(item.id, item.progress + 10)}>
        <Text style={styles.achieveText}>+10% Progress</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading study plans...</Text>
      </View>
    );
  }

  const todayPlans = studyPlans.filter(plan => plan.date.toDateString() === new Date().toDateString());
  const weeklyPlans = studyPlans.filter(plan => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return plan.date >= weekStart && plan.date <= weekEnd;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Study Planner</Text>
        <Text style={styles.headerSubtitle}>Plan your UPSC preparation effectively</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'daily' && styles.activeTab]}
          onPress={() => setSelectedTab('daily')}
        >
          <Icon name="today" size={20} color={selectedTab === 'daily' ? '#FFF' : '#007AFF'} />
          <Text style={[styles.tabText, selectedTab === 'daily' && styles.activeTabText]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'weekly' && styles.activeTab]}
          onPress={() => setSelectedTab('weekly')}
        >
          <Icon name="date-range" size={20} color={selectedTab === 'weekly' ? '#FFF' : '#007AFF'} />
          <Text style={[styles.tabText, selectedTab === 'weekly' && styles.activeTabText]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'goals' && styles.activeTab]}
          onPress={() => setSelectedTab('goals')}
        >
          <Icon name="flag" size={20} color={selectedTab === 'goals' ? '#FFF' : '#007AFF'} />
          <Text style={[styles.tabText, selectedTab === 'goals' && styles.activeTabText]}>Goals</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'daily' && (
          <View>
            <Text style={styles.sectionTitle}>Today's Plans ({todayPlans.length})</Text>
            <FlatList
              data={todayPlans}
              renderItem={renderPlanItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {selectedTab === 'weekly' && (
          <View>
            <Text style={styles.sectionTitle}>This Week's Plans ({weeklyPlans.length})</Text>
            <FlatList
              data={weeklyPlans}
              renderItem={renderPlanItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {selectedTab === 'goals' && (
          <View>
            <Text style={styles.sectionTitle}>Long-term Goals ({goals.length})</Text>
            <FlatList
              data={goals}
              renderItem={renderGoalItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddPlanModal(true)}>
        <Icon name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Add Plan Modal */}
      <Modal visible={showAddPlanModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Study Plan</Text>
            <View style={styles.inputGroup}>
              <Icon name="title" size={20} color="#007AFF" />
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Polity - Fundamental Rights"
                value={newPlan.title || ''}
                onChangeText={text => setNewPlan({ ...newPlan, title: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Icon name="subject" size={20} color="#007AFF" />
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Polity"
                value={newPlan.subject || ''}
                onChangeText={text => setNewPlan({ ...newPlan, subject: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Icon name="schedule" size={20} color="#007AFF" />
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="120"
                keyboardType="numeric"
                value={newPlan.duration?.toString() || ''}
                onChangeText={text => setNewPlan({ ...newPlan, duration: parseInt(text) || 0 })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Icon name="today" size={20} color="#007AFF" />
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerType('plan');
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateText}>
                  {(newPlan.date ? newPlan.date.toLocaleDateString() : 'Select Date')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Icon name="priority-high" size={20} color="#007AFF" />
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.prioritySelector}>
                {(['Low', 'Medium', 'High'] as const).map(prio => (
                  <TouchableOpacity
                    key={prio}
                    style={[styles.prioButton, newPlan.priority === prio && styles.activePrioButton]}
                    onPress={() => setNewPlan({ ...newPlan, priority: prio })}
                  >
                    <Text style={[
                      styles.prioText,
                      newPlan.priority === prio && styles.activePrioText,
                      { color: getPriorityColor(prio) }
                    ]}>{prio}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Icon name="note" size={20} color="#007AFF" />
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                placeholder="Optional notes..."
                multiline
                numberOfLines={3}
                value={newPlan.notes || ''}
                onChangeText={text => setNewPlan({ ...newPlan, notes: text })}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddPlanModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={savePlan}>
                <Text style={styles.saveText}>Save Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={newPlan.date || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              if (datePickerType === 'plan') {
                setNewPlan({ ...newPlan, date });
              } else {
                setNewGoal({ ...newGoal, targetDate: date });
              }
            }
          }}
        />
      )}

      {/* Similar modal for Add Goal - abbreviated for brevity */}
      {/* Add Goal Modal implementation would follow similar pattern */}
    </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  planGradient: {
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  planSubject: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  priorityBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FFF',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  notesText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FFF',
    flex: 1,
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  goalCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  goalHeader: {
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  achieveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  achieveText: {
    color: '#FFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  prioButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activePrioButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  prioText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activePrioText: {
    color: '#FFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default StudyPlannerScreen;
