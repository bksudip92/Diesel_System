import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

function MonthlyReports() {
  const params = useLocalSearchParams()
  const MonthName = params.month
  console.log(MonthName);
  
  return (
    <View>
      <Text>This is Logs of Month {MonthName} </Text>
    </View>
  )
}

export default MonthlyReports 