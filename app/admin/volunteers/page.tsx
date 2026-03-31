import { adminDb } from "@/lib/firebase/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminVolunteersPage() {
  const pendingAccountsSnap = await adminDb
    .collection("users")
    .where("role", "==", "volunteer")
    .where("isApproved", "==", false)
    .get();

  const pendingAccounts = pendingAccountsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      city: data.city,
      state: data.state,
      occupation: data.occupation,
    };
  });

  const pendingAppsSnap = await adminDb
    .collection("volunteerApplications")
    .where("status", "==", "pending")
    .get();

  const pendingApps = pendingAppsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      volunteerName: data.volunteerName,
      eventId: data.eventId,
    };
  });

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-3">
          Personnel
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Manage Operatives
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Review volunteer dossiers and field assignments pending your seal.
        </p>
      </header>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="mb-8 bg-muted/40 border-foreground/[0.05] border rounded-[12px] h-14 p-1">
          <TabsTrigger
            value="accounts"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground text-foreground/50 rounded-[8px] shadow-none uppercase tracking-[0.12em] text-xs font-bold transition-all h-full px-6 flex items-center gap-3"
          >
            Accounts{" "}
            <Badge variant="secondary" className="shadow-none rounded-sm px-1.5 min-w-[20px] justify-center">
              {pendingAccounts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground text-foreground/50 rounded-[8px] shadow-none uppercase tracking-[0.12em] text-xs font-bold transition-all h-full px-6 flex items-center gap-3"
          >
            Field Apps{" "}
            <Badge variant="secondary" className="shadow-none rounded-sm px-1.5 min-w-[20px] justify-center">
              {pendingApps.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="accounts"
          className="m-0 border-none outline-none data-[state=inactive]:hidden flex flex-col gap-6"
        >
          {pendingAccounts.length === 0 ? (
            <div className="p-16 text-center rounded-[20px] bg-muted/20 flex flex-col items-center">
              <p className="text-foreground/50 text-sm font-light italic">
                All dossiers have been cleared. No accounts pending approval.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {pendingAccounts.map((acc: any) => (
                <Card
                  key={acc.id}
                  className="bg-card border-0 ring-0 shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] rounded-[20px] flex flex-col"
                >
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-serif font-medium tracking-tight text-foreground">
                      {acc.fullName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 flex-1">
                    <div className="flex flex-col gap-3 text-[13px] font-light text-foreground/60 mb-4 border-l-2 border-primary/20 pl-4 py-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                          Communications
                        </span>
                        <span className="text-foreground">
                          {acc.email} <span className="opacity-30 mx-1">/</span> {acc.phone}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                          Location
                        </span>
                        <span className="text-foreground">
                          {acc.city}, {acc.state}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                          Expertise
                        </span>
                        <span className="text-foreground font-medium">{acc.occupation}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0 flex gap-4 mt-6">
                    <form
                      className="flex-1"
                      action={async () => {
                        "use server";
                        await adminDb.doc(`users/${acc.id}`).update({ isApproved: true, updatedAt: new Date() });
                      }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/95 text-primary-foreground h-12 text-xs uppercase tracking-[0.12em] font-bold shadow-none rounded-[8px]"
                      >
                        Approve
                      </Button>
                    </form>
                    <form
                      className="flex-1"
                      action={async () => {
                        "use server";
                        await adminDb.doc(`users/${acc.id}`).delete();
                      }}
                    >
                      <Button
                        variant="outline"
                        type="submit"
                        className="w-full border-destructive/20 text-destructive hover:bg-destructive/[0.06] hover:border-destructive/30 h-12 text-xs uppercase tracking-[0.12em] font-bold shadow-none rounded-[8px]"
                      >
                        Reject
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="applications"
          className="m-0 border-none outline-none data-[state=inactive]:hidden flex flex-col gap-6"
        >
          {pendingApps.length === 0 ? (
            <div className="p-16 text-center rounded-[20px] bg-muted/20 flex flex-col items-center">
              <p className="text-foreground/50 text-sm font-light italic">No pending field requests.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {pendingApps.map((app: any) => (
                <Card
                  key={app.id}
                  className="bg-card border-0 ring-0 shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] rounded-[20px] flex flex-col"
                >
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-serif font-medium tracking-tight text-foreground">
                      {app.volunteerName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 flex-1">
                    <div className="flex flex-col gap-0.5 text-[13px] font-light text-foreground/60 mb-4 border-l-2 border-primary/20 pl-4 py-1">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                        Event Designation
                      </span>
                      <span className="text-foreground font-mono bg-muted/40 px-2 py-0.5 rounded w-max mt-1">
                        {app.eventId}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0 flex gap-4 mt-6">
                    <form
                      className="flex-1"
                      action={async () => {
                        "use server";
                        await adminDb.doc(`volunteerApplications/${app.id}`).update({ status: "approved" });
                      }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-xs uppercase tracking-[0.12em] font-bold shadow-none rounded-[8px]"
                      >
                        Authorize
                      </Button>
                    </form>
                    <form
                      className="flex-1"
                      action={async () => {
                        "use server";
                        await adminDb.doc(`volunteerApplications/${app.id}`).update({ status: "rejected" });
                      }}
                    >
                      <Button
                        variant="outline"
                        type="submit"
                        className="w-full border-foreground/[0.08] h-12 text-xs uppercase tracking-[0.12em] font-bold shadow-none rounded-[8px]"
                      >
                        Decline
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
