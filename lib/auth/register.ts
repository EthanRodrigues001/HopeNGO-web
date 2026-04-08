import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export async function registerUser({
  email,
  password,
  fullName,
  role,
  city,
  state,
  phone,
  bio = "",
  skills = [],
  emergencyContact = "",
  occupation = "",
}: any) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName: fullName });

  const isApproved = role === "admin"; // Both volunteers and coordinators need admin approval

  const userData = {
    email,
    role,
    isApproved,
    isActive: true,
    fullName,
    phone,
    city,
    state,
    bio,
    expoPushToken: "",
    ...(role === "volunteer" && {
      occupation,
      skills,
      emergencyContact,
    }),
  };

  // Exchange for session cookie and let server handle the DB write
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, userData }),
  });

  if (!res.ok) throw new Error("Database configuration or session creation failed");

  return { role, isApproved };
}

