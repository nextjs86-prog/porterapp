import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { COLORS, SIZES } from '../utils/theme';

const LOCATIONIQ_KEY = 'YOUR_LOCATIONIQ_API_KEY';

export default function LocationAutocomplete({ placeholder, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (text.length < 3) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get('https://api.locationiq.com/v1/autocomplete', {
          params: { key: LOCATIONIQ_KEY, q: text, countrycodes: 'in', format: 'json', limit: 5 },
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
    onSelect({ address: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  };

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={search}
          placeholderTextColor={COLORS.gray}
        />
        {loading && <ActivityIndicator size="small" color={COLORS.primary} style={styles.spinner} />}
      </View>
      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((item) => (
            <TouchableOpacity key={item.place_id} style={styles.item} onPress={() => handleSelect(item)}>
              <Text numberOfLines={2} style={styles.itemText}>{item.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: { position: 'relative', justifyContent: 'center' },
  input:    { fontSize: SIZES.base, color: COLORS.textPrimary, backgroundColor: COLORS.bgLight, borderRadius: SIZES.radiusSm, height: 44, paddingHorizontal: 12, paddingRight: 36 },
  spinner:  { position: 'absolute', right: 12 },
  dropdown: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusSm, marginTop: 4, elevation: 4, maxHeight: 220, overflow: 'hidden' },
  item:     { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  itemText: { fontSize: SIZES.sm, color: COLORS.textPrimary },
});
