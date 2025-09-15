 // src/components/PaymentSearch.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bonsaiLogo from '../assets/bonsai_logo.png';

function PaymentSearch() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');

    const handleSearch = () => {
        if (studentId.length === 4) {
            navigate(`/add-payment/${studentId}`);
        } else {
            alert("Por favor, digite um ID de 4 dígitos.");
        }
    };

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h2 style={titleStyle}>Registrar Pagamento</h2>
            <p style={subtitleStyle}>Digite o ID de 4 dígitos do aluno para continuar:</p>
            
            <div style={searchContainerStyle}>
                <input
                    type="number"
                    placeholder="ID do aluno"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    style={searchInputStyle}
                />
                <button onClick={handleSearch} style={searchButtonStyle}>
                    Abrir Formulário de Pagamento
                </button>
            </div>
            <button onClick={() => navigate('/dashboard')} style={backButtonStyle}>
                &larr; Voltar para o Painel
            </button>
        </div>
    );
}

// Estilos
const containerStyle = {
    padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif',
    border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white'
};
const logoStyle = { width: '150px', marginBottom: '10px' };
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700' };
const subtitleStyle = { color: 'white' };
const searchContainerStyle = {
    marginBottom: '20px', padding: '20px', border: '1px solid #ddd',
    borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.05)'
};
const searchInputStyle = {
    padding: '10px', fontSize: '1em', border: '1px solid #FFD700',
    borderRadius: '5px', width: 'calc(100% - 22px)', marginBottom: '10px',
    backgroundColor: '#333', color: 'white'
};
const searchButtonStyle = {
    padding: '10px 20px', backgroundColor: '#28a745', color: 'white',
    border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%',
    transition: 'background-color 0.2s',
};
const backButtonStyle = {
    padding: '10px 20px', backgroundColor: '#6c757d', color: 'white',
    border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%',
    marginTop: '10px', transition: 'background-color 0.2s'
};

export default PaymentSearch;