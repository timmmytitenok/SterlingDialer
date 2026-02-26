import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    console.log('📧 Contact form API called');
    
    const body = await request.json();
    const { name, email, phone, message } = body;

    console.log('📋 Form data:', { name, email, phone: phone ? 'provided' : 'not provided', messageLength: message?.length });

    // Validate required fields
    if (!name || !email || !message) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment variables!');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    console.log('✅ Resend API key found, sending email...');

    const isWaitlistSubmission = typeof message === 'string' && message.includes('WAITLIST SIGNUP');
    const emailSubject = isWaitlistSubmission
      ? 'Joining Waitlist'
      : `Contact Form Submission from ${name}`;
    const emailHeading = isWaitlistSubmission
      ? 'Joining Waitlist'
      : 'New Contact Form Submission';

    // Send email using Resend
    const data = await resend.emails.send({
      from: 'Sterling Dialer Contact <onboarding@resend.dev>', // You'll update this with your domain later
      to: ['timothytitenok9@gmail.com'], // Must use your Resend signup email in testing mode
      replyTo: email,
      subject: emailSubject,
      html: `
        <h2>${emailHeading}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    console.log('✅ Email sent successfully!', data);
    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Contact form error:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      name: error.name
    });
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

