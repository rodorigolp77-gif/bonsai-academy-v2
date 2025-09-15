 import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 

// --- CORREÇÃO DE IMPORTS ---
// Caminho corrigido para buscar 'auth' e 'db' do seu arquivo de configuração
// Dentro de src/components/LoginPage.jsx
import { auth, db } from '../firebaseConfig';
// Assets e CSS
import bonsaiLogo from '../assets/bonsai_logo.png'; // Verifique se o caminho para seu logo está correto
import './LoginPage.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err) {
            console.error("Erro ao fazer login:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('E-mail ou senha inválidos.');
            } else {
                setError('Ocorreu um erro ao tentar fazer login.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- CÓDIGO ADICIONADO PARA DEPURAÇÃO ---
    // Esta função cria o perfil no Firestore para o usuário que está logado
    const handleCreateTestProfile = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                console.log(`Tentando criar/atualizar perfil para o usuário com UID: ${user.uid}`);
                // Cria o documento na coleção 'users'
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, {
                    email: user.email,
                    nome: "Usuário de Teste",
                    role: "aluno"
                });

                // Cria o documento na coleção 'alunos'
                const alunoDocRef = doc(db, 'alunos', user.uid);
                await setDoc(alunoDocRef, {
                    graduacao: "Faixa Branca (Criado via Teste)",
                    planoAtivo: true
                });

                alert(`SUCESSO!\n\nPerfil para ${user.email} foi criado/corrigido no Firestore.\n\nPor favor, RECARREGUE A PÁGINA (F5) agora.`);

            } catch (error) {
                console.error("Erro ao criar perfil de teste:", error);
                alert(`ERRO: Não foi possível criar o perfil. Veja o console (F12).`);
            }
        } else {
            alert("ERRO: Você precisa estar logado para usar esta função. Faça o login primeiro e depois clique neste botão novamente.");
        }
    };
    // --- FIM DO CÓDIGO ADICIONADO ---

    return (
        <div className="login-container">
            <div className="login-box">
                <img src={bonsaiLogo} alt="Logo Bonsai" className="login-logo" />
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="email">E-mail</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* --- BOTÃO DE DEPURAÇÃO ADICIONADO --- */}
                <div style={{ border: '2px solid orange', padding: '10px', marginTop: '30px', textAlign: 'left' }}>
                    <h3>Ferramenta de Depuração</h3>
                    <p style={{fontSize: '12px', margin: '0 0 10px 0'}}>
                        <b>Instruções:</b><br />
                        1. Faça o login normalmente.<br />
                        2. Se o app reclamar que não há perfil, volte para esta tela.<br />
                        3. Clique no botão laranja abaixo.<br />
                        4. Após o alerta de SUCESSO, recarregue a página (F5).
                    </p>
                    <button onClick={handleCreateTestProfile} style={{ backgroundColor: 'orange', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', width: '100%' }}>
                        Criar / Corrigir Meu Perfil de Aluno
                    </button>
                </div>
                {/* --- FIM DO BOTÃO ADICIONADO --- */}
            </div>
        </div>
    );
}

export default LoginPage;