// src/components/ProfessorDashboard.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import carimboLogo from '../assets/carimbo.jpg';
import { FaBars, FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import './StudentDashboard.css'; // Reutilizando o CSS do Aluno

// --- IMAGENS DOS BOTÕES ---
import presencaImg from '../assets/presenca.jpg';
import videoaulaImg from '../assets/videoaula.jpg';
import aulasImg from '../assets/aulas.jpg';
import reciboImg from '../assets/recibo.jpg';
import eventosImg from '../assets/evento.jpg';
import resultadosImg from '../assets/resultados.jpg';

// --- IMAGENS DAS FAIXAS ---
import brancaImg from '../assets/faixas/branca.png';
// Adicione todos os outros imports de faixas aqui para a funcionalidade completa...

const faixaImages = {
    branca: { 0: brancaImg },
    // ... (seu objeto faixaImages completo) ...
};

Modal.setAppElement('#root');

function ProfessorDashboard({ userRole }) {
    const navigate = useNavigate();
    const contentRef = useRef(null);
    const [studentData, setStudentData] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [attendance, setAttendance] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [events, setEvents] = useState([]);
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('presenca');
    const [faixa, setFaixa] = useState('');
    const [grau, setGrau] = useState(0);
    // Adicione aqui todos os outros estados do StudentDashboard para funcionalidade completa

    const handleGoToAdminDashboard = () => {
        navigate('/dashboard');
    };
    
    // ATENÇÃO: Você precisa copiar todas as funções (fetchAllData, handleLogout, renderContent, etc.)
    // do seu arquivo StudentDashboard.jsx para cá para que tudo funcione.
    // O código abaixo é uma estrutura funcional básica.
    const handleLogout = async () => {
        try { await signOut(auth); } 
        catch (error) { console.error("Erro ao sair:", error); }
    };
    const handleTabClick = (tabName) => { setActiveTab(tabName); };
    const renderContent = () => { return <p>Conteúdo da aba: {activeTab}</p> };


    // Simula o carregamento dos dados do professor
    useEffect(() => {
        const fetchProfessorData = async () => {
            if (auth.currentUser) {
                const q = query(collection(db, "alunos"), where("uid", "==", auth.currentUser.uid));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setStudentData(querySnapshot.docs[0].data());
                }
            }
            setLoading(false);
        };
        fetchProfessorData();
    }, []);


    if (loading) return <div>Carregando...</div>;

    return (
        <div className="dashboard-container">
            <button 
                onClick={handleGoToAdminDashboard} 
                className="back-to-admin-button"
                title="Voltar ao Painel do Administrador"
            >
                ← Voltar ao Painel Admin
            </button>

            <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
                <button onClick={() => setIsMenuOpen(false)} className="close-menu-button"><FaTimes /></button>
                <nav className="side-menu-nav">
                    <button onClick={handleLogout} className="side-menu-logout-button">Sair</button>
                </nav>
            </div>
            {isMenuOpen && <div className="overlay" onClick={() => setIsMenuOpen(false)}></div>}

            <header className="dashboard-header">
                <button onClick={() => setIsMenuOpen(true)} className="menu-button">
                    <FaBars />
                </button>
                <img src={carimboLogo} alt="Logo Bonsai" className="header-logo" />
                <div className="academy-title">
                    <h1 className="bonsai-line">PAINEL DO PROFESSOR</h1>
                    <p className="academy-line">{studentData?.nome}</p>
                </div>
            </header>

            <nav className="dashboard-nav">
                <button onClick={() => handleTabClick('presenca')} style={{ backgroundImage: `url(${presencaImg})` }}>Presença</button>
                <button onClick={() => handleTabClick('fitness')} className="fitness-bg">Meu Fitness</button>
                <button onClick={() => handleTabClick('recibos')} style={{ backgroundImage: `url(${reciboImg})` }}>Recibos</button>
                <button onClick={() => handleTabClick('aulas')} style={{ backgroundImage: `url(${aulasImg})` }}>Quadro de Horário</button>
                <button onClick={() => handleTabClick('eventos')} style={{ backgroundImage: `url(${eventosImg})` }}>Eventos</button>
                <button onClick={() => handleTabClick('resultados')} style={{ backgroundImage: `url(${resultadosImg})` }}>Resultados</button>
                <button onClick={() => handleTabClick('videoaulas')} style={{ backgroundImage: `url(${videoaulaImg})` }}>Vídeo Aulas</button>
                
                {userRole === 'professor' && (
                    <button 
                        onClick={() => navigate('/professor/gerenciar-videos')} 
                        className="gerenciar-videos-button"
                    >
                        Gerenciar Meus Vídeos
                    </button>
                )}
            </nav>
            
            <main className="dashboard-content" ref={contentRef}>
                {renderContent()}
            </main>
        </div>
    );
}

export default ProfessorDashboard;