import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Use separate Resend API key for onboarding emails
const resend = new Resend(process.env.RESEND_ONBOARDING_API_KEY || process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      agencyName,
      nicheDescription,
      calApiKey,
      calEventId,
      googleSheetConfirmed,
      userEmail,
      userId
    } = body;

    // Send detailed onboarding email to Sterling AI team
    await resend.emails.send({
      from: 'Sterling AI <onboarding@resend.dev>',
      to: 'timothytitenok9@gmail.com', // Temporary - both forms send here for now
      subject: `🚀 New AI Agent Setup Request - ${firstName} ${lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0 0 0;
              opacity: 0.9;
            }
            .section {
              margin-bottom: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #667eea;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .section-number {
              background: #667eea;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: bold;
            }
            .info-row {
              display: flex;
              margin-bottom: 12px;
              padding: 10px;
              background: white;
              border-radius: 5px;
            }
            .info-label {
              font-weight: bold;
              min-width: 180px;
              color: #555;
            }
            .info-value {
              color: #333;
              word-break: break-all;
            }
            .highlight {
              background: #fff3cd;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e9ecef;
              color: #666;
              font-size: 14px;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 New AI Agent Setup Request</h1>
              <p>A new user has completed onboarding and is ready for AI activation!</p>
            </div>

            <!-- Section 1: User Information -->
            <div class="section">
              <div class="section-title">
                <span class="section-number">1</span>
                <span>User Information</span>
              </div>
              <div class="info-row">
                <div class="info-label">Full Name:</div>
                <div class="info-value"><strong>${firstName} ${lastName}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Contact Email:</div>
                <div class="info-value">${email}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Account Email:</div>
                <div class="info-value">${userEmail}</div>
              </div>
              <div class="info-row">
                <div class="info-label">User ID (Supabase):</div>
                <div class="info-value"><span class="highlight">${userId}</span></div>
              </div>
              ${agencyName ? `
              <div class="info-row">
                <div class="info-label">Agency Name:</div>
                <div class="info-value"><strong>${agencyName}</strong></div>
              </div>
              ` : `
              <div class="info-row">
                <div class="info-label">Agency Name:</div>
                <div class="info-value"><em style="color: #999;">Not provided (AI will reference as individual agent)</em></div>
              </div>
              `}
              <div class="info-row">
                <div class="info-label">Niche & Products:</div>
                <div class="info-value" style="white-space: pre-wrap;">${nicheDescription}</div>
              </div>
            </div>

            <!-- Section 2: Cal.ai Setup -->
            <div class="section">
              <div class="section-title">
                <span class="section-number">2</span>
                <span>📅 Cal.ai Calendar Configuration</span>
              </div>
              <div class="info-row">
                <div class="info-label">Cal.ai API Key:</div>
                <div class="info-value"><span class="highlight">${calApiKey}</span></div>
              </div>
              <div class="info-row">
                <div class="info-label">Event ID:</div>
                <div class="info-value"><span class="highlight">${calEventId}</span></div>
              </div>
              <div class="warning">
                <strong>⚠️ Cal.ai Webhook URL:</strong> User should have already pasted this URL into their Cal.ai webhook settings:<br/>
                <code style="background: #1e293b; padding: 8px 12px; border-radius: 6px; display: inline-block; margin-top: 8px; color: #22c55e; font-size: 13px;">https://sterlingdialer.com/api/appointments/cal-webhook</code>
              </div>
            </div>

            <!-- Section 3: Google Sheets -->
            <div class="section">
              <div class="section-title">
                <span class="section-number">3</span>
                <span>📊 Lead Data Source</span>
              </div>
              <div class="info-row">
                <div class="info-label">Google Sheet Shared:</div>
                <div class="info-value">
                  <strong style="color: #22c55e;">✓ CONFIRMED</strong> - User has shared their Google Sheet with <strong>SterlingDailer@gmail.com</strong> and granted Editor access.
                </div>
              </div>
              <div class="warning">
                <strong>⚠️ Action Required:</strong> Check your <strong>SterlingDailer@gmail.com</strong> inbox for the Google Sheet share notification. Verify the sheet has the correct lead data format.
              </div>
            </div>

            <!-- Next Steps -->
            <div class="section">
              <div class="section-title">
                <span class="section-number">✓</span>
                <span>Next Steps for Setup</span>
              </div>
              <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Verify Cal.ai API key and Event ID are valid</li>
                <li style="margin-bottom: 10px;">Verify Cal.ai webhook is configured with: <strong>https://sterlingdialer.com/api/appointments/cal-webhook</strong></li>
                <li style="margin-bottom: 10px;">Create N8N workflow for this user and get webhook URL</li>
                <li style="margin-bottom: 10px;">Confirm Google Sheet access and lead data format</li>
                <li style="margin-bottom: 10px;">Configure AI agent with user's specific settings</li>
                <li style="margin-bottom: 10px;">Test dial to verify full integration</li>
                <li style="margin-bottom: 10px;">Update <code>ai_setup_status</code> in Supabase to <code>completed</code></li>
                <li style="margin-bottom: 10px;">Notify user that AI is ready to launch</li>
              </ol>
            </div>

            <div class="footer">
              <p><strong>Sterling AI Onboarding System</strong></p>
              <p>Received: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'long' })}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Onboarding email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send onboarding data' },
      { status: 500 }
    );
  }
}

