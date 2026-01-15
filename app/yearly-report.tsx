import { supabase } from '@/lib/supabase';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function YearlyReport() {

  useEffect(() => {
    FetchData()
  }, [])
  
  async function FetchData () {
    const { data  , error : GetError } = await supabase
    .from('yearly_reports')
    .select('*')

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
