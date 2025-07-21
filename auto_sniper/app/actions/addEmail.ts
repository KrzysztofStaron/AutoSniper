"use server";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { collection, doc, getFirestore, setDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJWUjvSnTWT38TJMQzQcE4Ivgh8KDIAIY",
  authDomain: "auto-aniper.firebaseapp.com",
  projectId: "auto-aniper",
  storageBucket: "auto-aniper.firebasestorage.app",
  messagingSenderId: "28822929505",
  appId: "1:28822929505:web:9cbeb6785290f89bb7aa20",
  measurementId: "G-EJNDC6QLTZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function addUser(email: string, details: string) {
  const userRef = doc(collection(db, "users"), email);

  await setDoc(userRef, {
    email: email,
    details: details || "",
  });
}
