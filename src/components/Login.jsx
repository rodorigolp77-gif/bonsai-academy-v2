 // src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import bonsaiLogo from '../assets/bonsai_logo.png';

const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontFamily: 'sans-serif'
};

const formContainerStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 0 20px #FFD700',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
};

const titleStyle = {
    color: '#FFD700',
    textShadow: '0 0 10px #FFD700',
    marginBottom: '20px'
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    borderRadius: '8px',
    border: '1px solid #FFD700',
    backgroundColor: '#333',
    color: '#FFD700',
    boxShadow: '0 0 5px #FFD700',
    boxSizing: 'border-box'
};

const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    marginTop: '20px',
    boxShadow: '0 0 15px #28a745',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
};

const messageStyle = {
    marginTop: '20px',
    fontWeight: 'bold',
    color: '#dc3545'
};

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard'); // Redireciona para o painel principal após o login
        } catch (error) {
            console.error("Erro de login:", error);
            setMessage("Erro de login. Verifique seu e-mail e senha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={formContainerStyle}>
                <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={{ width: '100px', marginBottom: '20px' }} />
                <h2 style={titleStyle}>Acesso ao Sistema</h2>
                <form onSubmit={handleLogin}>
                    <div>
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            required
                        />
                    </div>
                    <button type="submit" style={buttonStyle} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
                {message && <p style={messageStyle}>{message}</p>}
            </div>
        </div>
    );
}

export default Login;