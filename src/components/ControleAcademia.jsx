import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // USE ESTA LINHA (note o `../../`)

import bonsaiLogo from '../assets/bonsai_logo.png';

const SECURITY_PASSWORD = 'somosem5';

const modalidades = [
    'jiu-jitsu-kids', 'jiu-jitsu-feminino', 'jiu-jitsu-adulto',
    'capoeira', 'taekwondo', 'fitness'
];
const faixas = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'roxa', 'marrom', 'preta'];

const modalidadesMap = {
    'jiu-jitsu-kids': 'Jiu Jitsu Kids',
    'jiu-jitsu-feminino': 'Jiu Jitsu Feminino',
    'jiu-jitsu-adulto': 'Jiu Jitsu Adulto',
    'capoeira': 'Capoeira',
    'taekwondo': 'Taekwondo',
    'fitness': 'Fitness',
};

function ControleAcademia() {
    const navigate = useNavigate();
    const [showModalidades, setShowModalidades] = useState(false);
    const [showFaixas, setShowFaixas] = useState(false);
    const [counts, setCounts] = useState({ faixas: {}, modalidades: {}, total: 0, atrasados: 0 });
    const [loadingCounts, setLoadingCounts] = useState(true);

    // Estado para o acesso com senha
    const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (!isPasswordCorrect) return;

        const fetchCounts = async () => {
            setLoadingCounts(true);
            try {
                const alunosRef = collection(db, 'alunos');
                const totalQuerySnapshot = await getDocs(alunosRef);
                const alunosList = totalQuerySnapshot.docs.map(doc => doc.data());

                const now = Timestamp.fromDate(new Date());
                const atrasadosQuery = query(alunosRef, where('data_vencimento', '<', now));
                const atrasadosSnapshot = await getDocs(atrasadosQuery);
                const atrasadosCount = atrasadosSnapshot.size;

                const faixaCounts = {};
                faixas.forEach(faixa => {
                    faixaCounts[faixa] = alunosList.filter(aluno => aluno.faixa === faixa).length;
                });

                const modalidadeCounts = {};
                modalidades.forEach(mod => {
                    modalidadeCounts[mod] = alunosList.filter(aluno => aluno.modalidade && aluno.modalidade.includes(mod)).length;
                });

                setCounts({
                    faixas: faixaCounts,
                    modalidades: modalidadeCounts,
                    total: totalQuerySnapshot.size,
                    atrasados: atrasadosCount
                });
            } catch (error) {
                console.error("Erro ao buscar contagens:", error);
            } finally {
                setLoadingCounts(false);
            }
        };

        fetchCounts();
    }, [isPasswordCorrect]);

    const getCountDisplay = (count) => {
        if (loadingCounts) return '...';
        return `(${count})`;
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === SECURITY_PASSWORD) {
            setIsPasswordCorrect(true);
            setPasswordError('');
        } else {
            setPasswordError('Senha incorreta. Acesso negado.');
        }
    };
    
    // RENDERIZAÇÃO CONDICIONAL: Mostra a tela de senha ou o painel de controle
    if (!isPasswordCorrect) {
        return (
            <div style={passwordContainerStyle}>
                <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
                <h2 style={passwordTitleStyle}>Acesso Restrito</h2>
                <p style={{ color: 'white', marginBottom: '20px' }}>
                    Digite a senha para acessar o Painel de Controle.
                </p>
                <form onSubmit={handlePasswordSubmit} style={passwordFormStyle}>
                    <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Senha de segurança"
                        style={passwordInputStyle}
                        autoFocus
                    />
                    {passwordError && <p style={{ color: '#dc3545', fontSize: '0.9em', marginTop: '10px' }}>{passwordError}</p>}
                    <button type="submit" style={passwordSubmitButtonStyle}>
                        Confirmar
                    </button>
                    <button type="button" onClick={() => navigate('/dashboard')} style={passwordCancelButtonStyle}>
                        Voltar
                    </button>
                </form>
            </div>
        );
    }

    // Se a senha estiver correta, renderiza o painel de controle
    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h2 style={titleStyle}>Controle da Academia</h2>
            <p style={subtitleStyle}>Selecione uma opção:</p>

            <div style={sectionContainerStyle}>
                <h3 style={sectionTitleStyle}>Lista de Alunos</h3>
                <div style={buttonContainerStyle}>
                    <button onClick={() => navigate('/lista-alunos')} style={buttonStyle}>
                        Todos os Alunos {getCountDisplay(counts.total)}
                    </button>
                    <button onClick={() => navigate('/lista-alunos/status/atrasado')} style={{...buttonStyle, backgroundColor: '#dc3545'}}>
                        Pagamentos Atrasados {getCountDisplay(counts.atrasados)}
                    </button>
                    <button onClick={() => setShowFaixas(!showFaixas)} style={buttonStyle}>
                        Faixas
                    </button>
                    {showFaixas && (
                        <div style={subButtonContainerStyle}>
                            {faixas.map(faixa => (
                                <button
                                    key={faixa}
                                    onClick={() => navigate(`/lista-alunos/faixa/${faixa}`)}
                                    style={subButtonStyle}
                                >
                                    {faixa.charAt(0).toUpperCase() + faixa.slice(1)} {getCountDisplay(counts.faixas[faixa] || 0)}
                                </button>
                            ))}
                        </div>
                    )}
                    <button onClick={() => setShowModalidades(!showModalidades)} style={buttonStyle}>
                        Modalidades
                    </button>
                    {showModalidades && (
                        <div style={subButtonContainerStyle}>
                            {modalidades.map(modalidade => (
                                <button
                                    key={modalidade}
                                    onClick={() => navigate(`/lista-alunos/modalidade/${modalidade}`)}
                                    style={subButtonStyle}
                                >
                                    {modalidadesMap[modalidade]} {getCountDisplay(counts.modalidades[modalidade] || 0)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <hr style={dividerStyle} />

            <div style={sectionContainerStyle}>
                <h3 style={sectionTitleStyle}>Fluxo de Caixa</h3>
                <div style={buttonContainerStyle}>
                    <button onClick={() => navigate('/fluxo-de-caixa')} style={{...buttonStyle, backgroundColor: '#28a745'}}>Ver Fluxo de Caixa</button>
                </div>
            </div>

            <button onClick={() => navigate('/dashboard')} style={backButtonStyle}>Voltar para o Painel</button>
        </div>
    );
}

// Estilos
const containerStyle = {
    padding: '20px', maxWidth: '600px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif',
    border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', position: 'relative', color: 'white'
};
const logoStyle = { width: '150px', marginBottom: '10px' };
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700' };
const subtitleStyle = { color: 'white' };
const sectionContainerStyle = {
    marginBottom: '30px', padding: '20px', border: '1px solid #ddd',
    borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.05)'
};
const sectionTitleStyle = { color: '#FFD700', fontSize: '1.5em', marginBottom: '15px' };
const buttonContainerStyle = {
    display: 'flex', flexDirection: 'column', gap: '15px'
};
const subButtonContainerStyle = {
    display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px'
};
const buttonStyle = {
    padding: '15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none',
    borderRadius: '8px', fontWeight: 'bold', transition: 'background-color 0.2s',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', cursor: 'pointer'
};
const subButtonStyle = {
    padding: '10px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
};
const dividerStyle = { borderTop: '1px solid #FFD700', margin: '20px 0' };
const backButtonStyle = {
    padding: '15px', backgroundColor: '#dc3545', color: 'white', border: 'none',
    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

// Estilos para a tela de senha
const passwordContainerStyle = {
    ...containerStyle,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    padding: '40px'
};
const passwordTitleStyle = { ...titleStyle, fontSize: '2em' };
const passwordFormStyle = {
    display: 'flex', flexDirection: 'column', gap: '15px', width: '100%'
};
const passwordInputStyle = {
    padding: '15px', borderRadius: '8px', border: '1px solid #ccc', textAlign: 'center', fontSize: '1.2em'
};
const passwordSubmitButtonStyle = {
    padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontSize: '1.1em', fontWeight: 'bold'
};
const passwordCancelButtonStyle = {
    padding: '15px', backgroundColor: '#dc3545', color: 'white', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontSize: '1.1em', fontWeight: 'bold'
};

export default ControleAcademia;