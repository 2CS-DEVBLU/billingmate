import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    console.log('[v0] Company update API called')
    
    const { 
      companyId, 
      name, 
      country_code, 
      cnpj_cpf, 
      vat_number, 
      industry,
      street,
      number,
      zip_code,
      neighborhood,
      city,
      state,
      country
    } = await req.json()

    console.log('[v0] Update request for company:', companyId)

    const supabase = await createClient()

    // Verify user has permission to update this company
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[v0] No authenticated user')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] User ID:', user.id)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role, company_account_role, is_admin')
      .eq('id', user.id)
      .single()

    console.log('[v0] Profile data:', profile)
    console.log('[v0] Profile error:', profileError)

    if (!profile) {
      console.log('[v0] Profile not found')
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user is company admin or system admin
    const isCompanyAdmin = profile.company_account_role === 'admin' || profile.is_admin
    const isUserCompany = profile.company_id === companyId
    const isSystemAdmin = profile.role === 'admin'

    console.log('[v0] Authorization check:', {
      isCompanyAdmin,
      isUserCompany,
      isSystemAdmin,
      company_id: profile.company_id,
      requested_company: companyId
    })

    if (!isUserCompany && !isSystemAdmin) {
      console.log('[v0] User not authorized - wrong company')
      return Response.json({ error: 'Unauthorized to update this company' }, { status: 403 })
    }

    if (!isCompanyAdmin && !isSystemAdmin) {
      console.log('[v0] User not authorized - not admin')
      return Response.json({ error: 'Only administrators can update company settings' }, { status: 403 })
    }

    console.log('[v0] Authorization passed, updating company')

    const updateData = {
      name,
      country_code,
      cnpj_cpf: country_code === 'BR' ? cnpj_cpf : null,
      vat_number: country_code !== 'BR' ? vat_number : null,
      industry,
      street,
      number,
      zip_code,
      neighborhood,
      city,
      state,
      country,
      updated_at: new Date().toISOString(),
    }
    
    console.log('[v0] Update data being sent:', JSON.stringify(updateData, null, 2))

    const { data: updatedData, error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select()

    console.log('[v0] Update result:', updatedData)
    console.log('[v0] Update error:', updateError)

    if (updateError) {
      console.error('[v0] Error updating company:', updateError)
      return Response.json({ error: 'Failed to update company' }, { status: 500 })
    }

    console.log('[v0] Company updated successfully')
    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in company update:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
