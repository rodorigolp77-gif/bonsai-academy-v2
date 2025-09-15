// src/components/FluxoDaAcademia.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function FluxoDaAcademia() {
    const navigate = useNavigate();
    
    // Dados de exemplo para ilustrar a estrutura
    const dadosFinanceiros = { 
        totalReceita: 5500.00,
        totalDespesa: 2150.00,
        receitaPorModalidade: {
            'jiu-jitsu-adulto': 3000.00,
            'jiu-jitsu-kids': 1500.00,
            'capoeira': 800.00,
            'fitness': 200.00,
        },
        despesas: [
            { item: 'Aluguel', valor: 1500.00 },
            { item: 'Material de Limpeza', valor: 150.00 },
            { item: 'Luz', valor: 200.00 },
            { item: 'Água', valor: 100.00 },
            { item: 'Internet', valor: 200.00 },
        ],
    };

    const saldo = dadosFinanceiros.totalReceita - dadosFinanceiros.totalDespesa;

    return (
        <div style={containerStyle}>
            <h1 style={titleStyle}>Fluxo de Caixa da Academia</h1>
            
            <div style={cardContainerStyle}>
                <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>Receita Total</h3>
                    <p style={{ ...cardValueStyle, color: '#28a745' }}>R$ {dadosFinanceiros.totalReceita.toFixed(2)}</p>
                </div>
                <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>Despesa Total</h3>
                    <p style={{ ...cardValueStyle, color: '#dc3545' }}>R$ {dadosFinanceiros.totalDespesa.toFixed(2)}</p>
                </div>
                <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>Saldo Atual</h3>
                    <p style={{ ...cardValueStyle, color: saldo >= 0 ? '#28a745' : '#dc3545' }}>R$ {saldo.toFixed(2)}</p>
                </div>
            </div>

            <hr style={dividerStyle} />

            <div style={sectionContainerStyle}>
                <h2 style={sectionTitleStyle}>Faturamento por Modalidade</h2>
                <ul style={listStyle}>
                    {Object.entries(dadosFinanceiros.receitaPorModalidade).map(([modalidade, valor]) => (
                        <li key={modalidade} style={listItemStyle}>
                            <span style={modalidadeNameStyle}>{modalidade.toUpperCase()}</span>
                            <span style={listItemValueStyle}>R$ {valor.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <hr style={dividerStyle} />

            <div style={sectionContainerStyle}>
                <h2 style={sectionTitleStyle}>Despesas</h2>
                <ul style={listStyle}>
                    {dadosFinanceiros.despesas.map((despesa, index) => (
                        <li key={index} style={listItemStyle}>
                            <span style={modalidadeNameStyle}>{despesa.item}</span>
                            <span style={{ ...listItemValueStyle, color: '#dc3545' }}>- R$ {despesa.valor.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={() => navigate('/dashboard')} style={backButtonStyle}>
                Voltar para o Dashboard
            </button>

        </div>
    );
}

// Estilos
const containerStyle = {
    padding: '20px',
    maxWidth: '600px',
    margin: 'auto',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    backgroundColor: '#1a1a1a',
    color: 'white',
    borderRadius: '15px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
    minHeight: '100vh',
};
const titleStyle = {
    color: '#FFD700',
    textShadow: '0 0 10px #FFD700',
    marginBottom: '30px',
};
const cardContainerStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '20px',
};
const cardStyle = {
    backgroundColor: '#282828',
    padding: '20px',
    borderRadius: '10px',
    width: '150px',
};
const cardTitleStyle = {
    color: 'white',
    fontSize: '1em',
    marginBottom: '5px',
};
const cardValueStyle = {
    fontSize: '1.5em',
    fontWeight: 'bold',
};
const dividerStyle = {
    borderTop: '1px solid #FFD700',
    margin: '30px 0',
};
const sectionContainerStyle = {
    marginBottom: '30px',
    backgroundColor: '#282828',
    padding: '20px',
    borderRadius: '10px',
};
const sectionTitleStyle = {
    color: '#FFD700',
    fontSize: '1.2em',
    marginBottom: '15px',
};
const listStyle = {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
};
const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #444',
};
const modalidadeNameStyle = {
    fontWeight: 'bold',
    color: '#eee',
};
const listItemValueStyle = {
    color: 'white',
    fontWeight: 'bold',
};
const backButtonStyle = {
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
};

export default FluxoDaAcademia;