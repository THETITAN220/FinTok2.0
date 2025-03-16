import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthForm from "@/app/Components/Signin";

// Mark the page as Server Side Rendered
export default async function SignIn() {
  const session = await auth();

  // If user is authenticated, redirect to home
  if (session) {
    redirect("/");
  }

  return <AuthForm />;
}

// Optional: Add page metadata
export const metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};
