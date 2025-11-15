import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../supabase';
import { generateInterviewQuestion, evaluateInterviewResponse } from '../services/aiBrainModel'; // Assuming AI services

// Types
interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  expectedDuration: number; // seconds
  followUp: boolean;
}

interface InterviewResponse {
  id: string;
  questionId: string;
  response: string;
  confidence: number; // 1-10
  clarity: number;
  content: number;
  overallScore: number;
  feedback: string;
  timestamp: Date;
}

interface InterviewSession {
  id: string;
  title: string;
  panelType: 'Prelims' | 'Mains' | 'Personality';
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  currentQuestionIndex: number;
  startTime: Date;
  status: 'preparing' | 'in-progress' | 'completed';
}

interface PanelPersona {
  id: string;
  name: string;
  role: string;
  personality: string;
  expertise: string[];
}

const InterviewLabScreen: React.FC = () => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [feedback, setFeedback] = useState<InterviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSession, setNewSession] = useState<Partial<InterviewSession>>({ status: 'preparing', currentQuestionIndex: 0, responses: [] });
  const [selectedPanel, setSelectedPanel] = useState<PanelPersona | null>(null);
  const [panelPersonas] = useState<PanelPersona[]>([
    {
      id: 'p1',
      name: 'Dr. Rajesh Kumar',
      role: 'Senior IAS Officer',
      personality: 'Strict but fair',
      expertise: ['Polity', 'Governance', 'Ethics'],
    },
    {
      id: 'p2',
      name: 'Prof. Anjali Sharma',
      role: 'UPSC Examiner',
      personality: 'Analytical',
      expertise: ['Economy', 'International Relations'],
    },
    {
      id: 'p3',
      name: 'Ms. Priya Menon',
      role: 'Personality Assessor',
      personality: 'Empathetic',
      expertise: ['Communication', 'Current Affairs'],
    },
  ]);

  // Sample questions for demo
  const sampleQuestions: InterviewQuestion[] = [
    {
      id: 'iq1',
      question: 'Why do you want to join the civil services?',
      category: 'Motivation',
      expectedDuration: 120,
      followUp: false,
    },
    {
      id: 'iq2',
      question: 'How would you handle corruption in your department as a District Collector?',
      category: 'Ethics',
      expectedDuration: 180,
      followUp: true,
    },
    {
      id: 'iq3',
      question: 'Discuss the impact of climate change on Indian agriculture.',
      category: 'Environment',
      expectedDuration: 150,
      followUp: false,
    },
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data } = await supabase.from('interview_sessions').select('*').order('startTime', { ascending: false });
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Mock data
      setSessions([
        {
          id: 'is1',
          title: 'Personality Test Practice',
          panelType: 'Personality',
          questions: sampleQuestions,
          responses: [],
          currentQuestionIndex: 0,
          startTime: new Date(),
          status: 'completed',
        },
      ]);
    }
  };

  const startNewSession = () => {
    if (!selectedPanel) {
      Alert.alert('Select Panel', 'Please select a panel member to start.');
      return;
    }
    const session: InterviewSession = {
      id: Date.now().toString(),
      title: `${selectedPanel.name} - ${newSession.panelType || 'Personality'} Interview`,
      panelType: newSession.panelType as any || 'Personality',
      questions: sampleQuestions,
      responses: [],
      currentQuestionIndex: 0,
      startTime: new Date(),
      status: 'in-progress',
    };
    setCurrentSession(session);
    setSessions(prev => [session, ...prev]);
    setShowNewSessionModal(false);
    setSelectedPanel(null);
    setNewSession({ status: 'preparing', currentQuestionIndex: 0, responses: [] });
  };

  const askQuestion = () => {
    if (currentSession) {
      setShowResponseModal(true);
    }
  };

  const submitResponse = async () => {
    if (!currentSession || !currentResponse.trim()) {
      Alert.alert('Incomplete', 'Please provide your response.');
      return;
    }

    setLoading(true);
    try {
      const question = currentSession.questions[currentSession.currentQuestionIndex];
      const aiFeedback = await evaluateInterviewResponse(currentResponse, question.question, selectedPanel?.expertise || []);

      const newResponse: InterviewResponse = {
        id: Date.now().toString(),
        questionId: question.id,
        response: currentResponse,
        confidence: aiFeedback.confidence,
        clarity: aiFeedback.clarity,
        content: aiFeedback.content,
        overallScore: aiFeedback.overall,
        feedback: aiFeedback.feedback,
        timestamp: new Date(),
      };

      const updatedSession = {
        ...currentSession,
        responses: [...currentSession.responses, newResponse],
        currentQuestionIndex: currentSession.currentQuestionIndex + 1,
      };

      setCurrentSession(updatedSession);
      setFeedback(newResponse);
      setShowResponseModal(false);
      setCurrentResponse('');

      // Save to Supabase
      await supabase.from('interview_sessions').upsert(updatedSession);
      await supabase.from('interview_responses').insert(newResponse);

      if (updatedSession.currentQuestionIndex >= updatedSession.questions.length) {
        updatedSession.status = 'completed';
        await supabase.from('interview_sessions').update({ status: 'completed' }).eq('id', updatedSession.id);
        Alert.alert('Interview Complete', 'Session finished! Review your performance.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to evaluate response.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = currentSession?.questions[currentSession.currentQuestionIndex];

  const renderSessionItem = ({ item }: { item: InterviewSession }) => (
    <TouchableOpacity style={styles.sessionCard} onPress={() => setCurrentSession(item)}>
      <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.sessionGradient}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{item.title}</Text>
          <Text style={styles.sessionStatus}>{item.status}</Text>
        </View>
        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Icon name="group" size={16} color="#FFF" />
            <Text style={styles.detailText}>{item.panelType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="question-answer" size={16} color="#FFF" />
            <Text style={styles.detailText}>{item.questions.length} Questions</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderPanelPersona = ({ item }: { item: PanelPersona }) => (
    <TouchableOpacity
      style={[styles.personaCard, selectedPanel?.id === item.id && styles.selectedPersona]}
      onPress={() => setSelectedPanel(item === selectedPanel ? null : item)}
    >
      <View style={styles.personaAvatar}>
        <Text style={styles.personaInitial}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.personaInfo}>
        <Text style={styles.personaName}>{item.name}</Text>
        <Text style={styles.personaRole}>{item.role}</Text>
        <Text style={styles.personaPersonality}>{item.personality}</Text>
      </View>
    </TouchableOpacity>
  );

  if (currentSession && currentQuestion) {
    return (
      <View style={styles.interviewContainer}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelName}>{selectedPanel?.name || 'Panel Member'}</Text>
          <Text style={styles.panelRole}>{selectedPanel?.role}</Text>
        </View>

        <ScrollView style={styles.questionsContainer}>
          <View style={styles.currentQuestionCard}>
            <Text style={styles.questionCategory}>{currentQuestion.category}</Text>
            <Text style={styles.currentQuestion}>{currentQuestion.question}</Text>
            <Text style={styles.questionMeta}>Expected time: {currentQuestion.expectedDuration / 60} mins</Text>
          </View>

          {currentSession.responses.slice(0, currentSession.currentQuestionIndex).map((resp, index) => (
            <View key={resp.id} style={styles.pastResponseCard}>
              <Text style={styles.responseQuestion}>Q{index + 1}: {currentSession.questions[index].question}</Text>
              <Text style={styles.responseScore}>Score: {resp.overallScore}/10</Text>
              <Text style={styles.responseFeedback}>{resp.feedback}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.responseActions}>
          <TouchableOpacity style={styles.respondButton} onPress={() => setShowResponseModal(true)}>
            <Icon name="mic" size={20} color="#FFF" />
            <Text style={styles.respondText}>Start Responding</Text>
          </TouchableOpacity>
        </View>

        {/* Response Modal */}
        <Modal visible={showResponseModal} animationType="slide">
          <View style={styles.responseModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Response</Text>
              <TouchableOpacity onPress={() => setShowResponseModal(false)}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.responseContent}>
              <TextInput
                style={styles.responseInput}
                multiline
                placeholder="Speak/type your response here... (Simulating audio recording)"
                value={currentResponse}
                onChangeText={setCurrentResponse}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowResponseModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitResponseButton} onPress={submitResponse} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Response</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Feedback Modal */}
        {feedback && (
          <Modal visible={true} animationType="slide">
            <View style={styles.feedbackModal}>
              <View style={styles.feedbackHeader}>
                <Text style={styles.feedbackTitle}>Panel Feedback</Text>
                <TouchableOpacity onPress={() => setFeedback(null)}>
                  <Icon name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.feedbackContent}>
                <View style={styles.feedbackScore}>
                  <Text style={styles.overallScore}>{feedback.overallScore}/10</Text>
                  <Text style={styles.scoreBreakdown}>
                    Confidence: {feedback.confidence} | Clarity: {feedback.clarity} | Content: {feedback.content}
                  </Text>
                </View>

                <ScrollView style={styles.feedbackTextContainer}>
                  <Text style={styles.detailedFeedback}>{feedback.feedback}</Text>
                </ScrollView>

                <TouchableOpacity style={styles.nextQuestionButton} onPress={() => {
                  if (currentSession && currentSession.currentQuestionIndex < currentSession.questions.length - 1) {
                    setCurrentSession({ ...currentSession, currentQuestionIndex: currentSession.currentQuestionIndex + 1 });
                  } else {
                    Alert.alert('Interview Complete');
                  }
                  setFeedback(null);
                }}>
                  <Text style={styles.nextText}>Next Question</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎤 Interview Lab</Text>
        <Text style={styles.headerSubtitle}>Practice with AI panel members</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Past Sessions ({sessions.length})</Text>
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowNewSessionModal(true)}>
        <Icon name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* New Session Modal */}
      <Modal visible={showNewSessionModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Start New Interview</Text>
          <TextInput
            style={styles.input}
            placeholder="Session Title"
            value={newSession.title || ''}
            onChangeText={text => setNewSession({ ...newSession, title: text })}
          />
          <View style={styles.panelSelector}>
            <Text style={styles.selectorTitle}>Select Panel Member</Text>
            <FlatList
              data={panelPersonas}
              renderItem={renderPanelPersona}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
          <View style={styles.typeSelector}>
            <Text style={styles.selectorTitle}>Interview Type</Text>
            {(['Prelims', 'Mains', 'Personality'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, newSession.panelType === type && styles.selectedType]}
                onPress={() => setNewSession({ ...newSession, panelType: type })}
              >
                <Text style={styles.typeText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewSessionModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startButton} onPress={startNewSession} disabled={!selectedPanel}>
              <Text style={styles.startText}>Start Interview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
  sessionCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  sessionGradient: {
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  sessionStatus: {
    fontSize: 14,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FFF',
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
  interviewContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  panelHeader: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  panelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  panelRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  questionsContainer: {
    flex: 1,
  },
  currentQuestionCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    margin: 16,
    elevation: 2,
  },
  questionCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  currentQuestion: {
    fontSize: 18,
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 8,
  },
  questionMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  pastResponseCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    margin: 8,
  },
  responseQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  responseScore: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  responseFeedback: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  responseActions: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  respondButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  respondText: {
    marginLeft: 8,
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  responseModal: {
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
  responseContent: {
    flex: 1,
    padding: 20,
  },
  responseInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  submitResponseButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitText: {
    color: '#FFF',
    fontWeight: '600',
  },
  feedbackModal: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  feedbackContent: {
    flex: 1,
    padding: 20,
  },
  feedbackScore: {
    alignItems: 'center',
    marginBottom: 20,
  },
  overallScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scoreBreakdown: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  feedbackTextContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailedFeedback: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  nextQuestionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  panelSelector: {
    marginBottom: 16,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  personaCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    elevation: 2,
    width: 200,
  },
  selectedPersona: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  personaAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  personaInitial: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  personaRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  personaPersonality: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  typeSelector: {
    marginBottom: 20,
  },
  typeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: '#007AFF',
  },
  typeText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default InterviewLabScreen;
