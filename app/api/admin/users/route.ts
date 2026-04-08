import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search')?.toLowerCase() || '';

    const session = (await cookies()).get("session")?.value;
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
    if (userSnap.data()?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    let query: any = adminDb.collection("users");
    if (role) {
      query = query.where("role", "==", role);
    }
    
    // We only want approved coordinators for assignment
    if (role === 'event_coordinator') {
      query = query.where("isApproved", "==", true);
    }

    const snap = await query.get();
    let users = snap.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));

    if (search) {
      users = users.filter((u: any) => 
        (u.fullName && u.fullName.toLowerCase().includes(search)) || 
        (u.email && u.email.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
