import { initializeApp } from 'firebase/app'; // Import initializeApp from Firebase
import { getFirestore } from 'firebase/firestore'; // Firestore
import { getAuth } from 'firebase/auth'; // Firebase Authentication

import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyBborYrkWd84SPh66MJLnb6vgysAYGUY5U",
  authDomain: "exp151-37ce3.firebaseapp.com",
  databaseURL: "https://exp151-37ce3-default-rtdb.firebaseio.com",
  projectId: "exp151-37ce3",
  storageBucket: "exp151-37ce3.firebasestorage.app",
  messagingSenderId: "81866930521",
  appId: "1:81866930521:web:ba7dccd27032189c107448"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Firebase Authentication
const firestore = getFirestore(app); // Firestore instance
const auth = getAuth(app);
// Export Firestore and Auth to use in other parts of the application
export { firestore, auth ,app};
