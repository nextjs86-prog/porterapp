import React, { useState, useRef, useEffect } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, Modal, FlatList, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, SIZES } from '../utils/theme';

export const LOCATIONIQ_KEY = 'pk.0797f33a04259b86da95e1f770201fd7';

export default function LocationAutocomplete({ placeholder, onSelect, value }) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  const search = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (text.length < 3) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get('https://api.locationiq.com/v1/autocomplete', {
          params: { key: LOCATIONIQ_KEY, q: text, countrycodes: 'in', format: 'json', limit: 8 },
        });
        setResults(res.data || []);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (item) => {
    setQuery(item.display_name);
    setResults([]);
    setVisible(false);
    onSelect({ address: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  };

  const open = () => {
    setVisible(true);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const clearSearch = () => { setQuery(''); setResults([]); };

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={open} activeOpacity={0.7}>
        <Text style={[styles.fieldText, !query && styles.fieldPlaceholder]} numberOfLines={1}>
          {query || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.backBtn}>
              <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.searchBar}>
              <Icon name="magnify" size={20} color={COLORS.gray} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder={placeholder}
                placeholderTextColor={COLORS.gray}
                value={query}
                onChangeText={search}
              />
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : query.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Icon name="close-circle" size={18} color={COLORS.gray} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)}>
                <Icon name="map-marker-outline" size={20} color={COLORS.gray} style={styles.resultIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{item.display_place || item.display_name}</Text>
                  <Text style={styles.resultSubtitle} numberOfLines={1}>{item.display_address || ''}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              query.length >= 3 && !loading ? (
                <Text style={styles.emptyText}>No results found</Text>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field:            { justifyContent: 'center', backgroundColor: COLORS.bgLight, borderRadius: SIZES.radiusSm, height: 44, paddingHorizontal: 12 },
  fieldText:        { fontSize: SIZES.base, color: COLORS.textPrimary },
  fieldPlaceholder: { color: COLORS.gray },
  modalContainer:   { flex: 1, backgroundColor: COLORS.white },
  searchHeader:     { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  backBtn:          { padding: 4 },
  searchBar:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgLight, borderRadius: SIZES.radiusLg, paddingHorizontal: 12, height: 44 },
  searchInput:      { flex: 1, fontSize: SIZES.base, color: COLORS.textPrimary },
  resultRow:        { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.bgLight },
  resultIcon:       { marginTop: 2, marginRight: 12 },
  resultTitle:      { fontSize: SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  resultSubtitle:   { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  emptyText:        { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontSize: SIZES.sm },
});
