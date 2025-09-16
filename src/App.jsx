import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// --- PÁGINAS E COMPONENTES ---
// Públicos
import LoginPage from './components/LoginPage';

// De Aluno
import StudentDashboard from './components/StudentDashboard';

// De Professor
import ProfessorDashboard from './components/ProfessorDashboard';
import GerenciarMeusVideos from './components/GerenciarMeusVideos';

// De Administrador
import Dashboard from './components/Dashboard';
import RegisterStudent from './components/RegisterStudent';
import ListaAlunos from './components/ListaAlunos';
import StudentDetails from './components/StudentDetails';
import PaymentScreen from './components/PaymentScreen';
import FluxoDeCaixa from './components/FluxoDeCaixa';
import GerenciarSaude from './components/GerenciarSaude';
import CheckinScreen from './components/CheckinScreen';
import PresenceScreen from './components/PresenceScreen';
import GerenciarPlanos from './components/GerenciarPlanos';
import GerenciarEventos from './components/GerenciarEventos';
import GerenciarVideos from './components/GerenciarVideos';
import GerenciarResultados from './components/GerenciarResultados';
import GerenciarCategorias from './components/GerenciarCategorias';
import GerenciarAvisos from './components/GerenciarAvisos';
import GerenciarAulas from './components/GerenciarAulas';
import ReceiptPage from './components/ReceiptPage'; // Importação corrigida
// Adicione outros imports se necessário

import './App.css';

// --- COMPONENTES AUXILIARES ---

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userRole, loading } = useAuth();
    if (loading) return <div className="loading-screen">Carregando...</div>;
    if (!currentUser) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'admin') return <Navigate to="/dashboard" replace />;
        if (userRole === 'aluno') return <Navigate to="/aluno/dashboard" replace />;
        if (userRole === 'professor') return <Navigate to="/professor/dashboard" replace />;
        return <Navigate to="/" replace />;
    }
    return children;
};

const MainRedirect = () => {
    const { currentUser, userRole, loading } = useAuth();
    if (loading) return <div className="loading-screen">Verificando permissões...</div>;
    if (!currentUser) return <Navigate to="/login" replace />;
    if (userRole === 'admin') return <Navigate to="/dashboard" replace />;
    if (userRole === 'aluno') return <Navigate to="/aluno/dashboard" replace />;
    if (userRole === 'professor') return <Navigate to="/professor/dashboard" replace />;
    return <div>Perfil de usuário não reconhecido. Contate o suporte.</div>;
};

// --- COMPONENTE PRINCIPAL DO APLICATIVO ---

function App() {
    return (
        <Router>
            <Routes>
                {/* Rota Pública */}
                <Route path="/login" element={<LoginPage />} />

                {/* Rota Raiz */}
                <Route path="/" element={<MainRedirect />} />

                {/* Rotas de Aluno */}
                <Route path="/aluno/dashboard" element={<ProtectedRoute allowedRoles={['aluno', 'professor']}><StudentDashboard /></ProtectedRoute>} />

                {/* Rotas de Professor */}
                <Route path="/professor/dashboard" element={<ProtectedRoute allowedRoles={['professor']}><ProfessorDashboard /></ProtectedRoute>} />
                <Route path="/professor/gerenciar-videos" element={<ProtectedRoute allowedRoles={['professor']}><GerenciarMeusVideos /></ProtectedRoute>} />

                {/* === ROTAS DE ADMINISTRADOR === */}
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
                <Route path="/register-student" element={<ProtectedRoute allowedRoles={['admin']}><RegisterStudent /></ProtectedRoute>} />
                <Route path="/lista-alunos" element={<ProtectedRoute allowedRoles={['admin']}><ListaAlunos /></ProtectedRoute>} />
                <Route path="/student-details/:id" element={<ProtectedRoute allowedRoles={['admin']}><StudentDetails /></ProtectedRoute>} />
                <Route path="/payments/:studentId" element={<ProtectedRoute allowedRoles={['admin']}><PaymentScreen /></ProtectedRoute>} />                <Route path="/fluxo-de-caixa" element={<ProtectedRoute allowedRoles={['admin']}><FluxoDeCaixa /></ProtectedRoute>} />
                <Route path="/gerenciar-saude" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarSaude /></ProtectedRoute>} />
                <Route path="/checkin" element={<ProtectedRoute allowedRoles={['admin']}><CheckinScreen /></ProtectedRoute>} />
                <Route path="/presence" element={<ProtectedRoute allowedRoles={['admin']}><PresenceScreen /></ProtectedRoute>} />
                <Route path="/gerenciar-planos" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarPlanos /></ProtectedRoute>} />
                <Route path="/gerenciar-eventos" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarEventos /></ProtectedRoute>} />
                <Route path="/gerenciar-videos" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarVideos /></ProtectedRoute>} />
                <Route path="/gerenciar-resultados" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarResultados /></ProtectedRoute>} />
                <Route path="/gerenciar-categorias" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarCategorias /></ProtectedRoute>} />
                <Route path="/gerenciar-avisos" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarAvisos /></ProtectedRoute>} />
                <Route path="/gerenciar-aulas" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarAulas /></ProtectedRoute>} />
                <Route path="/receipt" element={<ReceiptPage />} />
            </Routes>
        </Router>
    );
} 

export default App;