import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const impersonateCookie = cookieStore.get('sales_impersonate');
    
    if (!impersonateCookie) {
      return NextResponse.json({ impersonating: false });
    }

    const impersonateData = JSON.parse(impersonateCookie.value);
    
    // Check if the impersonation is still valid (within 1 hour)
    const timestamp = impersonateData.timestamp || 0;
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    if (timestamp < oneHourAgo) {
      // Expired - clear the cookie
      cookieStore.delete('sales_impersonate');
      return NextResponse.json({ impersonating: false });
    }

    return NextResponse.json({
      impersonating: true,
      salesPersonId: impersonateData.id,
      salesPersonEmail: impersonateData.email,
      salesPersonName: impersonateData.name,
      isAdmin: impersonateData.isAdmin,
    });
  } catch (error: any) {
    console.error('Error checking impersonation:', error);
    return NextResponse.json({ impersonating: false });
  }
}

