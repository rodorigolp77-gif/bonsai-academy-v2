// src/components/StudentPresenceScreen.jsx
import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import bonsaiLogo from '../assets/bonsai_logo.png';

function StudentPresenceScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState([]);
    const [message, setMessage] = useState(''); 
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!searchTerm) {
            setMessage("Por favor, insira o ID ou nome do aluno.");
            setRecords([]);
            return;
        }

        setLoading(true);
        setMessage('');
        setRecords([]);

        try {
            let searchId = null;
            let studentName = null;

            // Tenta buscar por ID se a entrada for um número
            const isNumber = !isNaN(searchTerm) && !isNaN(parseFloat(searchTerm));
            
            if (isNumber) {
                const idNumber = parseInt(searchTerm);
                const alunoQuery = query(collection(db, 'alunos'), where('aluno_id', '==', idNumber));
                const alunoSnapshot = await getDocs(alunoQuery);
                if (!alunoSnapshot.empty) {
                    searchId = idNumber;
                    studentName = alunoSnapshot.docs[0].data().nome;
                }
            } else {
                // Se a entrada for um texto, busca por nome na coleção 'alunos'
                const nameQuery = query(
                    collection(db, 'alunos'),
                    where('nome', '>=', searchTerm),
                    where('nome', '<=', searchTerm + '\uf8ff')
                );
                const nameSnapshot = await getDocs(nameQuery);
                
                if (nameSnapshot.empty) {
                    setMessage("Aluno não encontrado.");
                    setLoading(false);
                    return;
                }
                
                // Pega o primeiro aluno encontrado para a busca
                searchId = nameSnapshot.docs[0].data().aluno_id;
                studentName = nameSnapshot.docs[0].data().nome;
            }

            if (!searchId) {
                setMessage("Aluno não encontrado.");
                setLoading(false);
                return;
            }

            // Realiza a busca na coleção 'presenca' usando o ID encontrado
            const recordsQuery = query(collection(db, 'presenca'), where('aluno_id', '==', searchId));
            const recordsSnapshot = await getDocs(recordsQuery);

            if (recordsSnapshot.empty) {
                setMessage(`Nenhum registro encontrado para o aluno ${studentName}.`);
                setRecords([]);
            } else {
                const studentRecords = recordsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
                studentRecords.sort((a, b) => b.checkin_at.toDate() - a.checkin_at.toDate());
                setRecords(studentRecords);
                setMessage(`Encontrados ${studentRecords.length} registros para o aluno ${studentName}.`);
            }

        } catch (error) {
            console.error("Erro ao buscar registros:", error);
            setMessage("Ocorreu um erro ao buscar os registros. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const navigateToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h1 style={titleStyle}>Consultar Presença por Aluno</h1>

            <div style={searchContainerStyle}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ID ou Nome do Aluno"
                    style={inputStyle}
                />
                <button onClick={handleSearch} style={searchButtonStyle}>
                    Consultar
                </button>
            </div>

            {loading && <p style={loadingStyle}>Carregando...</p>}
            
            {message && !loading && <p style={messageStyle}>{message}</p>}

            {records.length > 0 && (
                <div style={recordsContainerStyle}>
                    {records.map(record => (
                        <div key={record.id} style={recordCardStyle}>
                            <span style={recordNameStyle}>{record.aluno_nome}</span>
                            <span style={recordDateStyle}>
                                {record.checkin_at.toDate().toLocaleDateString('pt-BR')}
                            </span>
                            <span style={recordTimeStyle}>
                                {record.checkin_at.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <button onClick={navigateToDashboard} style={backButtonStyle}>
                Voltar ao Painel Central
            </button>
        </div>
    );
}

// Estilos (mantidos da versão anterior)
const containerStyle = {
    padding: '20px', maxWidth: '550px', margin: 'auto', textAlign: 'center',
    fontFamily: 'sans-serif', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh',
    border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700',
};
const logoStyle = { width: '150px', marginBottom: '20px' };
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700', marginBottom: '20px' };
const searchContainerStyle = { display: 'flex', gap: '10px', marginBottom: '20px' };
const inputStyle = {
    flex: '1', padding: '10px', fontSize: '1em', borderRadius: '8px', border: '1px solid #FFD700',
    backgroundColor: '#333', color: 'white',
};
const searchButtonStyle = {
    padding: '10px 20px', backgroundColor: '#FFD700', color: '#1a1a1a', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
};
const loadingStyle = { fontStyle: 'italic', color: '#aaa' };
const messageStyle = { fontStyle: 'italic', color: 'white' };
const recordsContainerStyle = {
    display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px',
    backgroundColor: '#282828', padding: '15px', borderRadius: '10px', border: '1px solid #FFD700',
    boxShadow: '0 0 8px #FFD700',
};
const recordCardStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 15px', backgroundColor: '#333', borderRadius: '8px',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)', border: '1px solid #FFD700',
};
const recordNameStyle = { fontWeight: 'bold', color: '#fff', fontSize: '1em', textShadow: '0 0 5px #FFD700' };
const recordDateStyle = { fontSize: '0.9em', color: '#bbb' };
const recordTimeStyle = { fontSize: '0.9em', color: '#bbb' };
const backButtonStyle = {
    padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none',
    borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold', textTransform: 'uppercase',
};

export default StudentPresenceScreen;