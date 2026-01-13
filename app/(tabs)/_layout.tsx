import React from 'react';


import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs>
      <Tabs.Screen
      name='index'
      options={{
        title : "Dashboard",
        tabBarIcon : ({color, size}) => <Icon name="home" color={color} size={size}
        />
      }
    }
    />
    <Tabs.Screen
      name='new-vehicle'
      options={{
        title : "Create",
        tabBarIcon : ({color, size}) => <Icon name="add-circle-outline" color={color} size={size}/>
      }
    }
    />
      <Tabs.Screen
      name='reports'
      options={{
        title : "Reports",
        tabBarIcon : ({color, size}) => <Icon name='receipt-sharp'color={color} size={size}/>
      }
    }/>
{/* 
      <Tabs.Screen
            name='all-vehicles'
            options={{
              href : null
            }
          }/>

      <Tabs.Screen
              name='yearly-report'
              options={{
                href : null
              }
            }/>

        <Tabs.Screen
              name='month_name'
              options={{
                href : null
              }
            }/>
          <Tabs.Screen
            name='month'
            options={{
              href : null
            }}
            /> */}

    </Tabs>
  );
}
