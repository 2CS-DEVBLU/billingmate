export async function sendInvitationEmail(
  email: string,
  invitationUrl: string,
  companyName: string,
  inviterName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] Sending invitation email to:", email)
    console.log("[v0] Invitation URL:", invitationUrl)
    console.log("[v0] Company:", companyName)
    
    // Use Supabase to send invitation email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY || ""}`,
      },
      body: JSON.stringify({
        from: "BillingMate <noreply@billingmate.com>",
        to: [email],
        subject: `Invitation to join ${companyName} on BillingMate`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">BillingMate</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">You've been invited!</h2>
                <p style="color: #4b5563; font-size: 16px;">
                  ${inviterName} has invited you to join <strong>${companyName}</strong> on BillingMate.
                </p>
                <p style="color: #4b5563; font-size: 16px;">
                  BillingMate helps teams manage and optimize their cloud infrastructure costs across multiple providers.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 14px 30px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            display: inline-block;
                            font-weight: bold;
                            font-size: 16px;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} BillingMate. All rights reserved.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] Email API error:", errorData)
      
      // If Resend is not configured, log the invitation URL for development
      if (response.status === 401 || !process.env.RESEND_API_KEY) {
        console.log("[v0] Email service not configured. Invitation URL:", invitationUrl)
        console.log("[v0] In production, configure RESEND_API_KEY environment variable")
        return { success: true } // Don't fail the invitation creation
      }
      
      return { success: false, error: "Failed to send email" }
    }

    const data = await response.json()
    console.log("[v0] Email sent successfully:", data)
    
    return { success: true }
  } catch (error) {
    console.error("[v0] Error sending invitation email:", error)
    // Don't fail the invitation - just log it
    console.log("[v0] Invitation URL for manual sharing:", invitationUrl)
    return { success: true } // Allow invitation to be created even if email fails
  }
}
