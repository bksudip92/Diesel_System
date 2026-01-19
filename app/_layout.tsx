// import { useAuth } from '@/hooks/useAuth';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { Slot, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

function Screen() {
  // const { place, setPlace } = usePlace()

  // const { email , session , loading } = useAuth() // Receiving late response that's why useState should render when this receive
  // navState logging 4 times before this receive // that's why email and session are in dependency array
  
  // const [ place , setPlace ] = useState()
  // const [ Session , setSession ] = useState()
  // const navState = useRootNavigationState()
  

  // const [ email , setemail] = useState()
  // if ( loading){ 
  //   return null
  // }
  // function useProtectedRoute() {

  //    useEffect(() => {
      
  //     if (!navState?.key) {
  //       console.log("navigation state",navState);
  //        return;
  //     }
    
  //     if(session?.user.user_metadata.email_verified){
  //       console.log("Is  session",session?.user.user_metadata.email_verified);
  //       getPlace()
  //       //setloading(false)
  //       // setverified(true)
  //       // setemail(session?.user.email as any)
  //     }
  //     else {
  //       //router.push('/login')
  //       console.log('redirected to login');
  //     }
  // },[ session, loading])
  //   }
    // useProtectedRoute()

  //   const getPlace = async () => {
  //     const { data , error } = await supabase
  //     .from('users')
  //     .select('*')
  //     .eq('email',email)
  //     .single()

  //     if (data ) {
  //       try {
  //         await AsyncStorage.setItem('user_info', JSON.stringify(data));
  //       } catch (e) {
  //         console.error("Failed to save", e);
  //       }
  //       // console.log("is sending place ", data.place);
  //       // router.replace(`/(tabs)?place=${encodeURIComponent(data.place)}`)
  //     }
  //     if (!data && error){
  //       Alert.alert("Can't find User's Place, Please fill details or Register Yourself") 
  //       console.log(error);
  //     }
  //   }

  //   if (loading && !session) {
  //     console.log("lading",loading , session);
      
  //     return null ; // Or your Splash Screen
  //   }
   
  return (
    <Stack>
     
        <Stack.Screen name="(tabs)" 
          options={{ headerShown: false }}
        />
           
      <Stack.Screen name="login" 
      options={{
        headerShown : false
      }}/>

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

export default function RootLayout() {
  return (
    <AuthProvider>
       <AuthLoader/>
    </AuthProvider>
  );
}

const AuthLoader: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
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