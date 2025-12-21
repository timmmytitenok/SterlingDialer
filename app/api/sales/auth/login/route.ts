import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Find sales person by email
    const { data: salesPerson, error } = await supabase
      .from('sales_team')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !salesPerson) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check password
    if (!salesPerson.password_hash) {
      return NextResponse.json({ error: 'Account not set up. Please contact admin.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, salesPerson.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if account is active
    if (salesPerson.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active. Please contact admin.' }, { status: 403 });
    }

    // Return sales person data (exclude password)
    const { password_hash, ...safeData } = salesPerson;

    return NextResponse.json({ 
      success: true, 
      salesPerson: safeData,
    });
  } catch (error: any) {
    console.error('Sales login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

