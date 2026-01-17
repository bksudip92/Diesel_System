// import { useRouter } from 'expo-router';
// import React from 'react';
// import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

// interface MenuItem {
//   id: number;
//   month_name: string,
//   total_diesel : number , 
//   total_fills : number , 
//   first_month : number ,
//   last_month : number
// }

// // Define the MenuListItem props type
// interface MenuListItemProps {
//   item: MenuItem;
//   onPress: (itemId: number) => void;
// }

// const router = useRouter()

// const MenuListItem : React.FC<MenuListItemProps>  = ({ item, onPress }) => (
//   <Pressable onPress={() => onPress(router.navigate(`/edit-vehicle?vehicle=${item.id}`))} style={styles.listItem}>
//     <View>
//   <View style={styles.textContainer}>

//     <Text style={styles.itemTitle}>{item.month_name}</Text>

//     <View style={styles.statsRow}>
//       {item.total_diesel ? (
//         <Text style={styles.subtitleText}>Diesel: {item.total_diesel} L</Text>
//       ) : null}

//       {item.total_fills ? (
//         <Text style={styles.statusText}>Fills: {item.total_fills}</Text>
//       ) : null}
//     </View>
//   </View>
//   </View>
//   </Pressable>
// );

// interface ListMenuProps {
//   menuItems: MenuItem[];
//   handleItemPress: (itemId: number) => void;
// }

// function ListMenu({ menuItems, handleItemPress }: ListMenuProps) {
//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={Array.isArray(menuItems) ? menuItems : []}
//         renderItem={({ item }) => (
//           <MenuListItem item={item} onPress={handleItemPress} />
//         )}
//         keyExtractor={(item) => item.id.toString()}
//         scrollEnabled={false}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//    listItem: {
//     flexDirection: 'row',       // Align Text Block and Icon horizontally
//     alignItems: 'center',       // Vertically center the icon
//     justifyContent: 'space-between', 
//     backgroundColor: '#fff',
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,       // Optional separator line
//     borderBottomColor: '#f0f0f0',
//     borderRadius : 10,
//     margin : 5

//   },
//   textContainer: {
//     flex: 1,                    // Take up all available width minus the icon
//     margin: 5,        
//   },
//   itemTitle: {
//     fontSize: 16,
//     fontWeight: '600',          // Semi-bold for hierarchy
//     color: '#333',
//     marginBottom: 20,            // Space between Title and Stats
//   },
//   statsRow: {
//     flexDirection: 'row',       // Places Diesel and Fills side-by-side
//     alignItems: 'center',
//     gap: 15,                    // Adds space between the two stat items
//   },
//   subtitleText: {
//     fontSize: 15,
//     color: '#666',
//     fontWeight : 'bold',
//     backgroundColor: '#F2F4F7', // Optional: subtle pill background
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//     overflow: 'hidden',
//   },
//   statusText: {
//     fontSize: 15,
//     color: '#007AFF',           // Blue to distinguish it
//     fontWeight: 'bold',
//   },
//   separator: {
//     height: 1,
//     backgroundColor: '#e5e5e5',
//     marginHorizontal: 12,
//   },
// });

// export default ListMenu