import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface MenuItem {
  id: number;
  title: string;
}

// Define the MenuListItem props type
interface MenuListItemProps {
  item: MenuItem;
  onPress: (itemId: number) => void;
}

const MenuListItem : React.FC<MenuListItemProps>  = ({ item, onPress }) => (
  <Pressable onPress={() => onPress(item.id)} style={styles.listItem}>
    <Text style={styles.itemText}>{item.title}</Text>
    <Icon name="chevron-forward" size={24} color="#999" />
  </Pressable>
);

interface ListMenuProps {
  menuItems: MenuItem[];
  handleItemPress: (itemId: number) => void;
}

function ListMenu({ menuItems, handleItemPress }: ListMenuProps) {
  return (
    <View style={styles.container}>
      <FlatList
        data={Array.isArray(menuItems) ? menuItems : []}
        renderItem={({ item }) => (
          <MenuListItem item={item} onPress={handleItemPress} />
        )}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 12,
  },
});

export default ListMenu