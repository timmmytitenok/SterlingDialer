import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const logs: string[] = [];
  
  try {
    logs.push('🔍 Starting transaction test...');
    
    const supabase = createServiceRoleClient();
    
    // Check table schema
    logs.push('📋 Checking balance_transactions table schema...');
    const { data: schema, error: schemaError } = await supabase
      .from('balance_transactions')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      logs.push(`❌ Schema check error: ${JSON.stringify(schemaError)}`);
    } else {
      logs.push(`✅ Table exists, sample columns: ${JSON.stringify(Object.keys(schema?.[0] || {}))}`);
    }
    
    // Try to insert a test transaction
    logs.push('');
    logs.push('💾 Attempting test transaction insert...');
    logs.push('Data to insert:');
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000',
      amount: 25,
      type: 'credit',
      description: 'TEST TRANSACTION - DELETE ME',
      stripe_payment_intent_id: 'pi_test_' + Date.now(),
      balance_after: 25,
    };
    logs.push(JSON.stringify(testData, null, 2));
    
    const { data: insertData, error: insertError } = await supabase
      .from('balance_transactions')
      .insert(testData)
      .select();
    
    logs.push('');
    if (insertError) {
      logs.push('❌ INSERT FAILED!');
      logs.push('Error details:');
      logs.push(JSON.stringify(insertError, null, 2));
    } else {
      logs.push('✅ INSERT SUCCEEDED!');
      logs.push('Inserted data:');
      logs.push(JSON.stringify(insertData, null, 2));
      
      // Clean up test transaction
      if (insertData && insertData[0]) {
        await supabase
          .from('balance_transactions')
          .delete()
          .eq('id', insertData[0].id);
        logs.push('🧹 Test transaction deleted');
      }
    }
    
    // Check existing transactions with stripe payment IDs
    logs.push('');
    logs.push('📊 Checking existing Stripe transactions...');
    const { data: existing, error: existingError } = await supabase
      .from('balance_transactions')
      .select('*')
      .not('stripe_payment_intent_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (existingError) {
      logs.push(`❌ Query error: ${JSON.stringify(existingError)}`);
    } else {
      logs.push(`✅ Found ${existing?.length || 0} transactions with Stripe payment IDs`);
      if (existing && existing.length > 0) {
        logs.push('Latest transactions:');
        existing.forEach((t: any, i: number) => {
          logs.push(`  ${i + 1}. $${t.amount} - ${t.type} - ${t.created_at}`);
        });
      }
    }
    
  } catch (error: any) {
    logs.push('');
    logs.push('❌ UNEXPECTED ERROR:');
    logs.push(error.message || String(error));
    logs.push(error.stack || '');
  }
  
  // Return as HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Transaction Debug</title>
  <style>
    body { 
      font-family: 'Courier New', monospace; 
      background: #0a0a0a; 
      color: #00ff00; 
      padding: 20px;
      line-height: 1.6;
    }
    pre { 
      white-space: pre-wrap; 
      word-wrap: break-word;
    }
    .success { color: #00ff00; }
    .error { color: #ff0000; }
    .info { color: #00aaff; }
  </style>
</head>
<body>
  <h1>🔍 Transaction Debug Log</h1>
  <pre>${logs.join('\n')}</pre>
  <hr>
  <p><a href="/api/debug/test-transaction" style="color: #00aaff;">🔄 Refresh</a></p>
</body>
</html>
  `;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

