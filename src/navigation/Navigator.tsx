import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

// Import existing screens
import SyllabusGraph from '../screens/SyllabusGraph';
import TutorChat from '../screens/TutorChat';
import Quiz from '../screens/Quiz';
import Progress from '../screens/Progress';
import CurrentAffairs from '../screens/CurrentAffairs';
import Profile from '../screens/Profile';

// Import new advanced screens (to be created)
import AIBrainModel from '../screens/AIBrainModel';
import ARVisualization from '../screens/ARVisualization';
import HallModeSimulator from '../screens/HallModeSimulator';
import AnswerWritingCoach from '../screens/AnswerWritingCoach';
import InterviewLab from '../screens/InterviewLab';
import Flashcards from '../screens/Flashcards';
import QuestionBank from '../screens/QuestionBank';
import FloatingNoteGenius from '../screens/FloatingNoteGenius';
import NoteBuilder from '../screens/NoteBuilder';
import SubscriptionSystem from '../screens/SubscriptionSystem';
import AdminDashboard from '../screens/AdminDashboard';
import RevenueManagement from '../screens/RevenueManagement';
import AdsCockpit from '../screens/AdsCockpit';
import ExportPipeline from '../screens/ExportPipeline';
import CICDPipeline from '../screens/CICDPipeline';
import OfflineMode from '../screens/OfflineMode';
import Analytics from '../screens/Analytics';
import Collaboration from '../screens/Collaboration';
import Security from '../screens/Security';
import AppStoreReadiness from '../screens/AppStoreReadiness';
import BuildSystem from '../screens/BuildSystem';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Home Screen Component
const HomeScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Learn') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Practice') {
            iconName = focused ? 'create' : 'create-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name=
cd /root/UPSC-AI-Mentor && cat > src/screens/AIBrainModel.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Text as ThreeText } from '@react-three/drei';
import { supabase } from '../services/supabase';
import * as THREE from 'three';

const { width } = Dimensions.get('window');

interface BrainNode {
  id: string;
  label: string;
  category: string;
  strength: number;
  connections: string[];
  position: [number, number, number];
  color: string;
}

const BrainVisualization = ({ nodes, onNodeClick }: { nodes: BrainNode[]; onNodeClick: (node: BrainNode) => void }) => {
  return (
    <View style={{ height: 300, width: '100%' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls enableZoom={true} enablePan={false} />
        
        {nodes.map((node, index) => (
          <Sphere
            key={node.id}
            args={[0.3 + node.strength * 0.2, 16, 16]}
            position={node.position}
            onClick={() => onNodeClick(node)}
          >
            <meshStandardMaterial 
              color={node.color} 
              emissive={node.color}
              emissiveIntensity={0.3}
            />
          </Sphere>
        ))}
        
        {nodes.map((node) =>
          node.connections.map((connectionId) => {
            const targetNode = nodes.find(n => n.id === connectionId);
            if (!targetNode) return null;
            
            const points = [];
            points.push(new THREE.Vector3(...node.position));
            points.push(new THREE.Vector3(...targetNode.position));
            
            return (
              <line key={`${node.id}-${connectionId}`}>
                <bufferGeometry>
                  <bufferAttribute
                    attachObject={['attributes', 'position']}
                    count={points.length}
                    array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#00ff88" opacity={0.6} transparent />
              </line>
            );
          })
        )}
      </Canvas>
    </View>
  );
};

export default function AIBrainModel() {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [stats, setStats] = useState({
    totalNodes: 0,
    connections: 0,
    accuracy: 0,
    lastTrained: null as string | null,
  });

  useEffect(() => {
    loadBrainModel();
    loadStats();
  }, []);

  const loadBrainModel = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: brainData, error } = await supabase
        .from('user_brain_models')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading brain model:', error);
        return;
      }

      if (brainData) {
        setNodes(brainData.nodes || generateDefaultNodes());
      } else {
        setNodes(generateDefaultNodes());
      }
    } catch (error) {
      console.error('Error:', error);
      setNodes(generateDefaultNodes());
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultNodes = (): BrainNode[] => [
    {
      id: 'politics',
      label: 'Polity & Governance',
      category: 'core',
      strength: 0.8,
      connections: ['economy', 'history'],
      position: [2, 2, 0],
      color: '#FF6B6B',
    },
    {
      id: 'economy',
      label: 'Indian Economy',
      category: 'core',
      strength: 0.7,
      connections: ['politics', 'geography'],
      position: [-2, 1, 1],
      color: '#4ECDC4',
    },
    {
      id: 'history',
      label: 'History & Culture',
      category: 'core',
      strength: 0.6,
      connections: ['politics', 'geography'],
      position: [0, -2, -1],
      color: '#45B7D1',
    },
    {
      id: 'geography',
      label: 'Geography',
      category: 'core',
      strength: 0.75,
      connections: ['economy', 'environment'],
      position: [1, -1, 2],
      color: '#96CEB4',
    },
    {
      id: 'environment',
      label: 'Environment & Ecology',
      category: 'core',
      strength: 0.65,
      connections: ['geography', 'science'],
      position: [-1, 2, -2],
      color: '#FFEAA7',
    },
    {
      id: 'science',
      label: 'Science & Technology',
      category: 'core',
      strength: 0.8,
      connections: ['environment', 'current'],
      position: [2, -2, 1],
      color: '#DDA0DD',
    },
    {
      id: 'current',
      label: 'Current Affairs',
      category: 'dynamic',
      strength: 0.9,
      connections: ['science', 'politics'],
      position: [-2, -1, -1],
      color: '#FF69B4',
    },
  ];

  const loadStats = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (data) {
        setStats({
          totalNodes: nodes.length,
          connections: nodes.reduce((acc, node) => acc + node.connections.length, 0) / 2,
          accuracy: data.accuracy || 0,
          lastTrained: data.last_trained,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const trainBrainModel = async () => {
    setIsTraining(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Simulate AI training process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update nodes based on training
      const updatedNodes = nodes.map(node => ({
        ...node,
        strength: Math.min(1, node.strength + Math.random() * 0.1),
      }));

      setNodes(updatedNodes);

      // Save to database
      await supabase.from('user_brain_models').upsert({
        user_id: user.user.id,
        nodes: updatedNodes,
        updated_at: new Date().toISOString(),
      });

      Alert.alert('Success', 'Brain model updated successfully!');
    } catch (error) {
      console.error('Error training brain model:', error);
      Alert.alert('Error', 'Failed to train brain model');
    } finally {
      setIsTraining(false);
      loadStats();
    }
  };

  const handleNodeClick = (node: BrainNode) => {
    setSelectedNode(node);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading AI Brain Model...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>AI Brain Model</Text>
          <Text style={styles.subtitle}>Neural Learning Architecture</Text>
        </View>
      </LinearGradient>

      <View style={styles.visualizationContainer}>
        <Text style={styles.sectionTitle}>Knowledge Graph Visualization</Text>
        <BrainVisualization nodes={nodes} onNodeClick={handleNodeClick} />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Brain Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalNodes}</Text>
            <Text style={styles.statLabel}>Knowledge Nodes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(stats.connections)}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(stats.accuracy * 100)}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>

      {selectedNode && (
        <View style={styles.selectedNodeContainer}>
          <Text style={styles.sectionTitle}>Selected Node: {selectedNode.label}</Text>
          <View style={styles.nodeDetails}>
            <Text style={styles.nodeDetail}>Category: {selectedNode.category}</Text>
            <Text style={styles.nodeDetail}>Strength: {Math.round(selectedNode.strength * 100)}%</Text>
            <Text style={styles.nodeDetail}>Connections: {selectedNode.connections.length}</Text>
          </View>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isTraining && styles.disabledButton]}
          onPress={trainBrainModel}
          disabled={isTraining}
        >
          <Ionicons name="brain" size={24} color="white" />
          <Text style={styles.actionButtonText}>
            {isTraining ? 'Training...' : 'Train Brain Model'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Ionicons name="settings" size={24} color="white" />
          <Text style={styles.actionButtonText}>Configure Model</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  visualizationContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectedNodeContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  nodeDetails: {
    marginTop: 12,
  },
  nodeDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
