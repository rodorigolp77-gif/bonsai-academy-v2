import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebaseConfig.js'; 
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; 

// --- Componentes ---
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/StudentDashboard';
import Dashboard from './components/Dashboard';
import CheckinScreen from './components/CheckinScreen';
import PaymentScreen from './components/PaymentScreen';
import PresenceScreen from './components/PresenceScreen';
import RegisterStudent from './components/RegisterStudent'; // <-- CORREÇÃO AQUI: removido '01'
import StudentDetails from './components/StudentDetails';
import ControleAcademia from './components/ControleAcademia';
import ListaAlunos from './components/ListaAlunos';
import FluxoDeCaixa from './components/FluxoDeCaixa';
import ExportPage from './components/ExportPage'; 
import GlobalStyle from './styles/GlobalStyle.jsx';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // A lógica atual define o papel do usuário:
        // Se o UID do usuário for encontrado na coleção 'alunos', ele é 'aluno'.
        // Caso contrário, ele é tratado como 'admin'.
        // Para gerenciamento de papéis mais robusto, considere armazenar papéis explícitos
        // em uma coleção 'users' separada ou em um campo no próprio documento do aluno.
        const alunosRef = collection(db, 'alunos');
        const q = query(alunosRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        setUserRole(!querySnapshot.empty ? 'aluno' : 'admin');
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a1a', color: 'white' }}>Carregando...</div>;
  }

  const ProtectedRoute = ({ children, role }) => {
    if (!currentUser) return <Navigate to="/login" replace />;
    // Se o usuário está logado, mas seu papel não corresponde ao papel exigido para a rota,
    // ele é redirecionado para o seu respectivo painel.
    if (userRole && userRole !== role) {
        return userRole === 'admin' ? <Navigate to="/dashboard" replace /> : <Navigate to="/aluno/dashboard" replace />;
    }
    return children;
  };

  return (
    <Router>
      <GlobalStyle />
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Redireciona a rota raiz com base no status de login e no papel do usuário */}
          <Route path="/" element={!currentUser ? <Navigate to="/login" replace /> : (userRole === 'admin' ? <Navigate to="/dashboard" replace /> : <Navigate to="/aluno/dashboard" replace />)} />

          {/* Rotas protegidas */}
          <Route path="/aluno/dashboard" element={<ProtectedRoute role="aluno"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>} />
          <Route path="/checkin" element={<ProtectedRoute role="admin"><CheckinScreen /></ProtectedRoute>} />
          <Route path="/presence" element={<ProtectedRoute role="admin"><PresenceScreen /></ProtectedRoute>} />
          <Route path="/register-student" element={<ProtectedRoute role="admin"><RegisterStudent /></ProtectedRoute>} /> {/* <-- USADO AQUI SEM '01' */}
          <Route path="/student-details/:id" element={<ProtectedRoute role="admin"><StudentDetails /></ProtectedRoute>} />
          <Route path="/payments/:id" element={<ProtectedRoute role="admin"><PaymentScreen /></ProtectedRoute>} />
          <Route path="/controle-academia" element={<ProtectedRoute role="admin"><ControleAcademia /></ProtectedRoute>} />
          <Route path="/fluxo-de-caixa" element={<ProtectedRoute role="admin"><FluxoDeCaixa /></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute role="admin"><ExportPage /></ProtectedRoute>} />
          <Route path="/lista-alunos/:filtro?/:valor?" element={<ProtectedRoute role="admin"><ListaAlunos /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
