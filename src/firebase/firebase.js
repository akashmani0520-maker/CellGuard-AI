import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC72DL7c85N6dDylx5LpdIMkLTLEdd-fn4",
  authDomain: "cellguard-ai.firebaseapp.com",
  databaseURL: "https://cellguard-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cellguard-ai",
  storageBucket: "cellguard-ai.firebasestorage.app",
  messagingSenderId: "550963850264",
  appId: "1:550963850264:web:18c95f81b569988326a76d",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);