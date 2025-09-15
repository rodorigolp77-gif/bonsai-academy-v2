// Caminho: src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ATENÇÃO: SUBSTITUA OS VALORES ABAIXO PELOS SEUS REAIS DO CONSOLE DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCU1PFlClEcxSv2El9i-GK8EJHzuyvvcKs",
  authDomain: "bonsai-academy-8cf95.firebaseapp.com",
  projectId: "bonsai-academy-8cf95",
  storageBucket: "bonsai-academy-8cf95.appspot.com",
  messagingSenderId: "703215063814",
  appId: "1:703215063814:web:1a53089b72e0d550530487",
  measurementId: "G-E7TMW2L7L0"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que você vai usar
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;