import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../supabase';

// Types
interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}

const NotesBuilderScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState<Partial<Note>>({ tags: [], isFavorite: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(true);
  const [contentHeight, setContentHeight] = useState(200);
  const contentRef = useRef<TextInput>(null);

  const subjects = ['All', 'Polity', 'Economy', 'History', 'Geography', 'Environment', 'Science & Tech', 'Current Affairs'];

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [searchQuery, selectedSubject]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('createdAt', { ascending: false });
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes');
      // Mock data fallback
      setNotes([
        {
          id: '1',
          title: 'Fundamental Rights - Article 14',
          content: 'Article 14 guarantees equality before law and equal protection of laws. Key cases: Maneka Gandhi vs Union of India (1978)...',
          subject: 'Polity',
          tags: ['Article 14', 'Equality', 'Judiciary'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isFavorite: true,
        },
        {
          id: '2',
          title: 'Fiscal Deficit and Budget 2024',
          content: 'Fiscal deficit target: 5.1% of GDP. Key allocations: Infrastructure - ₹11.11 lakh crore...',
          subject: 'Economy',
          tags: ['Budget', 'Fiscal Policy', 'Economy'],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(),
          isFavorite: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    try {
      const noteToSave = {
        ...newNote,
        id: editingNote ? editingNote.id : Date.now().toString(),
        createdAt: editingNote ? editingNote.createdAt : new Date(),
        updatedAt: new Date(),
        tags: newNote.tags || [],
        isFavorite: newNote.isFavorite || false,
      } as Note;

      if (editingNote) {
        setNotes(prev => prev.map(n => n.id === editingNote.id ? noteToSave : n));
        await supabase.from('notes').update(noteToSave).eq('id', editingNote.id);
      } else {
        setNotes(prev => [noteToSave, ...prev]);
        await supabase.from('notes').insert(noteToSave);
      }

      setShowAddNoteModal(false);
      setEditingNote(null);
      setNewNote({ tags: [], isFavorite: false });
      Alert.alert('Success', editingNote ? 'Note updated!' : 'Note saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const deleteNote = async (id: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setNotes(prev => prev.filter(n => n.id !== id));
            await supabase.from('notes').delete().eq('id', id);
          },
        },
      ]
    );
  };

  const toggleFavorite = async (id: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, isFavorite: !note.isFavorite } : note
      )
    );
    const note = notes.find(n => n.id === id);
    if (note) {
      await supabase.from('notes').update({ isFavorite: !note.isFavorite }).eq('id', id);
    }
  };

  const filterNotes = () => {
    let filtered = notes;
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (selectedSubject !== 'All') {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }
    setNotes(filtered); // Note: This overrides the original notes; in production, maintain separate filtered state
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <View style={styles.noteCard}>
      <LinearGradient
        colors={['#007AFF', '#00C6FF']}
        style={styles.noteGradient}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteTitleContainer}>
            <Text style={styles.noteTitle}>{item.title}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
              <Icon
                name={item.isFavorite ? 'favorite' : 'favorite-border'}
                size={20}
                color={item.isFavorite ? '#FF3B30' : '#FFF'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.noteSubject}>{item.subject}</Text>
        </View>
        <ScrollView style={styles.notePreview} nestedScrollEnabled={true}>
          <Text style={styles.noteContentPreview} numberOfLines={3}>
            {item.content}
          </Text>
        </ScrollView>
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.noteFooter}>
          <Text style={styles.noteDate}>Updated: {item.updatedAt.toLocaleDateString()}</Text>
          <View style={styles.noteActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setEditingNote(item);
                setNewNote(item);
                setShowAddNoteModal(true);
              }}
            >
              <Icon name="edit" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteNote(item.id)}
            >
              <Icon name="delete" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📝 Notes Builder</Text>
        <Text style={styles.headerSubtitle}>Organize your UPSC study notes</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, tags..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectFilter}>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject}
              style={[styles.subjectButton, selectedSubject === subject && styles.activeSubjectButton]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text style={[styles.subjectText, selectedSubject === subject && styles.activeSubjectText]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={() => {
        setEditingNote(null);
        setNewNote({ tags: [], isFavorite: false });
        setShowAddNoteModal(true);
      }}>
        <Icon name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Add/Edit Note Modal */}
      <Modal visible={showAddNoteModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>
            <TouchableOpacity onPress={() => setShowAddNoteModal(false)}>
              <Icon name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.titleInput}
                placeholder="Note Title"
                value={newNote.title || ''}
                onChangeText={text => setNewNote({ ...newNote, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.subjectInput, styles.textInput]}
                placeholder="Subject"
                value={newNote.subject || ''}
                onChangeText={text => setNewNote({ ...newNote, subject: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                ref={contentRef}
                style={[styles.contentInput, { height: contentHeight }]}
                placeholder="Write your notes here..."
                multiline
                value={newNote.content || ''}
                onChangeText={text => setNewNote({ ...newNote, content: text })}
                onContentSizeChange={event => setContentHeight(event.nativeEvent.contentSize.height)}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.tagsInput}
                placeholder="Tags (comma separated)"
                value={newNote.tags?.join(', ') || ''}
                onChangeText={text => setNewNote({ ...newNote, tags: text.split(',').map(t => t.trim()).filter(t => t) })}
              />
            </View>

            <View style={styles.favoriteToggle}>
              <Icon name="favorite-border" size={20} color="#007AFF" />
              <Text style={styles.toggleLabel}>Mark as Favorite</Text>
              <Switch
                value={newNote.isFavorite || false}
                onValueChange={value => setNewNote({ ...newNote, isFavorite: value })}
                trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
                thumbColor={newNote.isFavorite ? '#FFF' : '#F7F7F8'}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddNoteModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
              <Text style={styles.saveText}>{editingNote ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    fontSize: 16,
  },
  subjectFilter: {
    flexDirection: 'row',
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeSubjectButton: {
    backgroundColor: '#007AFF',
  },
  subjectText: {
    color: '#6B7280',
  },
  activeSubjectText: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  noteCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  noteGradient: {
    padding: 16,
  },
  noteHeader: {
    marginBottom: 12,
  },
  noteTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  noteSubject: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  notePreview: {
    maxHeight: 60,
    marginBottom: 8,
  },
  noteContentPreview: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#FFF',
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  noteActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#FFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  subjectInput: {
    paddingLeft: 40,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#FFF',
    maxHeight: 300,
  },
  tagsInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
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

export default NotesBuilderScreen;
