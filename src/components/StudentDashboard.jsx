// src/components/StudentDashboard.jsx

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { signOut, updatePassword } from 'firebase/auth'; // IMPORTADO O updatePassword
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import bonsaiLogo from '../assets/bonsai_logo.png';
import AttendanceCalendar from './AttendanceCalendar';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    // --- Estados para a nova funcionalidade de troca de senha ---
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' ou 'error'

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const q = query(collection(db, 'alunos'), where('uid', '==', user.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docData = querySnapshot.docs[0].data();
                    setStudentData({ id: querySnapshot.docs[0].id, ...docData });
                } else {
                    console.log("Nenhum aluno encontrado para este login.");
                }
            } catch (error) {
                console.error("Erro ao buscar dados do aluno:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };
    
    // --- Nova função para alterar a senha ---
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');

        if (newPassword.length < 6) {
            setMessage('A nova senha deve ter pelo menos 6 caracteres.');
            setMessageType('error');
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('As senhas não coincidem.');
            setMessageType('error');
            return;
        }

        try {
            await updatePassword(user, newPassword);
            setMessage('Senha alterada com sucesso!');
            setMessageType('success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            setMessage('Erro ao alterar a senha. Tente fazer logout e login novamente.');
            setMessageType('error');
        }
    };

    if (loading) {
        return <div style={containerStyle}><p>Carregando dados do aluno...</p></div>;
    }

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo" style={{ width: '100px', marginBottom: '20px' }} />
            {studentData ? (
                <>
                    <h1 style={{ color: '#FFD700' }}>Bem-vindo, {studentData.nome}!</h1>
                    <p style={{ fontSize: '1.2em', marginBottom: '20px' }}>{studentData.email}</p>
                    
                    <div style={infoBoxStyle}>
                        <p><strong>Faixa:</strong> {studentData.faixa || 'Não informada'}</p>
                        <p><strong>Status:</strong> {studentData.status || 'Não informado'}</p>
                    </div>

                    <AttendanceCalendar student={studentData} />

                    {/* --- Formulário para alterar senha --- */}
                    <div style={passwordFormContainerStyle}>
                        <h3 style={{ color: '#FFD700' }}>Alterar Senha</h3>
                        <form onSubmit={handleChangePassword}>
                            <input 
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nova senha (mínimo 6 caracteres)"
                                style={inputStyle}
                                required
                            />
                            <input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirme a nova senha"
                                style={inputStyle}
                                required
                            />
                            <button type="submit" style={{...buttonStyle, backgroundColor: '#17a2b8'}}>
                                Alterar Senha
                            </button>
                        </form>
                        {message && (
                            <p style={{ color: messageType === 'success' ? '#28a745' : '#dc3545', marginTop: '10px' }}>
                                {message}
                            </p>
                        )}
                    </div>
                </>
            ) : (
                <p>Não foi possível carregar os dados do aluno. Isso pode acontecer se você estiver logado com uma conta de administrador.</p>
            )}

            <button onClick={handleLogout} style={buttonStyle}>
                Sair (Logout)
            </button>
        </div>
    );
};

// Estilos
const containerStyle = { padding: '40px 20px', maxWidth: '600px', margin: '50px auto', textAlign: 'center', fontFamily: 'sans-serif', border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' };
const infoBoxStyle = { border: '1px solid #FFD700', borderRadius: '8px', padding: '10px', marginBottom: '20px', backgroundColor: 'rgba(0,0,0,0.2)' };
const passwordFormContainerStyle = { marginTop: '40px', padding: '20px', border: '1px solid #555', borderRadius: '8px' };
const inputStyle = { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: '#333', color: '#FFD700', border: '1px solid #FFD700', borderRadius: '4px', boxShadow: '0 0 5px #FFD700', fontSize: '1em', marginBottom: '15px' };
// Substitua sua linha do buttonStyle por esta:
const buttonStyle = { width: '100%', padding: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2em', marginTop: '10px', transition: 'background-color 0.3s ease, box-shadow 0.3s ease', backgroundColor: '#FFD700', boxShadow: '0 0 15px #FFD700', color: '#1a1a1a', fontWeight: 'bold' };
export default StudentDashboard;