import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders Google's own Sign-In button (its branding guidelines limit how
 * far this can be restyled) when VITE_GOOGLE_CLIENT_ID is configured;
 * otherwise renders an inert, clearly-labeled placeholder so the rest of
 * the app keeps working without it.
 */
export default function GoogleSignInButton({ onSuccess, onError, className = "" }) {
  const { loginWithGoogle } = useAuth();

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Google sign-in isn't configured yet (missing VITE_GOOGLE_CLIENT_ID)"
        className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-semibold cursor-not-allowed ${className}`}
      >
        Continue with Google (not configured)
      </button>
    );
  }

  const handleSuccess = async (credentialResponse) => {
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      onSuccess?.();
    } else {
      onError?.(result.message || "Google sign-in failed");
    }
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className={className}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError?.("Google sign-in failed")}
          width="100%"
          theme="outline"
          shape="pill"
          text="continue_with"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
