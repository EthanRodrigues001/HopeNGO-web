import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    // Check if admin OR user updating their own registration
    const isAdmin = userDoc.data()?.role === 'admin';
    
    const regDoc = await adminDb.doc(`participantRegistrations/${id}`).get();
    if (!regDoc.exists) return new NextResponse('Reg not found', { status: 404 });
    const regData = regDoc.data()!;

    if (!isAdmin && regData.participantId !== decoded.uid) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const updates = await req.json();

    // If non-admin, they probably can only cancel
    if (!isAdmin && updates.status !== 'cancelled') {
        return new NextResponse('Forbidden update', { status: 403 });
    }

    await adminDb.doc(`participantRegistrations/${id}`).update(updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    const isAdmin = userDoc.data()?.role === 'admin';
    if (!isAdmin) return new NextResponse('Forbidden', { status: 403 });

    await adminDb.doc(`participantRegistrations/${id}`).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
