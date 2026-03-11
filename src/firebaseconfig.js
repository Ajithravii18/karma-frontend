// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBIICwfRRC0rGUl88rzl3f4UFUZkCah8uk",
  authDomain: "otp-auth-33fb8.firebaseapp.com",
  projectId: "otp-auth-33fb8",
  storageBucket: "otp-auth-33fb8.firebasestorage.app",
  messagingSenderId: "39107786905",
  appId: "1:39107786905:web:80d6074099b0058972e008"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { RecaptchaVerifier, signInWithPhoneNumber };