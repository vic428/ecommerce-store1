import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/admin/auth-forms";

export const metadata: Metadata = { title: "Set or reset password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
