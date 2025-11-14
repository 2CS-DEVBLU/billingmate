import { createClient } from "@/lib/supabase/server"

export async function getUserWithCompany() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return { user: null, profile: null, company: null, isAdmin: false }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, companies!profiles_company_id_fkey(*)")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.company_id) {
    return { user, profile, company: null, isAdmin: false }
  }

  const company = profile.companies
  
  // Check if user is admin (either is_admin flag or is the admin_user_id)
  const isAdmin = profile.is_admin || company?.admin_user_id === user.id

  return { user, profile, company, isAdmin }
}

export async function checkCompanyRegistrationComplete(companyId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('is_company_registration_complete', { company_id_param: companyId })
  
  if (error) {
    console.error('[v0] Error checking registration:', error)
    return false
  }
  
  return data as boolean
}

export async function requireAdmin() {
  const { isAdmin, user } = await getUserWithCompany()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  if (!isAdmin) {
    throw new Error('Admin access required')
  }
  
  return true
}
