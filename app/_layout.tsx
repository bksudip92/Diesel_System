import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default function RootLayout() {

  const { email , session , loading } = useAuth() // Receiving late response that's why useState should render when this receive
  // navState logging 4 times before this receive // that's why email and session are in dependency array
  
  // const [ verified , setverified ] = useState(false)
  const navState = useRootNavigationState()
  // const [ email , setemail] = useState()
  const router = useRouter()

  function useProtectedRoute() {

     useEffect(() => {
      
      if (!navState?.key) {
        console.log("navigation state",navState);
        
         return;
      }
    
      if(session?.user.user_metadata.email_verified){
        getPlace()
        //setloading(false)
        // setverified(true)
        // setemail(session?.user.email as any)
      }
      else {
        //router.push('/login')
        console.log('redirected to login');
      }
  },[email , session , navState ])
    }
    useProtectedRoute()

    const getPlace = async () => {
      const { data , error } = await supabase
      .from('users')
      .select('*')
      .eq('email',email)
      .single()
  
      if ( data ){
        const place = data.place
        router.replace(`/(tabs)?place=${encodeURIComponent(place)}`)
      }
      if (!data && error){
        Alert.alert("Can't find User's Place, Please fill details or Register Yourself") 
        console.log(error);
      }
    }
   
  return (
    <Stack>
      
      <Stack.Screen name="login" 
      options={{
        headerShown : false
      }}/>

      <Stack.Screen name="(tabs)" options={{ headerShown: false}}/>

      <Stack.Screen
        name="qr-scanner"
        options={{
          presentation: 'modal', 
          gestureEnabled: false, 
        }}
      />

      <Stack.Screen name="qr-show" />
      <Stack.Screen name='fill-fuel'/>
      <Stack.Screen name='month'
        options={{
          headerTitle : 'Monthly Reports'
        }}
      />
      <Stack.Screen name='month_name'/>
      <Stack.Screen name='yearly-report'/>
      <Stack.Screen name='all-vehicles'
      options={{
        headerTitle : "All Vehicles List"
      }}
      />
      <Stack.Screen name='edit-vehicle'
      options={{
        headerTitle : "Vehicle Information"
      }}
      />

    </Stack>
  )
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
})