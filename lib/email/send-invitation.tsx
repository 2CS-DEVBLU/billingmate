export async function sendInvitationEmail({
  email,
  companyName,
  invitationUrl,
}: {
  email: string
  companyName: string
  invitationUrl: string
}) {
  const apiKey = process.env.RESEND_API_KEY

  console.log('[v0] Sending invitation email to:', email)
  console.log('[v0] Invitation URL:', invitationUrl)
  console.log('[v0] Company:', companyName)

  if (!apiKey) {
    console.log('[v0] Email service not configured. Invitation URL:', invitationUrl)
    console.log('[v0] In production, configure RESEND_API_KEY environment variable')
    return { success: true, method: 'manual' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Use Resend's test email instead of custom domain
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
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">BillingMate</h1>
              </div>
              
              <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">You're Invited!</h2>
                
                <p style="font-size: 16px; color: #4b5563;">
                  You've been invited to join <strong>${companyName}</strong> on BillingMate - a comprehensive cloud billing management platform.
                </p>
                
                <p style="font-size: 16px; color: #4b5563;">
                  Click the button below to accept your invitation and create your account:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 14px 32px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            font-weight: 600;
                            font-size: 16px;
                            display: inline-block;">
                    Accept Invitation
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="font-size: 14px; color: #667eea; word-break: break-all;">
                  ${invitationUrl}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[v0] Email API error:', errorData.message || 'Unknown error')
      
      console.log('[v0] Email service not configured. Invitation URL:', invitationUrl)
      console.log('[v0] In production, configure RESEND_API_KEY and verify domain at https://resend.com/domains')
      return { success: true, method: 'manual' }
    }

    const data = await response.json()
    console.log('[v0] Email sent successfully:', data.id)
    return { success: true, method: 'email', emailId: data.id }
  } catch (error) {
    console.error('[v0] Error sending email:', error)
    console.log('[v0] Falling back to manual invitation URL sharing')
    console.log('[v0] Invitation URL:', invitationUrl)
    return { success: true, method: 'manual' }
  }
}
