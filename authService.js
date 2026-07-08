import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// 1. Firebase Configuration (Customized for your TypeFlow project)
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY", // Get this from your Firebase Console settings
  authDomain: "typeflow-dea64.firebaseapp.com",
  projectId: "typeflow-dea64",
  storageBucket: "typeflow-dea64.firebasestorage.app",
  messagingSenderId: "50280819655",
  appId: "YOUR_WEB_APP_APP_ID" // Get this from your Firebase Console settings
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper to generate secure random credentials under the hood
function generateSecureString(length = 12) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('');
}

// 2. Automated Legacy Data Sweeper (Invisible to guardians)
function findLegacyUsername() {
  const commonKeys = ["user", "username", "displayName", "profile", "login", "loggedIn", "name", "currentUser", "session", "player"];
  for (const key of commonKeys) {
    const rawData = localStorage.getItem(key);
    if (!rawData) continue;
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed === "object") {
        const name = parsed.username || parsed.displayName || parsed.name || parsed.user;
        if (name && typeof name === "string") return name;
      }
    } catch (e) {
      if (typeof rawData === "string" && rawData.trim().length > 0 && rawData !== "true" && rawData !== "false") {
        return rawData.trim();
      }
    }
  }
  return null;
}

function purgeLegacyKeys() {
  const commonKeys = ["user", "username", "displayName", "profile", "login", "loggedIn", "name", "currentUser", "session", "player", "old_user_profile"];
  commonKeys.forEach(key => localStorage.removeItem(key));
}

// 3. Username Unique Check
export async function isUsernameAvailable(username) {
  const cleaned = username.trim().toLowerCase();
  if (!cleaned) return false;
  const snap = await getDoc(doc(db, "usernames", cleaned));
  return !snap.exists();
}

// 4. One-Click Signup with Username (No password typing needed)
export async function signupWithUsername(chosenUsername) {
  const cleanedUsername = chosenUsername.trim();
  const lowerUsername = cleanedUsername.toLowerCase();

  const available = await isUsernameAvailable(lowerUsername);
  if (!available) throw new Error("This username is already taken! Please try a different name.");

  // Generate invisible secure credentials
  const dummyEmail = `user_${generateSecureString(6)}@typeflow.local`;
  const dummyPassword = generateSecureString(16);

  // Register in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, dummyPassword);
  const user = userCredential.user;

  // Update profile and reserve username in database
  await updateProfile(user, { displayName: cleanedUsername });
  await setDoc(doc(db, "usernames", lowerUsername), { uid: user.uid });
  await setDoc(doc(db, "users", user.uid), { username: cleanedUsername, createdAt: new Date().toISOString() });

  // Save secure local backup for future automatic recovery
  localStorage.setItem("tf_backup_creds", JSON.stringify({ email: dummyEmail, password: dummyPassword }));
  return user;
}

// 5. Automatic Session Restorer
export async function loginWithBackupCredentials() {
  const backupRaw = localStorage.getItem("tf_backup_creds");
  if (!backupRaw) return null;
  try {
    const { email, password } = JSON.parse(backupRaw);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch {
    return null;
  }
}

// 6. Admin Verification & Banning Actions
export function isAdmin() {
  const user = auth.currentUser;
  return user !== null && user.displayName === "TypeFlow";
}

export async function banUser(uidToBan) {
  if (!isAdmin()) throw new Error("Unauthorized! Only the admin profile named 'TypeFlow' can ban accounts.");
  await setDoc(doc(db, "banned_users", uidToBan), { bannedAt: new Date().toISOString(), bannedBy: "TypeFlow" });
}

// 7. Complete UI Takeover Engine
export function autoTakeoverUI(domIds) {
  const loading = document.getElementById(domIds.loadingScreenId);
  const oldUi = document.getElementById(domIds.oldSignupUiId);
  const dashboard = document.getElementById(domIds.mainDashboardId);
  const banned = document.getElementById(domIds.bannedScreenId);

  // Force loading state immediately
  if (loading) loading.style.display = "block";
  if (oldUi) oldUi.style.display = "none";
  if (dashboard) dashboard.style.display = "none";
  if (banned) banned.style.display = "none";

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Step A: Check if the user has been banned
      const banSnap = await getDoc(doc(db, "banned_users", user.uid));
      if (banSnap.exists()) {
        if (loading) loading.style.display = "none";
        if (banned) banned.style.display = "block";
        await signOut(auth);
      } else {
        // Safe to login!
        if (loading) loading.style.display = "none";
        if (dashboard) dashboard.style.display = "block";
      }
    } else {
      // Step B: Attempt silent session restoration
      const restoredUser = await loginWithBackupCredentials();
      if (restoredUser) return;

      // Step C: Attempt silent legacy account migration
      const oldUsername = findLegacyUsername();
      if (oldUsername) {
        try {
          await signupWithUsername(oldUsername);
          purgeLegacyKeys();
          return;
        } catch {
          // If unique username check fails, fallback to show registration form
        }
      }

      // Step D: Clean slate (Show sign up form)
      if (loading) loading.style.display = "none";
      if (oldUi) oldUi.style.display = "block";
    }
  });
}

