import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { OrbitControls, PerspectiveCamera, Box, Sphere } from '@react-three/drei/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../supabase';

const { width, height } = Dimensions.get('window');

// Types
interface ConceptNode {
  id: string;
  name: string;
  topic: string;
  position: [number, number, number];
  connectedTo: string[];
  color: string;
  size: number;
}

interface ARSession {
  id: string;
  title: string;
  nodes: ConceptNode[];
  activeVisualization: 'Syllabus' | 'ConceptMap' | '3DGeography';
  saved: boolean;
}

const ARVisualizationScreen: React.FC = () => {
  const [activeSession, setActiveSession] = useState<ARSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [visualizationType, setVisualizationType] = useState<'Syllabus' | 'ConceptMap' | '3DGeography'>('Syllabus');
  const [savedVisualizations, setSavedVisualizations] = useState<ARSession[]>([]);
  const canvasRef = useRef<any>(null);

  // Sample syllabus data for 3D visualization
  const sampleSyllabusNodes: ConceptNode[] = [
    {
      id: 'gs1',
      name: 'General Studies I',
      topic: 'Indian Heritage & Culture',
      position: [0, 5, 0],
      connectedTo: ['history', 'art'],
      color: '#FF6B6B',
      size: 2,
    },
    {
      id: 'history',
      name: 'History',
      topic: 'Modern India',
      position: [-3, 3, 0],
      connectedTo: ['gs1'],
      color: '#4ECDC4',
      size: 1.5,
    },
    {
      id: 'art',
      name: 'Art & Culture',
      topic: 'Architecture',
      position: [3, 3, 0],
      connectedTo: ['gs1'],
      color: '#45B7D1',
      size: 1.5,
    },
    {
      id: 'gs2',
      name: 'General Studies II',
      topic: 'Governance',
      position: [0, 0, 0],
      connectedTo: ['polity', 'ir'],
      color: '#96CEB4',
      size: 2,
    },
    {
      id: 'polity',
      name: 'Polity',
      topic: 'Constitution',
      position: [-3, -2, 0],
      connectedTo: ['gs2'],
      color: '#FFEAA7',
      size: 1.5,
    },
    {
      id: 'ir',
      name: 'International Relations',
      topic: 'Global Affairs',
      position: [3, -2, 0],
      connectedTo: ['gs2'],
      color: '#DDA0DD',
      size: 1.5,
    },
    // Add more nodes for comprehensive syllabus
  ];

  // 3D Node Component
  const Node = ({ node }: { node: ConceptNode }) => {
    const meshRef = useRef<any>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      }
    });

    return (
      <group position={node.position}>
        <Sphere ref={meshRef} args={[node.size, 32, 32]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
          <meshStandardMaterial color={hovered ? '#FFFF00' : node.color} />
        </Sphere>
        <Text
          position={[0, node.size + 0.5, 0]}
          fontSize={0.5}
          anchorX="center"
          anchorY="middle"
          fill={node.color}
        >
          {node.name}
        </Text>
      </group>
    );
  };

  // Connections between nodes
  const Connection = ({ from, to }: { from: ConceptNode; to: ConceptNode }) => (
    <mesh>
      <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
      <meshStandardMaterial color="#888" />
    </mesh>
  );

  const Scene = () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <PerspectiveCamera makeDefault position={[0, 0, 15]} />
      <OrbitControls enableZoom={true} enablePan={true} />

      {/* Render nodes based on visualization type */}
      {activeSession?.nodes?.map((node) => <Node key={node.id} node={node} />)}

      {/* Render connections */}
      {activeSession?.nodes?.map((node) =>
        node.connectedTo.map((targetId) => {
          const targetNode = activeSession.nodes.find(n => n.id === targetId);
          if (targetNode) {
            return <Connection key={`${node.id}-${targetId}`} from={node} to={targetNode} />;
          }
          return null;
        })
      )}

      {/* Central Syllabus Sphere for Syllabus view */}
      {visualizationType === 'Syllabus' && (
        <Sphere args={[3, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#007AFF" wireframe />
        </Sphere>
      )}

      {/* Geography example: Simple globe */}
      {visualizationType === '3DGeography' && (
        <>
          <Sphere args={[4, 32, 32]} position={[0, 0, 0]}>
            <meshStandardMaterial map={null} color="#4A90E2" />
          </Sphere>
          <Text position={[0, 5, 0]} fontSize={1} anchorX="center" anchorY="middle" fill="#FFF">
            India - Geographical Features
          </Text>
        </>
      )}
    </>
  );

  useEffect(() => {
    loadVisualizations();
  }, []);

  const loadVisualizations = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('ar_visualizations').select('*');
      setSavedVisualizations(data || []);
      // Default session
      const defaultSession: ARSession = {
        id: 'default',
        title: 'UPSC Syllabus 3D Map',
        nodes: sampleSyllabusNodes,
        activeVisualization: 'Syllabus',
        saved: false,
      };
      setActiveSession(defaultSession);
    } catch (error) {
      console.error('Error loading visualizations:', error);
      // Fallback to sample
      const defaultSession: ARSession = {
        id: 'default',
        title: 'UPSC Syllabus 3D Map',
        nodes: sampleSyllabusNodes,
        activeVisualization: 'Syllabus',
        saved: false,
      };
      setActiveSession(defaultSession);
    } finally {
      setLoading(false);
    }
  };

  const saveVisualization = async () => {
    if (!activeSession) return;
    try {
      const sessionToSave = { ...activeSession, saved: true };
      await supabase.from('ar_visualizations').insert(sessionToSave);
      setSavedVisualizations(prev => [sessionToSave, ...prev]);
      Alert.alert('Saved', 'Visualization saved successfully!');
    } catch (error) {
      console.error('Error saving visualization:', error);
      Alert.alert('Error', 'Failed to save visualization');
    }
  };

  const changeVisualization = (type: 'Syllabus' | 'ConceptMap' | '3DGeography') => {
    setVisualizationType(type);
    setActiveSession(prev => prev ? { ...prev, activeVisualization: type } : null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading 3D Visualization...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔮 AR Visualization</Text>
        <Text style={styles.headerSubtitle}>Interactive 3D Learning</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
          <Icon name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas ref={canvasRef} style={styles.canvas} camera={{ position: [0, 0, 15], fov: 75 }}>
          <Scene />
        </Canvas>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => changeVisualization('Syllabus')}>
          <Icon name="book" size={20} color={visualizationType === 'Syllabus' ? '#007AFF' : '#666'} />
          <Text style={[styles.controlText, visualizationType === 'Syllabus' && styles.activeControl]}>Syllabus</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => changeVisualization('ConceptMap')}>
          <Icon name="account-tree" size={20} color={visualizationType === 'ConceptMap' ? '#007AFF' : '#666'} />
          <Text style={[styles.controlText, visualizationType === 'ConceptMap' && styles.activeControl]}>Concept Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => changeVisualization('3DGeography')}>
          <Icon name="public" size={20} color={visualizationType === '3DGeography' ? '#007AFF' : '#666'} />
          <Text style={[styles.controlText, visualizationType === '3DGeography' && styles.activeControl]}>Geography</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveVisualization}>
        <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.saveGradient}>
          <Icon name="save" size={20} color="#FFF" />
          <Text style={styles.saveText}>Save Visualization</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal visible={showMenu} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              // Navigate or load saved
            }}>
              <Icon name="folder" size={24} color="#007AFF" />
              <Text style={styles.menuText}>Saved Visualizations ({savedVisualizations.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              Alert.alert('AR Mode', 'Full AR mode requires device camera access. Coming soon in production build.');
            }}>
              <Icon name="camera-alt" size={24} color="#007AFF" />
              <Text style={styles.menuText}>Enable AR Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              // Reset view
              if (canvasRef.current) {
                canvasRef.current.reset();
              }
            }}>
              <Icon name="refresh" size={24} color="#007AFF" />
              <Text style={styles.menuText}>Reset View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeMenu} onPress={() => setShowMenu(false)}>
              <Text style={styles.closeText}>Close</Text>
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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
  },
  menuButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  canvasContainer: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    alignItems: 'center',
    padding: 8,
  },
  controlText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeControl: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  saveButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  saveGradient: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  menuText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
  closeMenu: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  closeText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default ARVisualizationScreen;
