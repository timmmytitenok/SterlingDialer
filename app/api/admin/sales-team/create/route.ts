import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
  const padded = base.length < 4 ? base + 'SALE'.slice(0, 4 - base.length) : base;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return padded + random;
}

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { full_name, email, phone, commission_type } = await req.json();

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('sales_team')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

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
        referral_code: referralCode,
        commission_type: commission_type || 'recurring',
        commission_rate: 0.35,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sales person:', error);
      throw error;
    }

    return NextResponse.json({ success: true, salesPerson: newPerson });
  } catch (error: any) {
    console.error('Error in create sales person API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create sales person' },
      { status: 500 }
    );
  }
}

