import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default function YearlyReport() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yearly Report</Text>
      <Text style={styles.body}>Coming soon.</Text>
    </View>
  );
}
