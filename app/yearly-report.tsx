import { getYearlyReports } from '@/services/reports';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function YearlyReport() {
  useEffect(() => {
    FetchData()
  }, [])

  async function FetchData () {
    const { data, error: GetError } = await getYearlyReports()

    if(data) {
      console.log(data);
    }
    else if (GetError) {
      console.log(GetError);
    }
  }

  return (
    <View>
      <Text> Yearly Report </Text>
    </View>
  )
}
