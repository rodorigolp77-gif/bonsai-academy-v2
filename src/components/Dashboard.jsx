import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import bonsaiLogo from '../assets/bonsai_logo.png';
import OverdueStudents from './OverdueStudents';

function Dashboard() {
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState('');

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
            const q = query(
                collection(db, 'alunos'),
                where('nome', '>=', name),
                where('nome', '<=', end)
            );
            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (results.length === 0) {
                setMessage("Nenhum aluno encontrado.");
            } else {
                setSearchResults(results);
            }
        } catch (error) {
            console.error("Erro ao buscar alunos por nome:", error);
            setMessage("Ocorreu um erro ao buscar.");
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudentsByName(searchName);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchName, fetchStudentsByName]);

    const handleSearchById = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        setSearchResults([]);
        setMessage('');

        // --- CORREÇÃO APLICADA AQUI ---
        if (!searchId.trim()) {
            setMessage("Por favor, insira um ID para buscar.");
            setIsSearching(false);
            return;
        }
        
        try {
            // Procura pelo 'aluno_id' como TEXTO (string), não como número
            const q = query(collection(db, 'alunos'), where('aluno_id', '==', searchId.trim()));
            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (results.length === 0) {
                setMessage("Nenhum aluno encontrado com este ID.");
            } else {
                setSearchResults(results);
            }
        } catch (error) {
            console.error("Erro ao buscar alunos por ID:", error);
            setMessage("Ocorreu um erro ao buscar.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            alert("Você saiu com sucesso.");
            navigate('/');
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h2 style={titleStyle}>Painel do Administrador</h2>
            <p style={subtitleStyle}>Selecione uma opção abaixo:</p>
            
            <div style={searchContainerStyle}>
                <h3 style={searchTitleStyle}>Buscar Aluno por Nome</h3>
                <input 
                    type="text" 
                    placeholder="Comece a digitar o nome" 
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    style={searchInputStyle}
                />
            </div>

            <div style={searchContainerStyle}>
                <h3 style={searchTitleStyle}>Ou buscar por ID</h3>
                <form onSubmit={handleSearchById}>
                    <input 
                        type="text" 
                        placeholder="ID (ex: 1234)" 
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        style={searchInputStyle}
                    />
                    <button type="submit" style={searchButtonStyle} disabled={isSearching}>
                        {isSearching ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>
            </div>
            
            <hr style={dividerStyle} />
            <div style={searchResultsContainerStyle}>
                <h3 style={searchResultsTitleStyle}>Resultados da Busca</h3>
                {isSearching ? (
                    <p style={loadingStyle}>Buscando...</p>
                ) : message ? (
                    <p style={messageStyle}>{message}</p>
                ) : (
                    <ul style={resultsListStyle}>
                        {searchResults.map(aluno => (
                            <li key={aluno.id} style={resultItemStyle}>
                                <span style={resultNameStyle}>{aluno.nome}</span>
                                <span style={resultIdStyle}>ID: {aluno.aluno_id}</span>
                                <button onClick={() => navigate(`/student-details/${aluno.id}`)} style={viewButtonStyle}>Ver Detalhes</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <hr style={dividerStyle} />
            <div style={buttonContainerStyle}>
                <button onClick={() => navigate('/controle-academia')} style={buttonStyle}>Controle da Academia</button>
                <button onClick={() => navigate('/presence')} style={buttonStyle}>Presença de Hoje</button>
                <button onClick={() => navigate('/register-student')} style={buttonStyle}>Cadastrar Novo Aluno</button>
                <button onClick={() => navigate('/checkin')} style={buttonStyle}>Ir para Check-in</button>
                <button onClick={handleLogout} style={logoutButtonStyle}>Sair</button>
            </div>

            <OverdueStudents navigate={navigate} />
        </div>
    );
}

// Estilos
const containerStyle = { padding: '20px', maxWidth: '600px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif', border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700', backgroundColor: 'rgba(255, 255, 255, 0.05)', position: 'relative', color: 'white' };
const logoStyle = { width: '150px', marginBottom: '10px' };
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700' };
const subtitleStyle = { color: 'white' };
const searchContainerStyle = { marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.05)' };
const searchTitleStyle = { color: '#FFD700', fontSize: '1.2em' };
const searchInputStyle = { padding: '10px', fontSize: '1em', border: '1px solid #ccc', borderRadius: '5px', width: 'calc(100% - 22px)', marginBottom: '10px', backgroundColor: '#333', color: 'white' };
const searchButtonStyle = { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', transition: 'background-color 0.2s' };
const buttonContainerStyle = { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' };
const buttonStyle = { padding: '15px', backgroundColor: '#FFD700', color: '#333', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', transition: 'background-color 0.2s', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', cursor: 'pointer', border: 'none' };
const logoutButtonStyle = { padding: '15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' };
const dividerStyle = { borderTop: '1px solid #FFD700', margin: '20px 0' };
const searchResultsContainerStyle = { margin: '20px 0' };
const searchResultsTitleStyle = { color: '#FFD700', fontSize: '1.2em' };
const resultsListStyle = { listStyleType: 'none', padding: '0' };
const resultItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', border: '1px solid #FFD700' };
const resultNameStyle = { fontWeight: 'bold', flexGrow: 1, textAlign: 'left' };
const resultIdStyle = { fontSize: '0.9em', color: '#ccc', marginRight: '10px' };
const viewButtonStyle = { padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const messageStyle = { color: '#dc3545', fontStyle: 'italic', marginTop: '10px' };
const loadingStyle = { color: '#FFD700', fontStyle: 'italic', marginTop: '10px' };

export default Dashboard;