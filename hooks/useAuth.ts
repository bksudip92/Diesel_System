import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [ email , setEmail ] = useState()

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setEmail(data?.session?.user.email as any )
      setLoading(false)
    })

    // Listen for auth changes (login / logout / token refresh)
    // const { data: listener } = supabase.auth.onAuthStateChange(
    //   (_event, session) => {
    //     setSession(session)
    //   }
    // )

    return () => {
      //listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading, email }
}
