import { useEffect, useState } from 'react'
import { supabase, type Session } from '@/lib/supabase'

export interface AuthState {
  session: Session | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) {
          setSession(data.session)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (isMounted) setSession(sess)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}
