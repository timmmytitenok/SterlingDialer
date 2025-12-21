import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { salesPersonId, salesPersonEmail, salesPersonName } = await req.json();

    if (!salesPersonId || !salesPersonEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Set impersonation cookie
    const cookieStore = await cookies();
    
    // Store sales person info in a cookie for the sales dashboard to use
    cookieStore.set('sales_impersonate', JSON.stringify({
      id: salesPersonId,
      email: salesPersonEmail,
      name: salesPersonName,
      isAdmin: true,
      timestamp: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    console.log(`🔐 Admin impersonating sales person: ${salesPersonEmail}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in impersonate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to impersonate' },
      { status: 500 }
    );
  }
}

// Clear impersonation
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('sales_impersonate');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to clear impersonation' },
      { status: 500 }
    );
  }
}

