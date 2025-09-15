 // src/components/PresenceScreen.jsx
import React, { useState, useEffect } from 'react';
import { db } from "../firebaseConfig";import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import bonsaiLogo from '../assets/bonsai_logo.png';

function PresenceScreen() {
    const [dailyCheckins, setDailyCheckins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDailyCheckins();
    }, []);

    const fetchDailyCheckins = async () => {
        setLoading(true);
        setError('');
        
        try {
            // 1. Definir o início e o fim do dia de hoje para a busca
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Define o horário para 00:00:00
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1); // Adiciona um dia

            // 2. Criar uma query otimizada para buscar apenas os check-ins de hoje
            const checkinQuery = query(
                collection(db, 'presencas'),
                where('data_presenca', '>=', Timestamp.fromDate(today)),
                where('data_presenca', '<', Timestamp.fromDate(tomorrow))
            );
            
            console.log("Iniciando a busca otimizada de check-ins para hoje...");
            const checkinSnapshot = await getDocs(checkinQuery);

            const checkinList = checkinSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                checkinTime: doc.data().data_presenca.toDate()
            }));

            console.log(`Encontrados ${checkinList.length} check-ins para hoje.`);

            // 3. Buscar os dados dos alunos em uma única consulta (se houver check-ins)
            let studentsData = {};
            if (checkinList.length > 0) {
                const uniqueAlunoIds = [...new Set(checkinList.map(item => item.aluno_id))];
                
                // Firestore 'in' query supports up to 10 items
                // For more, you'd need multiple queries, but this is a good start
                if (uniqueAlunoIds.length > 0) {
                    const studentsQuery = query(collection(db, 'alunos'), where('aluno_id', 'in', uniqueAlunoIds));
                    const studentsSnapshot = await getDocs(studentsQuery);
                    studentsSnapshot.forEach(doc => {
                        const data = doc.data();
                        studentsData[data.aluno_id] = { nome: data.nome, docId: doc.id };
                    });
                }
            }

            // 4. Juntar os dados de presença com os nomes dos alunos
            const checkinsWithNames = checkinList.map(checkin => ({
                ...checkin,
                aluno_nome: studentsData[checkin.aluno_id]?.nome || 'Nome não encontrado',
                aluno_doc_id: studentsData[checkin.aluno_id]?.docId || null
            }));

            checkinsWithNames.sort((a, b) => a.checkinTime - b.checkinTime); // Ordena do mais antigo para o mais recente

            setDailyCheckins(checkinsWithNames);
        } catch (err) {
            console.error("Erro completo ao buscar check-ins:", err);
            setError("Ocorreu um erro ao carregar os dados. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const navigateToDashboard = () => {
        navigate('/dashboard');
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h1 style={titleStyle}>Presenças de Hoje</h1>

            <div style={checkinInfoContainerStyle}>
                <h3 style={totalCountStyle}>Total: {dailyCheckins.length} alunos</h3>
                {loading ? (
                    <p style={loadingStyle}>Carregando presenças...</p>
                ) : (
                    dailyCheckins.length > 0 ? (
                        <div style={listContainerStyle}>
                            {dailyCheckins.map((checkin) => (
                                <div key={checkin.id} style={checkinCardStyle}>
                                    <div style={cardInfoContainerStyle}>
                                        <span style={cardNameStyle}>{checkin.aluno_nome || 'Aluno Desconhecido'}</span>
                                        <span style={cardIdStyle}>ID: {checkin.aluno_id || 'N/A'}</span>
                                        <span style={cardTimeStyle}>
                                            Check-in: {formatTime(checkin.checkinTime)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={noCheckinsStyle}>{error || "Nenhum check-in registrado hoje."}</p>
                    )
                )}
            </div>

            <button onClick={navigateToDashboard} style={backButtonStyle}>
                Voltar ao Painel Central
            </button>
        </div>
    );
}

// Estilos
const containerStyle = {
    padding: '20px',
    maxWidth: '550px',
    margin: 'auto',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    backgroundColor: '#1a1a1a',
    color: 'white',
    minHeight: '100vh',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    boxShadow: '0 0 20px #FFD700',
};
const logoStyle = {
    width: '150px',
    marginBottom: '20px',
};
const titleStyle = {
    color: '#FFD700',
    textShadow: '0 0 10px #FFD700',
    marginBottom: '20px',
};
const checkinInfoContainerStyle = {
    backgroundColor: 'rgba(40, 40, 40, 0.7)',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    border: '1px solid #FFD700',
    boxShadow: '0 0 8px #FFD700',
};
const totalCountStyle = {
    color: '#FFD700',
    fontSize: '1.2em',
    marginBottom: '15px',
    borderBottom: '1px solid #444',
    paddingBottom: '10px',
};
const loadingStyle = {
    fontStyle: 'italic',
    color: '#aaa',
};
const noCheckinsStyle = {
    fontStyle: 'italic',
    color: '#aaa',
};
const listContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
};
const checkinCardStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    backgroundColor: '#333',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
    border: '1px solid #FFD700',
};
const cardInfoContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
};
const cardNameStyle = {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: '1em',
    textShadow: '0 0 5px #FFD700',
};
const cardIdStyle = {
    fontSize: '0.9em',
    color: '#bbb',
    marginRight: '10px',
};
const cardTimeStyle = {
    fontSize: '0.9em',
    color: '#bbb',
};
const backButtonStyle = {
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 'bold',
    textTransform: 'uppercase',
};

export default PresenceScreen;