import { useAuthActions } from "@convex-dev/auth/react";

export function SignIn() {
  const { signIn } = useAuthActions();
  return (
    <button type="button" onClick={() => void signIn("github")}>
      Sign in with GitHub
    </button>
  );
}
