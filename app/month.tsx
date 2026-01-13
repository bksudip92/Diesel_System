import ListMenu from '@/components/ListMenu';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';


interface MonthItem {
  id: number;
  title: string;
}

function Months() {

  useEffect(() => {
    //GetMonths()
  
  }, [])
  
  //const GetMonths = async () => {
  //   const now = new Date();
  //   const FirstDatePrev = new Date(now.getFullYear(), now.getMonth() - 1,2).toISOString().slice(0, 10);

  //   const LastDatePrev = new Date(now.getFullYear(), now.getMonth() , 1).toISOString().slice(0,10);
  //   const TodayDate = now.getDate().toString();

  //   //const MonthName = now.toLocaleString('default', { month: 'long' });
  //   // const period = now.getFullYear() +" " + MonthName
  //   console.log(FirstDatePrev, LastDatePrev);
    

  //   const { data  , error : GetError } = await supabase
  //     .from('fuel_logs')
  //     .select()
  //     .limit(2)
  //     .gte('transaction_date',FirstDatePrev)
  //     .lt('transaction_timestamp',  LastDatePrev );
    
  //   if (data) {
  //     console.log(data);
  //   }
  //   console.log("rendered");
    
  //}
  const generatedData: MonthItem[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1–12
  
  let idCounter = 1; // Sequential ID starting from 1
  
  for (let year = 2024; year <= currentYear; year++) {
    const startMonth = (year === 2024) ? 1 : 1; // Start from January for each year
    const endMonth = (year < currentYear) ? 12 : currentMonth; // Up to December for past years, or current month for current year
  
    for (let month = startMonth; month < endMonth; month++) {
      const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1));
      generatedData.push({
        id: idCounter,
        title: `${monthName} ${year}`,
      });
      idCounter++;
    }
  }

  const handleItemPress = (itemId: number) => {
    // Map itemId to title for better feedback (optional)
    const selectedItem = generatedData.find(item => item.id === itemId);
    const title = selectedItem?.title || 'Unknown';

    Alert.alert(
      'Item Selected',
      `You pressed: ${title} (ID: ${itemId})`,
      [{ text: 'OK' }]
    );

    // In a real app, you could navigate here, e.g.:
    // if (itemId === 1) navigation.navigate('EditProfile');
    // else if (itemId === 7) performLogout();
  };
  
  console.log(generatedData);

  return (
    <ScrollView style={styles.container}>
      <ListMenu
      menuItems={generatedData}
      handleItemPress={handleItemPress}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container : {
    flex: 1,
    backgroundColor: '#f5f5f5',
  }
})

export default Months