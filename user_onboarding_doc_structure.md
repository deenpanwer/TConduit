To manually set a user to go through the onboarding process when they log in, you need to ensure their corresponding user document in the `users` collection in Firebase Firestore has the `onboardingCompleted` field set to `false`.

Here is the expected structure for a user document **before** onboarding is completed, based on the signup logic:

```json
{
  "email": "user@example.com",             // The user's email address
  "name": "User Full Name",                // The user's full name
  "role": "owner",                         // The user's role in the organization (e.g., "owner")
  "orgName": "Organization Name",          // The name of the organization they belong to
  "ownedOrgId": "org_randomstring",        // The unique ID of the organization created for them
  "uid": "firebase_auth_user_uid",         // The Firebase Authentication UID of the user
  "onboardingCompleted": false,            // Crucial: Set this to `false` to trigger onboarding
  "createdAt": {
    "_seconds": 1678886400,
    "_nanoseconds": 0
  }                                        // Server timestamp when the user document was created
  // "photoUrl": "https://example.com/photo.jpg" // Optional: Present if signed up via Google
}
```

**Steps for Manual Entry in Firestore:**

1.  **Navigate to your Firebase Console.**
2.  Go to **Firestore Database**.
3.  Select the **`users` collection**.
4.  Find the document corresponding to the user you want to send to onboarding (the document ID will be their Firebase Authentication UID).
5.  **Edit the document:**
    *   Ensure the `onboardingCompleted` field is set to a boolean `false`.
    *   Verify that `ownedOrgId`, `orgName`, `name`, `email`, and `uid` are correctly populated.
6.  Save the changes.

After performing these steps, the next time that user logs in, they will be redirected to the `/dashboard/onboarding` page to complete their setup.
