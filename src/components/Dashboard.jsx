import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from "../firebaseConfig"; // AQUI ESTÁ A CORREÇÃO
import { FaSignOutAlt } from 'react-icons/fa';
import OverdueStudents from './OverdueStudents';
import bonsaiLogo from '../assets/bonsai_logo.png';
import './Dashboard.css'; 

// --- IMAGENS PARA OS BOTÕES ---
import registerStudentImg from '../assets/cadastro.jpg';
import studentListImg from '../assets/lista-alunos.png';
import manageEventsImg from '../assets/evento.jpg';
import cashFlowImg from '../assets/recibo.jpg';
import checkinImg from '../assets/checkin.jpg';
import presenceImg from '../assets/presenca.jpg';
import videoImg from '../assets/videoaula.jpg';
import resultsImg from '../assets/resultados.jpg';
import categoriesImg from '../assets/evento.jpg';
import noticesImg from '../assets/evento.jpg';
import scheduleImg from '../assets/aulas.jpg';
import healthImg from '../assets/saude.png';
import gerenciarPlanosImg from '../assets/gerenciarplanos.png';

function Dashboard() {
    const navigate = useNavigate();
    const [searchName, setSearchName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState('');
    const [dueDayFilter, setDueDayFilter] = useState(null);
    const [dueStudents, setDueStudents] = useState([]);
    const [loadingDue, setLoadingDue] = useState(false);

    const fetchStudentsByName = useCallback(async (name) => {
        if (!name) { 
            setSearchResults([]); 
            setMessage(''); 
            return; 
        }
        setIsSearching(true);
        setMessage('');
        try {
            const end = name + '\uf8ff';
            const q = query(collection(db, 'alunos'), where('nome', '>=', name), where('nome', '<=', end));
            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (results.length === 0) {
                setMessage("Nenhum aluno encontrado.");
                setSearchResults([]);
            } else {
                setSearchResults(results);
                setMessage('');
            }
        } catch (error) {
            console.error("Erro ao buscar alunos por nome:", error);
            setMessage("Ocorreu um erro ao buscar.");
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { fetchStudentsByName(searchName); }, 500);
        return () => clearTimeout(timer);
    }, [searchName, fetchStudentsByName]);

    const fetchStudentsByDueDate = async (day) => {
        setDueDayFilter(day);
        setLoadingDue(true);
        setDueStudents([]);
        try {
            const q = query(collection(db, 'alunos'), where('status', '==', 'ativo'));
            const querySnapshot = await getDocs(q);
            const allActiveStudents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const filteredStudents = allActiveStudents.filter(student => {
                if (student.data_vencimento && student.data_vencimento.toDate) {
                    return student.data_vencimento.toDate().getDate() === day;
                }
                return false;
            });

            setDueStudents(filteredStudents);
        } catch (error) {
            console.error("Erro ao buscar alunos por vencimento:", error);
            setMessage("Erro ao buscar alunos por vencimento.");
        } finally {
            setLoadingDue(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };

    return (
        <div className="admin-dashboard-container">
            <header className="admin-dashboard-header">
                <div className="header-brand">
                    <img src={bonsaiLogo} alt="Bonsai Logo" className="header-logo" />
                    <div className="academy-title">
                        <h1 className="bonsai-line">BONSAI</h1>
                        <p className="academy-line">JIU JITSU ACADEMY</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-button-simple">
                    <FaSignOutAlt />
                    <span>Sair</span>
                </button>
            </header>

            <nav className="admin-dashboard-nav">
                <button onClick={() => navigate('/register-student')} style={{ backgroundImage: `url(${registerStudentImg})` }}>Cadastrar Aluno</button>
                <button onClick={() => navigate('/lista-alunos')} style={{ backgroundImage: `url(${studentListImg})` }}>Gerenciar Alunos</button>
                <button onClick={() => navigate('/fluxo-de-caixa')} style={{ backgroundImage: `url(${cashFlowImg})` }}>Gerenciar Fluxo</button>
                <button onClick={() => navigate('/gerenciar-saude')} style={{ backgroundImage: `url(${healthImg})` }}>Gerenciar Saúde</button>
                <button onClick={() => navigate('/checkin')} style={{ backgroundImage: `url(${checkinImg})` }}>Check-in</button>
                <button onClick={() => navigate('/presence')} style={{ backgroundImage: `url(${presenceImg})` }}>Presença de Hoje</button>
                <button onClick={() => navigate('/gerenciar-planos')} style={{ backgroundImage: `url(${gerenciarPlanosImg})` }}>Gerenciar Planos</button>
                <button onClick={() => navigate('/gerenciar-eventos')} style={{ backgroundImage: `url(${manageEventsImg})` }}>Gerenciar Eventos</button>
                <button onClick={() => navigate('/gerenciar-videos')} style={{ backgroundImage: `url(${videoImg})` }}>Gerenciar Vídeos</button>
                <button onClick={() => navigate('/gerenciar-resultados')} style={{ backgroundImage: `url(${resultsImg})` }}>Gerenciar Resultados</button>
                <button onClick={() => navigate('/gerenciar-categorias')} style={{ backgroundImage: `url(${categoriesImg})` }}>Gerenciar Categorias</button>
                <button onClick={() => navigate('/gerenciar-avisos')} style={{ backgroundImage: `url(${noticesImg})` }}>Gerenciar Avisos</button>
                <button onClick={() => navigate('/gerenciar-aulas')} style={{ backgroundImage: `url(${scheduleImg})` }}>Gerenciar Aulas</button>
            </nav>

            <main className="admin-dashboard-content">
                <section>
                    <h2 className="section-title">Buscar Aluno por Nome</h2>
                    <input 
                        type="text" 
                        placeholder="Comece a digitar o nome para buscar..." 
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="search-input"
                    />
                    <div className="search-results-container">
                        {isSearching ? <p>Buscando...</p> : message ? <p>{message}</p> : (
                            <ul className="results-list">
                                {searchResults.map(aluno => (
                                    <li key={aluno.id} className="result-item">
                                        <span className="result-name">{aluno.nome}</span>
                                        <span className="result-id">ID: {aluno.aluno_id}</span>
                                        <div>
                                            <button onClick={() => navigate(`/student-details/${aluno.id}`)} className="details-button">Ver Detalhes</button>
                                            <button onClick={() => navigate(`/payments/${aluno.id}`)} className="payment-button">Pagamento</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
                
                <OverdueStudents navigate={navigate} />

                <section>
                    <h2 className="section-title">A Receber no Dia</h2>
                    <div className="due-day-filter">
                        {[1, 10, 20, 28].map(day => (
                            <button 
                                key={day}
                                className={`filter-button ${dueDayFilter === day ? 'active' : ''}`}
                                onClick={() => fetchStudentsByDueDate(day)}
                            >
                                Dia {day}
                            </button>
                        ))}
                    </div>
                    <div className="search-results-container">
                        {loadingDue ? <p>Buscando...</p> : dueStudents.length > 0 ? (
                            <ul className="results-list">
                                {dueStudents.map(aluno => (
                                    <li key={aluno.id} className="result-item">
                                        <span className="result-name">{aluno.nome}</span>
                                        <span className="result-id">Mensalidade: ¥{aluno.mensalidade?.toLocaleString('ja-JP')}</span>
                                        <div>
                                            <button onClick={() => navigate(`/student-details/${aluno.id}`)} className="details-button">Ver Detalhes</button>
                                            <button onClick={() => navigate(`/payments/${aluno.id}`)} className="payment-button">Pagamento</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            dueDayFilter && <p>Nenhum aluno com vencimento para o dia {dueDayFilter} encontrado.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Dashboard;