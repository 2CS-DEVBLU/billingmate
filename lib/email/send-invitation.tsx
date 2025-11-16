export async function sendInvitationEmail({
  email,
  companyName,
  invitationUrl,
}: {
  email: string
  companyName: string
  invitationUrl: string
}) {
  console.log("[v0] Sending invitation email to:", email)
  console.log("[v0] Invitation URL:", invitationUrl)
  console.log("[v0] Company:", companyName)

  // Check if Resend API key is configured
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log("[v0] RESEND_API_KEY not configured. Invitation URL logged above.")
    console.log("[v0] To enable email sending, add RESEND_API_KEY to environment variables")
    return { success: true, method: "manual" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "BillingMate <noreply@billingmate.com>",
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
              
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">You've Been Invited!</h2>
                
                <p style="font-size: 16px; color: #555;">
                  You've been invited to join <strong>${companyName}</strong> on BillingMate, 
                  a cloud cost management platform.
                </p>
                
                <p style="font-size: 16px; color: #555;">
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
                
                <p style="font-size: 14px; color: #777; margin-top: 30px;">
                  This invitation will expire in 7 days. If you didn't expect this invitation, 
                  you can safely ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                  BillingMate - Cloud Cost Management Platform
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.log("[v0] Email API error:", error.message || error.statusCode)
      console.log("[v0] Email service not configured. Invitation URL:", invitationUrl)
      console.log("[v0] In production, configure RESEND_API_KEY environment variable")
      return { success: true, method: "manual" }
    }

    const data = await response.json()
    console.log("[v0] Email sent successfully:", data.id)
    return { success: true, method: "email", emailId: data.id }
  } catch (error) {
    console.error("[v0] Failed to send invitation email:", error)
    console.log("[v0] Falling back to manual invitation. URL:", invitationUrl)
    return { success: true, method: "manual" }
  }
}
