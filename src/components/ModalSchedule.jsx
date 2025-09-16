import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FaSignOutAlt, FaCalendarAlt, FaDumbbell, FaVideo, FaUtensils, FaHeartbeat, FaCalculator } from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import bonsaiLogo from '../assets/bonsai_logo.png';
// Caminhos corrigidos para as faixas (JIU-JITSU)
import faixaBranca from '../assets/faixas/branca.png';
import faixaCinza from '../assets/faixas/cinza.png';
import faixaAmarela from '../assets/faixas/amarela.png';
import faixaLaranja from '../assets/faixas/laranja.png';
import faixaVerde from '../assets/faixas/verde.png';
import faixaRoxa from '../assets/faixas/roxa.png';
import faixaMarrom from '../assets/faixas/marrom.png';
import faixaPreta from '../assets/faixas/preta.png';
// Caminhos corrigidos para as cordas (CAPOEIRA)
import cordaCrua from '../assets/cordas/corda-crua.jpg';
import cordaAmarela from '../assets/cordas/cordaamarela.jpg';
import cordaLaranja from '../assets/cordas/cordalaranja.jpg';
import cordaAzul from '../assets/cordas/cordaazul.jpg';
import cordaVerde from '../assets/assets/cordas/cordaverde.jpg';
import cordaRoxa from '../assets/cordas/cordaroxa.jpg';
import cordaMarrom from '../assets/cordas/cordamarrom.jpg';
import cordaPreta from '../assets/cordas/cordapreta.jpg';

// Imagens locais para os botões de navegação
import scheduleImg from '../assets/imagensbotoes/aulas.jpg';
import fitnessImg from '../assets/imagensbotoes/saude.png';
import videoImg from '../assets/imagensbotoes/videoaula.jpg';
import healthImg from '../assets/imagensbotoes/saude.png';

import './StudentDashboard.css';

const getFaixaImage = (faixa) => {
    const faixas = {
        'branca': faixaBranca, 'cinza': faixaCinza, 'amarela': faixaAmarela,
        'laranja': faixaLaranja, 'verde': faixaVerde, 'roxa': faixaRoxa,
        'marrom': faixaMarrom, 'preta': faixaPreta,
    };
    const cordas = {
        'crua': cordaCrua, 'amarela': cordaAmarela, 'laranja': cordaLaranja,
        'azul': cordaAzul, 'verde': cordaVerde, 'roxa': cordaRoxa,
        'marrom': cordaMarrom, 'preta': cordaPreta
    };
    return faixas[faixa] || cordas[faixa] || faixaBranca;
};

const getGraduacaoLabel = (graduacao) => {
    const labels = {
        'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela',
        'laranja': 'Laranja', 'verde': 'Verde', 'roxa': 'Roxa',
        'marrom': 'Marrom', 'preta': 'Preta',
    };
    return labels[graduacao] || 'Sem Faixa';
};

const getCordaLabel = (corda) => {
    const labels = {
        'crua': 'Corda Crua', 'amarela': 'Corda Amarela', 'laranja': 'Corda Laranja',
        'azul': 'Corda Azul', 'verde': 'Corda Verde', 'roxa': 'Corda Roxa',
        'marrom': 'Corda Marrom', 'preta': 'Corda Preta',
    };
    return labels[corda] || 'Sem Corda';
};

const StudentDashboard = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [presenceDates, setPresenceDates] = useState([]);
    const [attendanceDays, setAttendanceDays] = useState(0);
    const [activeTab, setActiveTab] = useState('schedule');
    const [exercises, setExercises] = useState([]);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [dietModalOpen, setDietModalOpen] = useState(false);
    const [saudeSubTab, setSaudeSubTab] = useState('calculators');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [activityLevel, setActivityLevel] = useState('1.2');
    const [calorieResults, setCalorieResults] = useState(null);
    const [calculationHistory, setCalculationHistory] = useState([]);


    const calculateMacros = (calories) => {
        const macros = {
            gain: {
                protein: (calories * 0.3 / 4).toFixed(0),
                carbs: (calories * 0.45 / 4).toFixed(0),
                fats: (calories * 0.25 / 9).toFixed(0),
            },
            maintain: {
                protein: (calories * 0.25 / 4).toFixed(0),
                carbs: (calories * 0.5 / 4).toFixed(0),
                fats: (calories * 0.25 / 9).toFixed(0),
            },
            lose: {
                protein: (calories * 0.35 / 4).toFixed(0),
                carbs: (calories * 0.4 / 4).toFixed(0),
                fats: (calories * 0.25 / 9).toFixed(0),
            }
        };
        return macros;
    };

    const handleCalculateTDEE = () => {
        if (!weight || !height || !age) {
            alert('Por favor, preencha todos os campos para calcular.');
            return;
        }

        const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        const tdee = bmr * parseFloat(activityLevel);

        setCalorieResults({
            lose: (tdee - 500).toFixed(0),
            maintain: tdee.toFixed(0),
            gain: (tdee + 300).toFixed(0)
        });

        const newEntry = {
            date: new Date().toLocaleDateString(),
            weight,
            height,
            age,
            tdee: tdee.toFixed(0),
        };
        setCalculationHistory(prev => [newEntry, ...prev].slice(0, 5));
    };


    const formatDateForTile = (date) => date.toLocaleDateString();

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const formattedDate = formatDateForTile(date);
            if (presenceDates.includes(formattedDate)) {
                return <img src={bonsaiLogo} alt="Presença" className="calendar-logo-checkin" />;
            }
        }
        return null;
    };

    const fetchStudentData = useCallback(async () => {
        if (!currentUser) {
            setError("Usuário não autenticado.");
            setLoading(false);
            return;
        }

        try {
            const q = query(collection(db, 'alunos'), where('uid', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const studentDoc = querySnapshot.docs[0];
                const studentData = { id: studentDoc.id, ...studentDoc.data() };
                setStudent(studentData);

                fetchAttendanceData(studentDoc.id);
                fetchExercises(studentData.modalidade || []);
            } else {
                setError("Dados do aluno não encontrados.");
            }
        } catch (err) {
            console.error("Erro ao buscar dados do aluno:", err);
            setError("Ocorreu um erro ao carregar os dados.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const fetchAttendanceData = async (studentId) => {
        try {
            const q = query(collection(db, 'presencas'), where('aluno_uid', '==', studentId));
            const querySnapshot = await getDocs(q);
            const dates = querySnapshot.docs.map(doc => doc.data().data_presenca.toDate().toLocaleDateString());
            setPresenceDates(dates);

            const last30Days = new Date();
            last30Days.setDate(last30Days.getDate() - 30);
            const recentAttendance = querySnapshot.docs.filter(doc => doc.data().data_presenca.toDate() > last30Days);
            setAttendanceDays(recentAttendance.length);
        } catch (err) {
            console.error("Erro ao buscar presenças:", err);
        }
    };

    const fetchExercises = async (modalities) => {
        if (modalities.length === 0) {
            setExercises([]);
            return;
        }

        try {
            const q = query(collection(db, 'exercicios'), where('modalidade', 'array-contains-any', modalities));
            const querySnapshot = await getDocs(q);
            const fetchedExercises = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExercises(fetchedExercises);
        } catch (err) {
            console.error("Erro ao buscar exercícios:", err);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, [fetchStudentData]);

    if (loading) return <div className="loading-screen">Carregando...</div>;
    if (error) return <div className="error-screen">{error}</div>;
    if (!student) return <div className="error-screen">Dados do aluno não encontrados.</div>;

    const jiuJitsuGraduacao = student.graduacoes ? student.graduacoes.find(g => g.modalidade === 'jiu-jitsu') : null;
    const capoeiraGraduacao = student.graduacoes ? student.graduacoes.find(g => g.modalidade === 'capoeira') : null;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <img src={bonsaiLogo} alt="Bonsai Logo" className="header-logo" />
                    <div className="header-text">
                        <h1 className="bonsai-line">BONSAI</h1>
                        <p className="academy-line">JIU JITSU ACADEMY</p>
                    </div>
                </div>

                <div className="header-center">
                    <h2>Bem-vindo, {student.nome}!</h2>
                    <div className="graduacoes-container">
                        {jiuJitsuGraduacao && (
                            <div className="graduacao-item">
                                <img src={getFaixaImage(jiuJitsuGraduacao.modalidade, jiuJitsuGraduacao.graduacao)} alt={`Faixa ${jiuJitsuGraduacao.graduacao}`} className="faixa-image" />
                                <p className="graduacao-text">Jiu Jitsu: {getGraduacaoLabel(jiuJitsuGraduacao.graduacao)}</p>
                            </div>
                        )}
                        {capoeiraGraduacao && (
                            <div className="graduacao-item">
                                <img src={getFaixaImage(capoeiraGraduacao.modalidade, capoeiraGraduacao.graduacao)} alt={`Corda ${capoeiraGraduacao.graduacao}`} className="corda-image" />
                                <p className="graduacao-text">Capoeira: {getCordaLabel(capoeiraGraduacao.graduacao)}</p>
                            </div>
                        )}
                        {!jiuJitsuGraduacao && !capoeiraGraduacao && (
                            <p className="graduacao-text">Nenhuma graduação registrada.</p>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    <button onClick={handleLogout} className="header-action-button logout-button">
                        <FaSignOutAlt />
                        <span>Sair</span>
                    </button>
                </div>
            </header>

            <nav className="dashboard-nav">
                <button onClick={() => setActiveTab('schedule')} className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`} style={{ backgroundImage: `url(${scheduleImg})` }}><span><FaCalendarAlt /> Horário de Aulas</span></button>
                <button onClick={() => setActiveTab('fitness')} className={`tab-button ${activeTab === 'fitness' ? 'active' : ''}`} style={{ backgroundImage: `url(${fitnessImg})` }}><span><FaDumbbell /> Plano Fitness</span></button>
                <button onClick={() => setActiveTab('videos')} className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`} style={{ backgroundImage: `url(${videoImg})` }}><span><FaVideo /> Vídeo Aulas</span></button>
                <button onClick={() => setActiveTab('health')} className={`tab-button ${activeTab === 'health' ? 'active' : ''}`} style={{ backgroundImage: `url(${dietImg})` }}><span><FaUtensils /> Dicas de Cardápio</span></button>
            </nav>

            <main className="dashboard-content">
                {activeTab === 'schedule' && (
                    <section className="schedule-section">
                        <h2 className="section-title">Calendário de Presenças</h2>
                        <p className="section-subtitle">Dias em que você esteve presente no último ano.</p>
                        <Calendar
                            tileContent={tileContent}
                            className="custom-calendar"
                        />
                    </section>
                )}
                {activeTab === 'fitness' && (
                    <section className="fitness-section">
                        <h2 className="section-title">Seu Plano Fitness</h2>
                        <div className="days-trained-info">
                            <p>Dias treinados nos últimos 30 dias: {attendanceDays}</p>
                        </div>
                        {exercises.length > 0 ? (
                            <ul className="exercises-list-detailed">
                                {exercises.map(ex => (
                                    <li key={ex.id} className="exercise-item-detailed">
                                        <div className="exercise-info">
                                            <strong>{ex.nome}</strong>
                                            <span>{ex.descricao}</span>
                                        </div>
                                        <button onClick={() => { setVideoUrl(ex.videoUrl); setShowVideoModal(true); }} className="exercise-video-btn">Ver Vídeo</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-exercises-message">Nenhum exercício encontrado para a sua modalidade.</p>
                        )}
                        <button className="checkin-button">
                            Check-in Diário
                        </button>
                    </section>
                )}
                {activeTab === 'videos' && (
                    <section className="videos-section">
                        <h2 className="section-title">Vídeo Aulas</h2>
                        <p>Conteúdo de vídeo exclusivo para alunos.</p>
                        {/* Conteúdo das vídeo aulas irá aqui */}
                    </section>
                )}
                {activeTab === 'health' && (
                    <section className="health-section-container">
                        <h2 className="section-title">Saúde e Nutrição</h2>
                        <p className="section-subtitle">Ferramentas para ajudar você a alcançar seus objetivos.</p>

                        <div className="sub-nav">
                            <button onClick={() => setSaudeSubTab('calculators')} className={`sub-nav-button ${saudeSubTab === 'calculators' ? 'active' : ''}`}>
                                <FaCalculator /> Calculadoras
                            </button>
                            <button onClick={() => setSaudeSubTab('mealplan')} className={`sub-nav-button ${saudeSubTab === 'mealplan' ? 'active' : ''}`}>
                                <FaUtensils /> Cardápio
                            </button>
                        </div>
                        
                        {saudeSubTab === 'calculators' && (
                            <div className="calculators-content">
                                <div className="disclaimer-message">
                                    <p>As calculadoras são apenas estimativas. Para um plano preciso, consulte um nutricionista.</p>
                                </div>
                                <div className="calculator-form">
                                    <div className="input-group">
                                        <label>Peso (kg)</label>
                                        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label>Altura (cm)</label>
                                        <input type="number" value={height} onChange={e => setHeight(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label>Idade (anos)</label>
                                        <input type="number" value={age} onChange={e => setAge(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label>Nível de Atividade</label>
                                        <select value={activityLevel} onChange={e => setActivityLevel(e.target.value)}>
                                            <option value="1.2">Sedentário</option>
                                            <option value="1.375">Levemente Ativo</option>
                                            <option value="1.55">Moderadamente Ativo</option>
                                            <option value="1.725">Muito Ativo</option>
                                            <option value="1.9">Extremamente Ativo</option>
                                        </select>
                                    </div>
                                    <button onClick={handleCalculateTDEE} className="calculate-btn">
                                        Calcular
                                    </button>
                                </div>

                                {calorieResults && (
                                    <div className="results-container">
                                        <h4>Resultados de Consumo Calórico</h4>
                                        <div className="results-grid">
                                            {Object.keys(calorieResults).map(key => {
                                                const macros = calculateMacros(calorieResults[key]);
                                                return (
                                                    <div key={key} className="result-card">
                                                        <h5>{key === 'lose' ? 'Emagrecer' : key === 'gain' ? 'Ganhar Peso' : 'Manter Peso'}</h5>
                                                        <p><strong>Calorias:</strong> {calorieResults[key]} kcal</p>
                                                        <p><strong>Proteína:</strong> {macros[key].protein}g</p>
                                                        <p><strong>Carboidratos:</strong> {macros[key].carbs}g</p>
                                                        <p><strong>Gordura:</strong> {macros[key].fats}g</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                {calculationHistory.length > 0 && (
                                    <div className="history-list-small">
                                        <h4>Histórico de Cálculos (últimos 5)</h4>
                                        <ul>
                                            {calculationHistory.map((item, index) => (
                                                <li key={index}>
                                                    <span>Data: {item.date}</span>
                                                    <span>Peso: {item.weight} kg</span>
                                                    <span>TDEE: {item.tdee} kcal</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {saudeSubTab === 'mealplan' && (
                            <div className="mealplan-content">
                                <div className="disclaimer-message">
                                    <p>Os cardápios são apenas sugestões. Consulte um profissional para um plano personalizado.</p>
                                </div>
                                <div className="meal-plan-display">
                                    <h4>Seu Plano Alimentar Diário</h4>
                                    <p><strong>Café da Manhã:</strong> {sampleMealPlan.breakfast}</p>
                                    <p><strong>Almoço:</strong> {sampleMealPlan.lunch}</p>
                                    <p><strong>Jantar:</strong> {sampleMealPlan.dinner}</p>
                                    <p><strong>Lanche:</strong> {sampleMealPlan.snack}</p>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </main>
            {showVideoModal && (
                <div className="modal-overlay-video">
                    <div className="video-player-container">
                        <div className="video-header">
                            <h3>Video Aula</h3>
                            <button onClick={() => setShowVideoModal(false)} className="close-video-btn">×</button>
                        </div>
                        <div className="video-responsive">
                            <iframe src={videoUrl} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;