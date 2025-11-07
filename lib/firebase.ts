// lib/firebase.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyANwePblwM6V2cxLKnHOV5yfccWChq_APY",
    authDomain: "hotelmate-36ca6.firebaseapp.com",
    projectId: "hotelmate-36ca6",
    storageBucket: "hotelmate-36ca6.firebasestorage.app",
    messagingSenderId: "586903658072",
    appId: "1:586903658072:web:35c190d47aaa7c0c06f42d"
  };

export const app = initializeApp(firebaseConfig);
