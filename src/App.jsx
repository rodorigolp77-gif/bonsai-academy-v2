import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // Importa nosso hook de autenticação

// --- Páginas e Componentes ---
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/StudentDashboard';
import Dashboard from './components/Dashboard'; // Este é o seu Dashboard de Admin
// Lembre-se de importar todos os outros componentes que você usa nas rotas!
// Ex: import RegisterStudent from './components/RegisterStudent';

import './App.css';

// --- COMPONENTES AUXILIARES (definidos fora para melhor performance) ---

// Componente para proteger rotas que exigem login e um perfil específico
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return <div className="loading-screen">Carregando...</div>;
    }
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Se o perfil não for permitido, redireciona para a página principal do perfil dele
        if (userRole === 'admin') return <Navigate to="/dashboard" replace />;
        if (userRole === 'aluno') return <Navigate to="/aluno/dashboard" replace />;
        return <Navigate to="/" replace />; 
    }
    return children;
};

// Componente para redirecionar o usuário para a página correta após o login
const MainRedirect = () => {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
      return <div className="loading-screen">Verificando permissões...</div>;
    }
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }

    if (userRole === 'admin') return <Navigate to="/dashboard" replace />;
    if (userRole === 'aluno') return <Navigate to="/aluno/dashboard" replace />;
    // Adicione outros perfis se necessário, ex: 'professor'
    // if (userRole === 'professor') return <Navigate to="/professor/dashboard" replace />;
    
    // Caso o perfil não seja reconhecido, mostra uma mensagem.
    return <div>Perfil de usuário não reconhecido. Por favor, contate o suporte.</div>;
};


// --- COMPONENTE PRINCIPAL DO APLICATIVO ---

function App() {
    return (
        <Router>
            <Routes>
                {/* Rota Pública */}
                <Route path="/login" element={<LoginPage />} />

                {/* Rota Raiz: Redireciona o usuário logado para seu respectivo dashboard */}
                <Route path="/" element={<MainRedirect />} />

                {/* Rotas de Aluno */}
                <Route 
                    path="/aluno/dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['aluno', 'professor']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    } 
                />

                {/* Rotas de Admin */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Adicione aqui TODAS as suas outras rotas protegidas. Exemplo:
                <Route 
                    path="/register-student" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <RegisterStudent />
                        </ProtectedRoute>
                    } 
                />
                */}
            </Routes>
        </Router>
    );
}

export default App;