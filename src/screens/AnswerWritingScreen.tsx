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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../supabase';
import { evaluateAnswer } from '../services/aiBrainModel'; // Assuming AI service exists

// Types
interface Question {
  id: string;
  question: string;
  topic: string;
  wordLimit: number;
  marks: number;
  subject: string;
}

interface Answer {
  id: string;
  questionId: string;
  content: string;
  wordCount: number;
  timeTaken: number; // seconds
  score: number;
  feedback: string;
  structureScore: number;
  contentScore: number;
  createdAt: Date;
}

interface PracticeSession {
  id: string;
  title: string;
  questions: Question[];
  duration: number; // minutes
  currentQuestionIndex: number;
  startTime: Date;
  answers: Answer[];
}

const AnswerWritingScreen: React.FC = () => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ score: 0, content: '', structure: 0 });
  const [loading, setLoading] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newSession, setNewSession] = useState<Partial<PracticeSession>>({ currentQuestionIndex: 0, answers: [] });
  const [wordCount, setWordCount] = useState(0);

  // Sample questions
  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      question: 'Discuss the significance of Article 21 in the context of right to life and personal liberty. (150 words)',
      topic: 'Fundamental Rights',
      wordLimit: 150,
      marks: 10,
      subject: 'Polity',
    },
    {
      id: 'q2',
      question: 'Examine the impact of GST on Indian federalism. (200 words)',
      topic: 'Taxation',
      wordLimit: 200,
      marks: 15,
      subject: 'Economy',
    },
    {
      id: 'q3',
      question: 'Analyze the role of NCERT books in UPSC preparation. (100 words)',
      topic: 'Study Strategy',
      wordLimit: 100,
      marks: 5,
      subject: 'General',
    },
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSession && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentSession, timeRemaining]);

  const loadSessions = async () => {
    try {
      const { data } = await supabase.from('answer_sessions').select('*').order('createdAt', { ascending: false });
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Mock data
      setSessions([
        {
          id: 's1',
          title: 'Mains Practice - Polity',
          questions: sampleQuestions.slice(0, 2),
          duration: 30,
          currentQuestionIndex: 0,
          startTime: new Date(),
          answers: [],
        },
      ]);
    }
  };

  const startSession = (session: PracticeSession) => {
    setCurrentSession({ ...session, currentQuestionIndex: 0, answers: [] });
    setCurrentAnswer('');
    setTimeRemaining(session.duration * 60);
    setShowFeedback(false);
  };

  const submitAnswer = async () => {
    if (!currentSession || !currentAnswer.trim()) {
      Alert.alert('Incomplete', 'Please write your answer before submitting.');
      return;
    }

    setLoading(true);
    try {
      const question = currentSession.questions[currentSession.currentQuestionIndex];
      const aiFeedback = await evaluateAnswer(currentAnswer, question.question);

      const newAnswer: Answer = {
        id: Date.now().toString(),
        questionId: question.id,
        content: currentAnswer,
        wordCount,
        timeTaken: currentSession.duration * 60 - timeRemaining,
        score: aiFeedback.score,
        feedback: aiFeedback.feedback,
        structureScore: aiFeedback.structure,
        contentScore: aiFeedback.content,
        createdAt: new Date(),
      };

      const updatedSession = {
        ...currentSession,
        answers: [...currentSession.answers, newAnswer],
      };

      setCurrentSession(updatedSession);
      setFeedback({ score: aiFeedback.score, content: aiFeedback.feedback, structure: aiFeedback.structure });
      setShowFeedback(true);
      setCurrentAnswer('');
      setWordCount(0);

      // Save to Supabase
      await supabase.from('answer_sessions').upsert(updatedSession);
      await supabase.from('answers').insert(newAnswer);

      // Move to next question or end session
      if (currentSession.currentQuestionIndex < currentSession.questions.length - 1) {
        setTimeRemaining(10 * 60); // 10 min per question
      } else {
        Alert.alert('Session Complete', 'Great job on your mains practice!');
        setCurrentSession(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to evaluate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        currentQuestionIndex: currentSession.currentQuestionIndex + 1,
      };
      setCurrentSession(updatedSession);
      setTimeRemaining(10 * 60);
      setCurrentAnswer('');
      setShowFeedback(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = currentSession?.questions[currentSession.currentQuestionIndex];

  const renderSessionItem = (session: PracticeSession) => (
    <TouchableOpacity style={styles.sessionCard} onPress={() => startSession(session)}>
      <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.sessionGradient}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionQuestions}>{session.questions.length} Questions</Text>
        </View>
        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Icon name="timer" size={16} color="#FFF" />
            <Text style={styles.detailText}>{session.duration} mins</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="subject" size={16} color="#FFF" />
            <Text style={styles.detailText}>{session.questions[0]?.subject}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (currentSession && currentQuestion) {
    return (
      <KeyboardAvoidingView style={styles.answerContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.answerHeader}>
          <Text style={styles.questionNumber}>
            Question {currentSession.currentQuestionIndex + 1} / {currentSession.questions.length}
          </Text>
          <View style={styles.timerContainer}>
            <Icon name="timer" size={20} color={timeRemaining < 300 ? '#FF3B30' : '#FFF'} />
            <Text style={[styles.timerText, timeRemaining < 300 && styles.timerWarning]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.questionTopic}>{currentQuestion.topic}</Text>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            <Text style={styles.questionMeta}>
              Word Limit: {currentQuestion.wordLimit} | Marks: {currentQuestion.marks}
            </Text>
          </View>

          <View style={styles.wordCountContainer}>
            <Text style={styles.wordCountText}>Words: {wordCount} / {currentQuestion.wordLimit}</Text>
          </View>

          <TextInput
            style={styles.answerInput}
            multiline
            placeholder="Write your answer here... Structure: Introduction, Body, Conclusion"
            value={currentAnswer}
            onChangeText={text => {
              setCurrentAnswer(text);
              setWordCount(text.trim().split(/\s+/).length);
            }}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.answerActions}>
          <TouchableOpacity style={styles.submitButton} onPress={submitAnswer} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Icon name="send" size={20} color="#FFF" />
                <Text style={styles.submitText}>Submit Answer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Feedback Modal */}
        <Modal visible={showFeedback} animationType="slide">
          <View style={styles.feedbackModal}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>Answer Evaluation</Text>
              <TouchableOpacity onPress={() => setShowFeedback(false)}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.feedbackContent}>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{feedback.score}/10</Text>
                <Text style={styles.scoreLabel}>Overall Score</Text>
              </View>

              <View style={styles.breakdown}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Content Quality</Text>
                  <Text style={styles.breakdownScore}>{feedback.contentScore}/5</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Structure & Clarity</Text>
                  <Text style={styles.breakdownScore}>{feedback.structure}/5</Text>
                </View>
              </View>

              <ScrollView style={styles.feedbackTextContainer}>
                <Text style={styles.feedbackText}>{feedback.content}</Text>
              </ScrollView>

              <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
                <Text style={styles.nextText}>Next Question</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✍️ Answer Writing Practice</Text>
        <Text style={styles.headerSubtitle}>Master UPSC Mains with AI feedback</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Practice Sessions ({sessions.length})</Text>
        {sessions.map(session => renderSessionItem(session))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddSessionModal(true)}>
        <Icon name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Add Session Modal - Simplified */}
      <Modal visible={showAddSessionModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>New Practice Session</Text>
          <TextInput
            style={styles.input}
            placeholder="Session Title"
            value={newSession.title || ''}
            onChangeText={text => setNewSession({ ...newSession, title: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Duration (minutes)"
            keyboardType="numeric"
            value={newSession.duration?.toString() || ''}
            onChangeText={text => setNewSession({ ...newSession, duration: parseInt(text) || 0 })}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddSessionModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={() => {
              // Logic to create session with sample questions
              const session: PracticeSession = {
                id: Date.now().toString(),
                title: newSession.title || 'New Session',
                questions: sampleQuestions,
                duration: newSession.duration || 30,
                currentQuestionIndex: 0,
                startTime: new Date(),
                answers: [],
              };
              setSessions(prev => [session, ...prev]);
              setShowAddSessionModal(false);
              startSession(session);
            }}>
              <Text style={styles.saveText}>Start Practice</Text>
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
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sessionQuestions: {
    fontSize: 14,
    color: '#E5E7EB',
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
  answerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  questionNumber: {
    fontSize: 16,
    color: '#6B7280',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timerWarning: {
    color: '#FF3B30',
  },
  questionContainer: {
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    margin: 16,
    elevation: 2,
  },
  questionTopic: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 8,
  },
  questionMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  wordCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  wordCountText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  answerInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    margin: 16,
    minHeight: 300,
  },
  answerActions: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    marginLeft: 8,
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
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
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  breakdownScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  feedbackTextContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  feedbackText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  nextButton: {
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
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: {
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default AnswerWritingScreen;
