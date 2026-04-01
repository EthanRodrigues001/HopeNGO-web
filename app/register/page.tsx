"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/auth/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("participant");
  const [formData, setFormData] = useState({
    email: "", password: "", fullName: "", phone: "",
    city: "", state: "", occupation: "", emergencyContact: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await registerUser({ ...formData, role });
      if (!result.isApproved) window.location.href = "/pending-approval";
      else if (role === "participant") window.location.href = "/participant/dashboard";
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans pt-12">
      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        <div className="w-full max-w-[540px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="shadow-[0_32px_64px_-12px_rgba(25,28,26,0.04)] border-0 ring-0 p-2 bg-card rounded-[20px]">
            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-4xl font-serif font-medium text-foreground tracking-tight mb-2">
                Join the Archive
              </CardTitle>
              <CardDescription className="text-foreground/50 text-[11px] uppercase tracking-[0.12em] font-bold">
                Select your role and create a record
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="flex flex-col gap-6 pt-2 px-6">
                {error && (
                  <div className="p-4 rounded-[8px] bg-destructive/[0.06] text-destructive text-sm font-medium">
                    {error}
                  </div>
                )}

                <Tabs defaultValue="participant" onValueChange={setRole} className="w-full mb-2">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/40 border-foreground/[0.05] border rounded-[12px] h-12 p-1">
                    <TabsTrigger
                      value="participant"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground text-foreground/50 rounded-[8px] shadow-none uppercase tracking-[0.12em] text-xs font-bold transition-all"
                    >
                      Participant
                    </TabsTrigger>
                    <TabsTrigger
                      value="volunteer"
                      className="data-[state=active]:bg-background data-[state=active]:text-primary text-foreground/50 rounded-[8px] shadow-none uppercase tracking-[0.12em] text-xs font-bold transition-all"
                    >
                      Volunteer
                    </TabsTrigger>
                  </TabsList>
                  <div className="pt-4">
                    <TabsContent value="participant" className="m-0 border-none outline-none data-[state=inactive]:hidden" />
                    <TabsContent value="volunteer" className="m-0 border-none outline-none data-[state=inactive]:hidden" />
                  </div>
                </Tabs>

                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="reg-fullName" className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                      Full Name
                    </label>
                    <Input
                      id="reg-fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="bg-muted/30 border-foreground/[0.06] focus-visible:ring-primary h-12 rounded-[8px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="reg-phone" className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                      Phone
                    </label>
                    <Input
                      id="reg-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="bg-muted/30 border-foreground/[0.06] focus-visible:ring-primary h-12 rounded-[8px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="reg-city" className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                      City
                    </label>
                    <Input
                      id="reg-city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="bg-muted/30 border-foreground/[0.06] focus-visible:ring-primary h-12 rounded-[8px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="reg-state" className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                      State
                    </label>
                    <Input
                      id="reg-state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="bg-muted/30 border-foreground/[0.06] focus-visible:ring-primary h-12 rounded-[8px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <label htmlFor="reg-email" className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                    Email Address
                  </label>
                  <Input
                    id="reg-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-muted/30 border-foreground/[0.06] focus-visible:ring-primary h-12 rounded-[8px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="reg-password" className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                    Password
                  </label>
                  <Input
                    id="reg-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="bg-muted/30 border-foreground/[0.06] focus-visible:ring-primary h-12 rounded-[8px]"
                  />
                </div>

                {role === "volunteer" && (
                  <div className="grid grid-cols-2 gap-5 pt-6 mt-2 bg-primary/[0.02] -mx-6 px-6 pb-6 rounded-[12px] animate-in fade-in duration-300">
                    <div className="flex flex-col gap-2 col-span-2">
                      <label htmlFor="reg-occupation" className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/60">
                        Occupation / Expertise
                      </label>
                      <Input
                        id="reg-occupation"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="bg-background/60 border-primary/[0.12] focus-visible:ring-primary h-12 rounded-[8px]"
                        placeholder="e.g. Teacher, Nurse, Coordinator..."
                      />
                    </div>
                    <div className="flex flex-col gap-2 col-span-2">
                      <label htmlFor="reg-emergencyContact" className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/60">
                        Emergency Contact
                      </label>
                      <Input
                        id="reg-emergencyContact"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        required
                        className="bg-background/60 border-primary/[0.12] focus-visible:ring-primary h-12 rounded-[8px]"
                        placeholder="Name & Phone Number"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-6 pb-8 pt-6 px-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-base shadow-none hover:bg-primary/95 transition-all rounded-[8px]"
                >
                  {loading ? "Creating Record..." : "Confirm Registration"}
                  {!loading && <ArrowRight size={16} className="ml-2" />}
                </Button>
                <p className="text-sm text-foreground/50 text-center">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-primary font-semibold underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all"
                  >
                    Sign In
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
