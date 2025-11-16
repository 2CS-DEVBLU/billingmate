export async function sendInvitationEmail({
  email,
  companyName,
  invitationUrl,
}: {
  email: string
  companyName: string
  invitationUrl: string
}) {
  console.log('[v0] Sending invitation email to:', email)
  console.log('[v0] Invitation URL:', invitationUrl)
  console.log('[v0] Company:', companyName)

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log('[v0] Email service not configured. Invitation URL:', invitationUrl)
    console.log('[v0] In production, configure RESEND_API_KEY and verify domain at https://resend.com/domains')
    return { success: true, method: 'manual', url: invitationUrl }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: email,
        subject: `You've been invited to join ${companyName} on BillingMate`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #1a1a1a; margin: 0 0 20px 0;">Welcome to BillingMate</h1>
                <p style="font-size: 16px; margin: 0 0 15px 0;">You've been invited to join <strong>${companyName}</strong> on BillingMate.</p>
                <p style="font-size: 16px; margin: 0 0 25px 0;">Click the button below to accept your invitation and create your account.</p>
                <a href="${invitationUrl}" style="display: inline-block; background-color: #0070f3; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500; font-size: 16px;">Accept Invitation</a>
              </div>
              <p style="font-size: 14px; color: #666; margin: 20px 0 0 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
              <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">If the button doesn't work, copy and paste this link into your browser: ${invitationUrl}</p>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.log('[v0] Email API error:', error.message)
      // Return success with manual method and URL for fallback
      return { success: true, method: 'manual', url: invitationUrl, error: error.message }
    }

    const data = await response.json()
    console.log('[v0] Email sent successfully:', data)
    return { success: true, method: 'email', emailId: data.id }
  } catch (error) {
    console.error('[v0] Error sending invitation email:', error)
    // Return success with manual method so invitation still works
    return { success: true, method: 'manual', url: invitationUrl }
  }
}
