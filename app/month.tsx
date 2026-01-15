import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';


interface MonthItem {
  id: number;
  month_name : string;
  total_diesel : number,
  total_fills : number,
  first_date : number, 
  last_date : number
}

// Define the MenuListItem props type
interface MenuListItemProps {
  item: MonthItem;
  onPress: (itemId: number) => void;
}

function Months() {
  const now = new Date();
  const router = useRouter()
  const [ data , setData] = useState<MonthItem>()
  // const [ canbeChecked , setcanbeChecked ] = useState(false)

  useEffect(() => {
    GetMonths()
  
  }, [])

  const GetMonths = async () => {
    const { data , error } = await supabase
      .from('monthly_reports')
      .select('*')

    if (data) {
      setData(data as any)
      console.log(data);
    }
    else if (error){
      Alert.alert('Unable to Fetch Months')
    }
  }

  const RefreshData = async () => {
    const prevDate = new Date(now.getFullYear(), now.getMonth(),1)
    if(now > prevDate ) {
      const FirstDatePrev = new Date(now.getFullYear(), now.getMonth() - 1, 2).toISOString().slice(0, 10);
      const LastDatePrev = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  
      let total_diesel : number = 0
      let total_fills : number = 0
  
      const { data, error: GetError } = await supabase
        .from('fuel_logs')
        .select('filled_liters.sum(), filled_liters.count()')
        .gte('transaction_date', FirstDatePrev)
        .lt('transaction_date', LastDatePrev);
  
        if (GetError) {
          Alert.alert("Unable to get Monthly Data. Please Try Again")
          console.error("Fetch Error:", GetError);
          throw GetError;
        }
    
        if (data && data.length > 0) {
          total_diesel = data[0].sum ?? 0;  
          total_fills = data[0].count ?? 0;
          console.log("get data");
          
        }
      
      const MonthName = now.toLocaleString('default', { month: 'long' });
      const period = MonthName + " " + now.getFullYear();
  
      const { error: UpsertError } = await supabase
        .from('monthly_reports')
        .upsert({
          month_name: period,
          total_diesel: total_diesel,
          total_fills: total_fills,
          first_date : FirstDatePrev,
          last_date : LastDatePrev
        }); 

      if (UpsertError) {
        Alert.alert("Unable to Insert Data. Please Try Again")
        console.error("Upsert Error:", UpsertError);
        throw UpsertError;
      }
    }
    else {
      Alert.alert("No new Data to Fetch")
    }
  }

  const handleItemPress = async () => {
    
  }

  const MenuListItem : React.FC<MenuListItemProps>  = ({ item, onPress }) => (
    <Pressable onPress={() => router.navigate(`/month_name?month=${item.month_name}`)} style={styles.listItem}>
      <View>
    <View style={styles.textContainer}>
  
      <Text style={styles.itemTitle}>{item.month_name}</Text>
  
      <View style={styles.statsRow}>
        {item.total_diesel ? (
          <Text style={styles.subtitleText}>Diesel: {item.total_diesel} L</Text>
        ) : null}
  
        {item.total_fills ? (
          <Text style={styles.statusText}>Fills: {item.total_fills}</Text>
        ) : null}
      </View>
    </View>
    </View>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      <FlatList
        data={Array.isArray(data) ? data : []}
        renderItem={({ item }) => (
          <MenuListItem item={item} onPress={handleItemPress} />
        )}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Pressable onPress={RefreshData} style={styles.button}> 
        <Text style={styles.buttonText}>Refresh Data </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
 
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
   listItem: {
    flexDirection: 'row',       // Align Text Block and Icon horizontally
    alignItems: 'center',       // Vertically center the icon
    justifyContent: 'space-between', 
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,       // Optional separator line
    borderBottomColor: '#f0f0f0',
    borderRadius : 10,
    margin : 5

  },
  textContainer: {
    flex: 1,                    // Take up all available width minus the icon
    margin: 5,        
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',          // Semi-bold for hierarchy
    color: '#333',
    marginBottom: 20,            // Space between Title and Stats
  },
  statsRow: {
    flexDirection: 'row',       // Places Diesel and Fills side-by-side
    alignItems: 'center',
    gap: 15,                    // Adds space between the two stat items
  },
  subtitleText: {
    fontSize: 15,
    color: '#666',
    fontWeight : 'bold',
    backgroundColor: '#F2F4F7', // Optional: subtle pill background
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: 15,
    color: '#007AFF',           // Blue to distinguish it
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 12,
  },
})

export default Months