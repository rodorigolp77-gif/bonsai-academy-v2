// src/components/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig'; // IMPORTADO O 'db'
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // IMPORTADO PARA LER DOCUMENTOS
import bonsaiLogo from '../assets/bonsai_logo.png';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // --- FUNÇÃO DE LOGIN ATUALIZADA ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Passo 1: Autenticar o usuário
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Passo 2: Verificar se o usuário é um admin
            const adminDocRef = doc(db, 'admins', user.uid); // Procura um documento na coleção 'admins' com o UID do usuário
            const adminDocSnap = await getDoc(adminDocRef);

            if (adminDocSnap.exists()) {
                // Se o documento existir, é um admin!
                navigate('/dashboard'); // Redireciona para o painel central do ADMIN
            } else {
                // Se não existir, é um aluno.
                navigate('/aluno/dashboard'); // Redireciona para o painel do ALUNO
            }

        } catch (err) {
            console.error("Erro de login:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('E-mail ou senha incorretos.');
            } else {
                setError('Ocorreu um erro ao tentar fazer login.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo" style={{ width: '150px', marginBottom: '20px' }} />
            <h2 style={{ color: '#FFD700', textShadow: '0 0 10px #FFD700' }}>
                Área de Acesso
            </h2>
            
            <form onSubmit={handleLogin} style={formStyle}>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Seu e-mail" 
                    required 
                    style={inputStyle}
                />
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Sua senha" 
                    required 
                    style={inputStyle}
                />
                {error && <p style={{ color: '#dc3545', margin: '10px 0 0' }}>{error}</p>}
                <button type="submit" disabled={loading} style={buttonStyle}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
};

// Estilos (sem alterações)
const containerStyle = { padding: '40px 20px', maxWidth: '400px', margin: '50px auto', textAlign: 'center', fontFamily: 'sans-serif', border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' };
const inputStyle = { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: '#333', color: '#FFD700', border: '1px solid #FFD700', borderRadius: '4px', boxShadow: '0 0 5px #FFD700', fontSize: '1em' };
const buttonStyle = { width: '100%', padding: '15px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2em', marginTop: '10px', transition: 'background-color 0.3s ease, box-shadow 0.3s ease', backgroundColor: '#FFD700', boxShadow: '0 0 15px #FFD700', color: '#1a1a1a', fontWeight: 'bold' };

export default LoginPage;