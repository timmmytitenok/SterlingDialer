import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
  const padded = base.length < 4 ? base + 'SALE'.slice(0, 4 - base.length) : base;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return padded + random;
}

export async function POST(req: Request) {
  try {
    const { full_name, email, phone, password } = await req.json();

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // First check if sales_team table exists
    const { error: tableCheckError } = await supabase
      .from('sales_team')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.error('Sales team table error:', tableCheckError);
      if (tableCheckError.message?.includes('does not exist') || tableCheckError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Sales team system not set up yet. Please run the SQL migration first.' 
        }, { status: 500 });
      }
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('sales_team')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate unique referral code
    let referralCode = generateReferralCode(full_name);
    let attempts = 0;
    
    while (attempts < 10) {
      const { data: codeExists } = await supabase
        .from('sales_team')
        .select('id')
        .eq('referral_code', referralCode)
        .single();
      
      if (!codeExists) break;
      
      referralCode = generateReferralCode(full_name);
      attempts++;
    }

    // Create sales person
    const { data: newPerson, error } = await supabase
      .from('sales_team')
      .insert({
        full_name,
        email: email.toLowerCase(),
        phone: phone || null,
        password_hash,
        referral_code: referralCode,
        commission_type: 'recurring', // Default to recurring
        commission_rate: 0.35,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sales person:', error);
      throw error;
    }

    // Return sales person data (exclude password)
    const { password_hash: _, ...safeData } = newPerson;

    return NextResponse.json({ 
      success: true, 
      salesPerson: safeData,
    });
  } catch (error: any) {
    console.error('Sales signup error:', error);
    
    // Check if it's a table doesn't exist error
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Sales team database not set up. Please run the SQL migration in Supabase.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}

