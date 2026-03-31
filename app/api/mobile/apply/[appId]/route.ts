import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function DELETE(req: Request, context: any) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const decodedToken = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    const uid = decodedToken.uid;

    const { appId } = await context.params;
    const appDoc = await adminDb.doc(`volunteerApplications/${appId}`).get();
    if (!appDoc.exists) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });

    const app = appDoc.data()!;
    if (app.volunteerId !== uid) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    if (app.status === 'cancelled') return new Response(JSON.stringify({ error: 'Already cancelled' }), { status: 400, headers: corsHeaders });

    await adminDb.doc(`volunteerApplications/${appId}`).update({
      status: 'cancelled',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return new Response(JSON.stringify({ status: 'cancelled' }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('Withdraw application error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
