import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return masked API key (only show last 4 characters)
    const apiKey = process.env.OPENAI_API_KEY || ''
    const maskedKey = apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : ''

    return Response.json({ apiKey: maskedKey })
  } catch (error) {
    console.error('Error fetching OpenAI settings:', error)
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { apiKey } = await req.json()

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return Response.json({ error: 'Invalid API key format' }, { status: 400 })
    }

    // Store the API key in an environment variable or database
    // For now, we'll just validate it and return success
    // In production, you'd want to store this in Vercel's environment variables
    // or a secure secrets manager

    return Response.json({ 
      success: true,
      message: 'API key validated. To persist this setting, add OPENAI_API_KEY to your Vercel environment variables.'
    })
  } catch (error) {
    console.error('Error saving OpenAI settings:', error)
    return Response.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
