import RegisterForm from "@/components/auth/RegisterForm";
import { redirectSignedIn } from "@/lib/auth/redirect-signed-in";

export const metadata = {
  title: "สมัครสมาชิก | MaTee",
};

export default async function RegisterPage({ searchParams }) {
  await redirectSignedIn(searchParams);

  return <RegisterForm />;
}
