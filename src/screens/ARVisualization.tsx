import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text as ThreeText, Box, Sphere, Plane, Torus, Cone } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

interface Visualization3D {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  components: 3DComponent[];
  interactions: InteractionRule[];
}

interface 3DComponent {
  id: string;
  type: 'box' | 'sphere' | 'plane' | 'torus' | 'cone' | 'text';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  label?: string;
  onClick?: string;
  animation?: string;
}

interface InteractionRule {
  trigger: string;
  action: string;
  target: string;
}

const Interactive3DComponent = ({ component, onInteraction }: { 
  component: 3DComponent; 
  onInteraction: (componentId: string, action: string) => void 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current && component.animation) {
      if (component.animation === 'rotate') {
        meshRef.current.rotation.y += delta;
      } else if (component.animation === 'pulse') {
        meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  const handleClick = () => {
    if (component.onClick) {
      onInteraction(component.id, component.onClick);
    }
  };

  const renderComponent = () => {
    const props = {
      ref: meshRef,
      position: component.position,
      rotation: component.rotation,
      scale: component.scale,
      onClick: handleClick,
      onPointerOver: () => setHovered(true),
      onPointerOut: () => setHovered(false),
    };

    const materialProps = {
      color: hovered ? '#ff6b6b' : component.color,
      emissive: component.color,
      emissiveIntensity: hovered ? 0.5 : 0.2,
    };

    switch (component.type) {
      case 'box':
        return (
          <Box {...props} args={[1, 1, 1]}>
            <meshStandardMaterial {...materialProps} />
          </Box>
        );
      case 'sphere':
        return (
          <Sphere {...props} args={[0.5, 16, 16]}>
            <meshStandardMaterial {...materialProps} />
          </Sphere>
        );
      case 'plane':
        return (
          <Plane {...props} args={[2, 2]}>
            <meshStandardMaterial {...materialProps} />
          </Plane>
        );
      case 'torus':
        return (
          <Torus {...props} args={[0.5, 0.2, 16, 32]}>
            <meshStandardMaterial {...materialProps} />
          </Torus>
        );
      case 'cone':
        return (
          <Cone {...props} args={[0.5, 1, 8]}>
            <meshStandardMaterial {...materialProps} />
          </Cone>
        );
      case 'text':
        return (
          <ThreeText
            position={component.position}
            rotation={component.rotation}
            scale={component.scale}
            color={component.color}
            fontSize={0.3}
            anchorX="center"
            anchorY="middle"
          >
            {component.label}
          </ThreeText>
        );
      default:
        return null;
    }
  };

  return <>{renderComponent()}</>;
};

const VisualizationScene = ({ visualization, onInteraction }: {
  visualization: Visualization3D;
  onInteraction: (componentId: string, action: string) => void;
}) => {
  return (
    <View style={styles.canvasContainer}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        
        {visualization.components.map((component) => (
          <Interactive3DComponent
            key={component.id}
            component={component}
            onInteraction={onInteraction}
          />
        ))}
      </Canvas>
    </View>
  );
};

export default function ARVisualization() {
  const [loading, setLoading] = useState(true);
  const [visualizations, setVisualizations] = useState<Visualization3D[]>([]);
  const [selectedVisualization, setSelectedVisualization] = useState<Visualization3D | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [interactionLog, setInteractionLog] = useState<string[]>([]);

  useEffect(() => {
    loadVisualizations();
  }, []);

  const loadVisualizations = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('ar_visualizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading visualizations:', error);
        setVisualizations(generateDefaultVisualizations());
      } else {
        setVisualizations(data || generateDefaultVisualizations());
      }
    } catch (error) {
      console.error('Error:', error);
      setVisualizations(generateDefaultVisualizations());
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultVisualizations = (): Visualization3D[] => [
    {
      id: 'solar-system',
      title: 'Solar System',
      description: 'Interactive 3D model of our solar system with planets and orbits',
      category: 'Geography',
      difficulty: 'intermediate',
      components: [
        {
          id: 'sun',
          type: 'sphere',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: '#FDB813',
          label: 'Sun',
          animation: 'pulse',
        },
        {
          id: 'earth',
          type: 'sphere',
          position: [3, 0, 0],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
          color: '#4169E1',
          label: 'Earth',
          animation: 'rotate',
          onClick: 'show_earth_info',
        },
        {
          id: 'mars',
          type: 'sphere',
          position: [-2, 0, 2],
          rotation: [0, 0, 0],
          scale: [0.25, 0.25, 0.25],
          color: '#CD5C5C',
          label: 'Mars',
          animation: 'rotate',
        },
        {
          id: 'label-text',
          type: 'text',
          position: [0, 2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: '#FFFFFF',
          label: 'Solar System Model',
        },
      ],
      interactions: [
        {
          trigger: 'click',
          action: 'show_info',
          target: 'earth',
        },
      ],
    },
    {
      id: 'parliament-structure',
      title: 'Parliament Structure',
      description: '3D visualization of Indian Parliament structure and functioning',
      category: 'Polity',
      difficulty: 'beginner',
      components: [
        {
          id: 'loksabha',
          type: 'box',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [2, 1, 3],
          color: '#FF6B6B',
          label: 'Lok Sabha',
          onClick: 'show_loksabha_info',
        },
        {
          id: 'rajyasabha',
          type: 'box',
          position: [0, 1.5, 0],
          rotation: [0, 0, 0],
          scale: [1.5, 0.8, 2.5],
          color: '#4ECDC4',
          label: 'Rajya Sabha',
        },
        {
          id: 'speaker-chair',
          type: 'cone',
          position: [0, 0.5, 1.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.5, 0.3],
          color: '#FFD700',
          label: 'Speaker',
        },
      ],
      interactions: [
        {
          trigger: 'click',
          action: 'show_info',
          target: 'loksabha',
        },
      ],
    },
    {
      id: 'economic-cycle',
      title: 'Economic Cycle',
      description: 'Interactive model of economic growth and recession cycles',
      category: 'Economy',
      difficulty: 'advanced',
      components: [
        {
          id: 'growth-phase',
          type: 'torus',
          position: [0, 0, 0],
          rotation: [0.5, 0, 0],
          scale: [2, 2, 1],
          color: '#32CD32',
          label: 'Growth Phase',
          animation: 'rotate',
        },
        {
          id: 'recession-phase',
          type: 'torus',
          position: [0, -1, 0],
          rotation: [0.5, 0, 0],
          scale: [1.5, 1.5, 0.8],
          color: '#DC143C',
          label: 'Recession Phase',
        },
      ],
      interactions: [],
    },
  ];

  const handleInteraction = (componentId: string, action: string) => {
    const logEntry = `Interacted with ${componentId}: ${action}`;
    setInteractionLog(prev => [...prev, logEntry]);
    
    if (action === 'show_earth_info') {
      Alert.alert('Earth', 'Earth is the third planet from the Sun and the only known planet to harbor life.');
    } else if (action === 'show_loksabha_info') {
      Alert.alert('Lok Sabha', 'Lok Sabha is the lower house of India's Parliament with 543 elected members.');
    }
  };

  const openVisualization = (visualization: Visualization3D) => {
    setSelectedVisualization(visualization);
    setModalVisible(true);
    setInteractionLog([]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading AR/3D Visualizations...</Text>
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
          <Text style={styles.title}>AR/3D Visualizations</Text>
          <Text style={styles.subtitle}>Immersive Learning Experience</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>Polity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>Economy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>Geography</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>History</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.visualizationGrid}>
          {visualizations.map((visualization) => (
            <TouchableOpacity
              key={visualization.id}
              style={styles.visualizationCard}
              onPress={() => openVisualization(visualization)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{visualization.title}</Text>
                <View style={[
                  styles.difficultyBadge,
                  { backgroundColor: 
                    visualization.difficulty === 'beginner' ? '#32CD32' :
                    visualization.difficulty === 'intermediate' ? '#FFD700' : '#FF6347'
                  }
                ]}>
                  <Text style={styles.difficultyText}>{visualization.difficulty}</Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>{visualization.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.categoryTag}>{visualization.category}</Text>
                <Ionicons name="cube-outline" size={20} color="#007AFF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedVisualization && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedVisualization.title}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity>
                  <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="share-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            <VisualizationScene
              visualization={selectedVisualization}
              onInteraction={handleInteraction}
            />

            <View style={styles.infoPanel}>
              <Text style={styles.infoTitle}>{selectedVisualization.description}</Text>
              {interactionLog.length > 0 && (
                <ScrollView style={styles.interactionLog} showsVerticalScrollIndicator={false}>
                  <Text style={styles.logTitle}>Interaction Log:</Text>
                  {interactionLog.map((log, index) => (
                    <Text key={index} style={styles.logEntry}>• {log}</Text>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </Modal>
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
  content: {
    padding: 20,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  visualizationGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  visualizationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  canvasContainer: {
    height: height * 0.5,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  infoPanel: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  interactionLog: {
    maxHeight: 100,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  logEntry: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
