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
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../supabase';

const { width, height } = Dimensions.get('window');

// Types
interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  subject: string;
  difficulty: number; // 1-5 for spaced repetition
  nextReview: Date;
  mastered: boolean;
  createdAt: Date;
}

interface Deck {
  id: string;
  name: string;
  subject: string;
  cardsCount: number;
  mastery: number; // average mastery percentage
}

const FlashcardsScreen: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentDeck, setCurrentDeck] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [newCard, setNewCard] = useState<Partial<Flashcard>>({});
  const [newDeck, setNewDeck] = useState<Partial<Deck>>({ cardsCount: 0, mastery: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState(3);

  const subjects = ['Polity', 'Economy', 'History', 'Geography', 'Environment', 'Science & Tech', 'Current Affairs'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load decks
      const { data: decksData } = await supabase
        .from('flashcard_decks')
        .select('*');
      setDecks(decksData || []);

      // Load cards
      const { data: cardsData } = await supabase
        .from('flashcards')
        .select('*')
        .order('nextReview', { ascending: true });
      setCards(cardsData || []);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      Alert.alert('Error', 'Failed to load flashcards');
      // Mock data fallback
      setDecks([
        {
          id: '1',
          name: 'Polity Fundamentals',
          subject: 'Polity',
          cardsCount: 25,
          mastery: 72,
        },
        {
          id: '2',
          name: 'Economic Concepts',
          subject: 'Economy',
          cardsCount: 18,
          mastery: 65,
        },
      ]);
      setCards([
        {
          id: 'c1',
          front: 'What is Article 14 of the Indian Constitution?',
          back: 'Article 14 guarantees equality before law and equal protection of laws within India.',
          deck: '1',
          subject: 'Polity',
          difficulty: 3,
          nextReview: new Date(),
          mastered: false,
          createdAt: new Date(),
        },
        {
          id: 'c2',
          front: 'Define Fiscal Deficit',
          back: 'Fiscal Deficit is the difference between total expenditure and total receipts excluding borrowings.',
          deck: '2',
          subject: 'Economy',
          difficulty: 4,
          nextReview: new Date(Date.now() + 86400000),
          mastered: true,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startDeck = (deckId: string) => {
    const deckCards = cards.filter(card => card.deck === deckId && !card.mastered);
    if (deckCards.length === 0) {
      Alert.alert('No Cards', 'This deck has no pending cards to review.');
      return;
    }
    setCurrentDeck(deckId);
    setCurrentCardIndex(0);
    setShowCard(true);
    setShowBack(false);
    flipAnim.setValue(0);
  };

  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: showBack ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowBack(!showBack));
  };

  const rateCard = (rating: number) => {
    const card = cards.find(c => c.id === cards[currentCardIndex]?.id);
    if (card) {
      const updateDifficulty = Math.max(1, Math.min(5, rating));
      const daysUntilNext = updateDifficulty === 1 ? 1 : updateDifficulty * 2;
      const nextReview = new Date(Date.now() + daysUntilNext * 86400000);
      const mastered = updateDifficulty === 5;

      const updatedCard = { ...card, difficulty: updateDifficulty, nextReview, mastered };
      setCards(prev => prev.map(c => c.id === card.id ? updatedCard : c));

      // Update Supabase
      supabase.from('flashcards').update(updatedCard).eq('id', card.id);

      if (mastered) {
        Alert.alert('Mastered!', 'Great job! This card is now mastered.');
      }

      if (currentCardIndex < cards.filter(c => c.deck === currentDeck && !c.mastered).length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowBack(false);
        flipAnim.setValue(0);
      } else {
        setShowCard(false);
        setCurrentDeck(null);
        Alert.alert('Session Complete', 'You\'ve completed this deck review!');
      }
    }
  };

  const saveCard = async () => {
    try {
      const cardToSave = {
        ...newCard,
        id: Date.now().toString(),
        difficulty: selectedDifficulty,
        nextReview: new Date(),
        mastered: false,
        createdAt: new Date(),
      } as Flashcard;
      setCards(prev => [...prev, cardToSave]);
      await supabase.from('flashcards').insert(cardToSave);
      setShowAddCardModal(false);
      setNewCard({});
      Alert.alert('Success', 'Flashcard added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save flashcard');
    }
  };

  const saveDeck = async () => {
    try {
      const deckToSave = {
        ...newDeck,
        id: Date.now().toString(),
        cardsCount: 0,
        mastery: 0,
      } as Deck;
      setDecks(prev => [...prev, deckToSave]);
      await supabase.from('flashcard_decks').insert(deckToSave);
      setShowAddDeckModal(false);
      setNewDeck({ cardsCount: 0, mastery: 0 });
      Alert.alert('Success', 'Deck created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create deck');
    }
  };

  const currentCard = currentDeck ? cards.find(c => c.deck === currentDeck && !c.mastered)?.[currentCardIndex] : null;

  const renderDeckItem = ({ item }: { item: Deck }) => (
    <TouchableOpacity style={styles.deckCard} onPress={() => startDeck(item.id)}>
      <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.deckGradient}>
        <View style={styles.deckHeader}>
          <Text style={styles.deckName}>{item.name}</Text>
          <Text style={styles.deckSubject}>{item.subject}</Text>
        </View>
        <View style={styles.deckStats}>
          <View style={styles.statItem}>
            <Icon name="cards" size={20} color="#FFF" />
            <Text style={styles.statValue}>{item.cardsCount}</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={20} color="#FFF" />
            <Text style={styles.statValue}>{item.mastery}%</Text>
            <Text style={styles.statLabel}>Mastery</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🃏 Flashcards</Text>
        <Text style={styles.headerSubtitle}>Spaced repetition for UPSC mastery</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Your Decks</Text>
        <FlatList
          data={decks}
          renderItem={renderDeckItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />

        <Text style={styles.sectionTitle}>Due Today ({cards.filter(c => c.nextReview <= new Date()).length})</Text>
        <FlatList
          data={cards.filter(c => c.nextReview <= new Date() && !c.mastered)}
          renderItem={({ item }) => (
            <View style={styles.dueCard}>
              <Text style={styles.dueFront}>{item.front}</Text>
              <TouchableOpacity onPress={() => startDeck(item.deck)}>
                <Text style={styles.dueAction}>Review Now</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddDeckModal(true)}>
        <Icon name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Flashcard Review Modal */}
      <Modal visible={showCard} animationType="slide">
        <View style={styles.cardModal}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardProgress}>
              {currentCardIndex + 1} / {cards.filter(c => c.deck === currentDeck && !c.mastered).length}
            </Text>
            <TouchableOpacity onPress={() => setShowCard(false)}>
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardContainer}>
            <Animated.View
              style={[styles.flashcard, {
                transform: [{
                  rotateY: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                }],
              }]}
            >
              <View style={[styles.cardSide, showBack && styles.cardBack]}>
                <Text style={styles.cardText}>{currentCard ? (showBack ? currentCard.back : currentCard.front) : ''}</Text>
              </View>
            </Animated.View>
          </View>

          {!showBack ? (
            <TouchableOpacity style={styles.flipButton} onPress={flipCard}>
              <Text style={styles.flipText}>Show Answer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.ratingContainer}>
              <TouchableOpacity style={styles.ratingButton} onPress={() => rateCard(1)}>
                <Icon name="thumb-down" size={24} color="#FF3B30" />
                <Text style={styles.ratingText}>Hard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ratingButton} onPress={() => rateCard(3)}>
                <Icon name="remove" size={24} color="#FF9500" />
                <Text style={styles.ratingText}>Good</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ratingButton} onPress={() => rateCard(5)}>
                <Icon name="thumb-up" size={24} color="#34C759" />
                <Text style={styles.ratingText}>Easy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Add Card Modal - Simplified for brevity */}
      <Modal visible={showAddCardModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add New Card</Text>
          <TextInput
            style={styles.input}
            placeholder="Front (Question)"
            value={newCard.front || ''}
            onChangeText={text => setNewCard({ ...newCard, front: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Back (Answer)"
            value={newCard.back || ''}
            onChangeText={text => setNewCard({ ...newCard, back: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Deck ID"
            value={newCard.deck || ''}
            onChangeText={text => setNewCard({ ...newCard, deck: text })}
          />
          <View style={styles.difficultySelector}>
            {[1,2,3,4,5].map(diff => (
              <TouchableOpacity
                key={diff}
                style={[styles.diffButton, selectedDifficulty === diff && styles.selectedDiffButton]}
                onPress={() => setSelectedDifficulty(diff)}
              >
                <Text style={styles.diffText}>{diff}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddCardModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveCard}>
              <Text style={styles.saveText}>Save Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Deck Modal - Similar structure */}
      <Modal visible={showAddDeckModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create New Deck</Text>
          <TextInput
            style={styles.input}
            placeholder="Deck Name"
            value={newDeck.name || ''}
            onChangeText={text => setNewDeck({ ...newDeck, name: text })}
          />
          <View style={styles.subjectSelector}>
            {subjects.map(sub => (
              <TouchableOpacity key={sub} style={styles.subjectButton}>
                <Text style={styles.subjectText}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddDeckModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveDeck}>
              <Text style={styles.saveText}>Create Deck</Text>
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
  deckCard: {
    width: 200,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  deckGradient: {
    padding: 16,
    height: 120,
  },
  deckHeader: {
    marginBottom: 12,
  },
  deckName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  deckSubject: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  dueCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  dueFront: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  dueAction: {
    color: '#007AFF',
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
  cardModal: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2C2C2E',
  },
  cardProgress: {
    fontSize: 16,
    color: '#FFF',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  flashcard: {
    width: width * 0.9,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  cardSide: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardBack: {
    backgroundColor: '#F0F0F0',
  },
  cardText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#1F2937',
    lineHeight: 24,
  },
  flipButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  flipText: {
    color: '#FFF',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  ratingButton: {
    alignItems: 'center',
    padding: 12,
  },
  ratingText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
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
  difficultySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  diffButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minWidth: 40,
    alignItems: 'center',
  },
  selectedDiffButton: {
    backgroundColor: '#007AFF',
  },
  diffText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  subjectSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    margin: 4,
  },
  subjectText: {
    color: '#6B7280',
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

export default FlashcardsScreen;
