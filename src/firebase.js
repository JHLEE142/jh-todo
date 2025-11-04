// Firebase 설정 - CDN에서 import
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyBMMt8WOh_DU1Tek0t-dGvEP8dLFe6ejhw",
  authDomain: "jh-todo.firebaseapp.com",
  databaseURL: "https://jh-todo-default-rtdb.firebaseio.com",
  projectId: "jh-todo",
  storageBucket: "jh-todo.firebasestorage.app",
  messagingSenderId: "782999239856",
  appId: "1:782999239856:web:6b39ae7dc90fa57d0c8f75",
  measurementId: "G-8LBL8RYVMV"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

