
I have analyzed the `src/app/dashboard/signup/page.tsx` and `src/app/dashboard/onboarding/page.tsx` files.

The problem was identified in the `useEffect` hook within `src/app/dashboard/onboarding/page.tsx`. This hook was designed to redirect authenticated users who had completed onboarding to `/dashboard`. However, when a new user signed up, completed onboarding, and `onboardingCompleted` was set to `true`, a race condition or re-evaluation could occur where the onboarding page's `useEffect` would repeatedly attempt to redirect to `/dashboard`, potentially leading to an infinite loading state if the navigation wasn't fully settled.

The fix involves adding a condition to this `useEffect` to ensure that the redirection only occurs if the user is not *already* on the `/dashboard` path. This prevents the onboarding page from trying to redirect itself if it has already successfully navigated.

**Change Implemented:**

Modified `src/app/dashboard/onboarding/page.tsx`:

```diff
--- a/src/app/dashboard/onboarding/page.tsx
+++ b/src/app/dashboard/onboarding/page.tsx
@@ -95,7 +95,7 @@
         setUser(user);
         const userDoc = await getDoc(doc(db, "users", user.uid));
         const userData = userDoc.data();
-        if (userData?.onboardingCompleted) {
+        if (userData?.onboardingCompleted && router.pathname !== "/dashboard") {
           router.push("/dashboard");
           return;
         }

```

**To verify the fix:**

1.  **Clear your browser's local storage and cookies** for the application's domain (e.g., `localhost`). This is crucial to ensure a clean state for testing.
2.  Navigate to the **signup page** (`/dashboard/signup`).
3.  Attempt to **sign up** with a new email and password, or use the "Continue with Google" option.
4.  After successful signup and completing the onboarding steps, observe if the application redirects correctly to the `/dashboard` without getting stuck in an infinite loading state.
