import { adminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

function fmt(dateVal: any): string | null {
  if (!dateVal) return null;
  if (dateVal._seconds) return new Date(dateVal._seconds * 1000).toISOString();
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toISOString();
  if (dateVal.toDate) return dateVal.toDate().toISOString();
  if (typeof dateVal === "string") return dateVal;
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch event
    const eventSnap = await adminDb.doc(`events/${id}`).get();
    if (!eventSnap.exists) {
      return new NextResponse("Event not found", { status: 404 });
    }
    const ev = eventSnap.data()!;
    const eventDate = fmt(ev.eventDate);

    // Fetch volunteers (approved)
    const volsSnap = await adminDb
      .collection("volunteerApplications")
      .where("eventId", "==", id)
      .where("status", "==", "approved")
      .get();
    const volunteers = volsSnap.docs.map((d) => ({
      name: d.data().volunteerName || "Unknown",
      attendance: d.data().attendance || "unmarked",
    }));

    // Fetch donations
    let donations: { donorName: string; amount: number }[] = [];
    let totalDonated = 0;
    try {
      const dSnap = await adminDb
        .collection("donations")
        .where("eventId", "==", id)
        .get();
      donations = dSnap.docs.map((d) => ({
        donorName: d.data().donorName || "Anonymous",
        amount: d.data().amount || 0,
      }));
      totalDonated = donations.reduce((s, d) => s + d.amount, 0);
    } catch { /* ignore */ }

    // Fetch coordinator field report images
    let fieldImages: string[] = [];
    let coordinatorNote = "";
    let coordinatorReporterName = "";
    try {
      const crSnap = await adminDb
        .collection("coordinatorReports")
        .where("eventId", "==", id)
        .get();
      crSnap.docs.forEach((doc) => {
        const d = doc.data();
        if (Array.isArray(d.imageUrls)) fieldImages.push(...d.imageUrls);
        if (!coordinatorNote && d.notes) coordinatorNote = d.notes;
        if (!coordinatorReporterName && d.coordinatorName) coordinatorReporterName = d.coordinatorName;
      });
    } catch { /* ignore */ }

    // Attendance summary
    const attended = volunteers.filter((v) => v.attendance === "attended").length;
    const absent = volunteers.filter((v) => v.attendance === "absent").length;
    const unmarked = volunteers.length - attended - absent;

    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

    // Build plain-text / HTML report (simple, no external PDF lib needed)
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Report — ${ev.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 40px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #888; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat { background: #f7f7f7; border-radius: 10px; padding: 16px; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin-top: 2px; }
    .stat-green .stat-value { color: #16a34a; }
    .stat-red .stat-value { color: #dc2626; }
    .stat-amber .stat-value { color: #d97706; }
    .stat-rose .stat-value { color: #e11d48; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #999; padding: 8px 12px; border-bottom: 1px solid #eee; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f3f3; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-red { background: #fee2e2; color: #b91c1c; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #bbb; text-align: center; }
    .description { font-size: 14px; color: #555; line-height: 1.6; white-space: pre-wrap; }
    .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
    .photo-grid img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; display: block; }
    .field-note { font-size: 13px; color: #666; font-style: italic; background: #f9f9f9; border-left: 3px solid #e5e7eb; padding: 10px 14px; border-radius: 0 6px 6px 0; margin-bottom: 16px; }
    /* Print toolbar */
    .print-bar { position: sticky; top: 0; z-index: 99; background: #fff; border-bottom: 1px solid #eee; padding: 12px 48px; display: flex; align-items: center; justify-content: space-between; margin: -48px -48px 40px -48px; }
    .print-bar-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; }
    .print-btn { background: #1a1a1a; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
    .print-btn:hover { background: #333; }
    @media print {
      .print-bar { display: none !important; }
      body { padding: 32px; }
    }
  </style>
</head>
<body>
  <!-- Print / Download PDF toolbar -->
  <div class="print-bar">
    <span class="print-bar-title">HopeNGO &middot; After-Action Report</span>
    <button class="print-btn" onclick="window.print()">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Download PDF
    </button>
  </div>
  <p class="meta">HopeNGO · After-Action Report · Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
  <h1>${ev.title}</h1>
  <p class="meta">${ev.eventType || "Event"} · ${formattedDate} · ${ev.city || ""}${ev.state ? ", " + ev.state : ""}</p>

  <div class="section">
    <div class="section-title">Event Overview</div>
    <div class="grid">
      <div class="stat">
        <div class="stat-value">${formattedDate}</div>
        <div class="stat-label">Date</div>
      </div>
      <div class="stat">
        <div class="stat-value">${ev.startTime || "—"} – ${ev.endTime || "—"}</div>
        <div class="stat-label">Time</div>
      </div>
      <div class="stat">
        <div class="stat-value">${ev.venue || "—"}</div>
        <div class="stat-label">Venue</div>
      </div>
      <div class="stat">
        <div class="stat-value">${ev.coordinatorName || "—"}</div>
        <div class="stat-label">Coordinator</div>
      </div>
    </div>
    ${ev.description ? `<p class="description">${ev.description}</p>` : ""}
  </div>

  <div class="section">
    <div class="section-title">Volunteer Attendance</div>
    <div class="grid">
      <div class="stat"><div class="stat-value">${volunteers.length}</div><div class="stat-label">Total Volunteers</div></div>
      <div class="stat stat-green"><div class="stat-value">${attended}</div><div class="stat-label">Attended</div></div>
      <div class="stat stat-red"><div class="stat-value">${absent}</div><div class="stat-label">Absent</div></div>
      <div class="stat stat-amber"><div class="stat-value">${unmarked}</div><div class="stat-label">Unmarked</div></div>
    </div>
    ${volunteers.length > 0 ? `
    <table>
      <thead><tr><th>Volunteer Name</th><th>Attendance</th></tr></thead>
      <tbody>
        ${volunteers.map((v) => `
        <tr>
          <td>${v.name}</td>
          <td><span class="badge ${v.attendance === "attended" ? "badge-green" : v.attendance === "absent" ? "badge-red" : "badge-amber"}">${v.attendance}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>` : `<p style="color:#aaa;font-size:13px;font-style:italic;">No approved volunteers found.</p>`}
  </div>

  <div class="section">
    <div class="section-title">Donations</div>
    <div class="grid">
      <div class="stat stat-rose"><div class="stat-value">₹${totalDonated.toLocaleString("en-IN")}</div><div class="stat-label">Total Raised</div></div>
      <div class="stat"><div class="stat-value">${donations.length}</div><div class="stat-label">Donors</div></div>
    </div>
    ${donations.length > 0 ? `
    <table>
      <thead><tr><th>Donor</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${donations.map((d) => `<tr><td>${d.donorName}</td><td style="text-align:right;font-weight:700;color:#e11d48">₹${d.amount.toLocaleString("en-IN")}</td></tr>`).join("")}
      </tbody>
    </table>` : `<p style="color:#aaa;font-size:13px;font-style:italic;">No donations received.</p>`}
  </div>

  ${fieldImages.length > 0 ? `
  <div class="section">
    <div class="section-title">Field Photos${coordinatorReporterName ? ` · Submitted by ${coordinatorReporterName}` : ""}</div>
    ${coordinatorNote ? `<p class="field-note">${coordinatorNote}</p>` : ""}
    <div class="photo-grid">
      ${fieldImages.map((url) => `<img src="${url}" alt="Field photo" />`).join("\n      ")}
    </div>
  </div>` : ""}

  <div class="footer">HopeNGO Platform · This report was auto-generated.</div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Optionally trigger print dialog for PDF saving:
        // "Content-Disposition": `attachment; filename="report-${id}.html"`,
      },
    });
  } catch (err: any) {
    console.error("Report generation error:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
