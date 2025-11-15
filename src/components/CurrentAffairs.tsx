import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { aiBrain } from '../services/aiBrainModel';

import Icon from 'react-native-vector-icons/MaterialIcons';

interface CurrentAffairItem {
  title: string;
  summary: string;
  source: string;
  date: string;
  relevance: number;
  topics: string[];
}

const CurrentAffairs: React.FC = () => {
  const [news, setNews] = useState<CurrentAffairItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentAffairs();
  }, []);

  const loadCurrentAffairs = async () => {
    try {
      setLoading(true);
      // Autonomous scraping and processing via AI Brain
      const results = await aiBrain.orchestrateTask('Scrape and summarize UPSC-relevant current affairs from VisionIAS, Insights, The Hindu', undefined, { format: 'simplified' });
      const processedNews: CurrentAffairItem[] = results.results.map((r: any) => ({
        title: r.output.title,
        summary: r.output.summary,
        source: r.output.source,
        date: new Date().toLocaleDateString(),
        relevance: r.output.relevance || 0.8,
        topics: r.output.topics || [],
      }));
      setNews(processedNews);
    } catch (error) {
      console.error('News loading error:', error);
      // Fallback mock data
      setNews([{ title: 'Sample News', summary: 'UPSC-relevant update', source: 'The Hindu', date: '2025-11-15', relevance: 0.9, topics: ['Polity'] }]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CurrentAffairItem }) => (
    <TouchableOpacity style={styles.newsCard}>
      <View style={styles.newsHeader}>
        <Text style={styles.newsTitle}>{item.title}</Text>
        <Text style={styles.relevanceBadge}>{Math.round(item.relevance * 100)}%</Text>
      </View>
      <Text style={styles.newsSummary}>{item.summary}</Text>
      <View style={styles.newsFooter}>
        <Text style={styles.newsSource}>{item.source} • {item.date}</Text>
        <View style={styles.topicsContainer}>
          {item.topics.map((topic, idx) => (
            <Text key={idx} style={styles.topicTag}>{topic}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📰 Daily Current Affairs</Text>
      <FlatList
        data={news}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity style={styles.refreshButton} onPress={loadCurrentAffairs}>
        <Icon name="refresh" size={20} color="#FFF" />
        <Text style={styles.refreshText}>Update News</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  newsCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  newsTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  relevanceBadge: { backgroundColor: '#4CAF50', color: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12 },
  newsSummary: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsSource: { fontSize: 12, color: '#9CA3AF' },
  topicsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  topicTag: { backgroundColor: '#E5E7EB', color: '#374151', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 4, fontSize: 12 },
  refreshButton: { flexDirection: 'row', backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  refreshText: { color: '#FFF', fontWeight: '600', marginLeft: 8 },
});

export default CurrentAffairs;
