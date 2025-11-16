export interface SendInvitationEmailParams {
  email: string
  companyName: string
  invitationUrl: string
}

export interface SendInvitationEmailResult {
  success: boolean
  method: 'email' | 'manual'
  error?: string
}

export async function sendInvitationEmail({
  email,
  companyName,
  invitationUrl,
}: SendInvitationEmailParams): Promise<SendInvitationEmailResult> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  // If no API key is configured, return manual method
  if (!RESEND_API_KEY) {
    console.log("[v0] RESEND_API_KEY not configured - invitation URL:", invitationUrl)
    return {
      success: false,
      method: 'manual',
      error: 'Email service not configured'
    }
  }

  console.log("[v0] Sending invitation email to:", email)
  console.log("[v0] Invitation URL:", invitationUrl)
  console.log("[v0] Company:", companyName)

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
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
                <h1 style="color: white; margin: 0; font-size: 24px;">BillingMate</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">You've been invited!</h2>
                
                <p style="color: #4b5563; font-size: 16px;">
                  You've been invited to join <strong>${companyName}</strong> on BillingMate, 
                  a platform for managing cloud infrastructure billing.
                </p>
                
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${invitationUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 14px 28px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            display: inline-block; 
                            font-weight: 600;
                            font-size: 16px;">
                    Accept Invitation
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Or copy and paste this URL into your browser:
                </p>
                <p style="color: #6b7280; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
                  ${invitationUrl}
                </p>
                
                <p style="color: #9ca3af; font-size: 13px; margin-top: 30px;">
                  This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                <p>© ${new Date().getFullYear()} BillingMate. All rights reserved.</p>
                <p>Powered by 2CS Consulting</p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Email API error:", errorData.message)
      
      // Return manual method for domain verification errors
      if (response.status === 403 && errorData.message?.includes('verify a domain')) {
        console.log("[v0] Domain not verified - returning invitation URL for manual sharing")
        return {
          success: false,
          method: 'manual',
          error: 'Domain verification required'
        }
      }
      
      throw new Error(errorData.message || "Failed to send email")
    }

    const result = await response.json()
    console.log("[v0] Email sent successfully:", result.id)
    
    return {
      success: true,
      method: 'email'
    }
  } catch (error) {
    console.error("[v0] Error sending invitation email:", error)
    console.log("[v0] Invitation URL for manual sharing:", invitationUrl)
    
    return {
      success: false,
      method: 'manual',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
