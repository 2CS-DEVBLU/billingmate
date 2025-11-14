import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
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

    const supabase = await createClient()

    // Verify user has permission to update this company
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.company_id !== companyId && profile.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized to update this company' }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update({
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
      })
      .eq('id', companyId)

    if (updateError) {
      console.error('[v0] Error updating company:', updateError)
      return Response.json({ error: 'Failed to update company' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in company update:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
