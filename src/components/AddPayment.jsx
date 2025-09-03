// src/components/AddPayment.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import bonsaiLogo from '../assets/bonsai_logo.png';

const containerStyle = {
    padding: '20px',
    maxWidth: '600px',
    margin: 'auto',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
};

const titleStyle = {
    color: '#FFD700',
    textShadow: '0 0 10px #FFD700',
    marginBottom: '20px',
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    textAlign: 'left',
};

const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
};

const labelStyle = {
    marginBottom: '5px',
    color: '#FFD700',
};

const inputStyle = {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #FFD700',
    backgroundColor: '#333',
    color: '#FFD700',
    boxShadow: '0 0 5px #FFD700',
};

const buttonStyle = {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    marginTop: '20px',
    boxShadow: '0 0 15px #28a745',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
};

const messageStyle = {
    marginTop: '20px',
    fontWeight: 'bold',
};

function AddPayment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [aluno, setAluno] = useState(null);
    const [valorPago, setValorPago] = useState('');
    const [dataPagamento, setDataPagamento] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudent = async () => {
            if (!id) {
                setMessage("ID do aluno não fornecido.");
                setLoading(false);
                return;
            }
            try {
                const docRef = doc(db, 'alunos', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setAluno(docSnap.data());
                    setDataPagamento(new Date().toISOString().split('T')[0]);
                } else {
                    setMessage("Aluno não encontrado.");
                }
            } catch (error) {
                console.error("Erro ao buscar aluno:", error);
                setMessage("Erro ao carregar dados do aluno.");
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [id]);

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!valorPago || !dataPagamento) {
            setMessage("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const alunoData = aluno;
            await addDoc(collection(db, 'pagamentos'), {
                aluno_id: alunoData.aluno_id,
                aluno_nome: alunoData.nome,
                valor_pago: parseFloat(valorPago),
                data_pagamento: new Date(dataPagamento),
                data_registro: serverTimestamp(),
            });

            setMessage("Pagamento registrado com sucesso!");
            setValorPago('');
            setDataPagamento(new Date().toISOString().split('T')[0]);

        } catch (error) {
            console.error("Erro ao adicionar pagamento:", error);
            setMessage("Erro ao registrar pagamento. Tente novamente.");
        }
    };

    if (loading) {
        return <div style={containerStyle}>Carregando...</div>;
    }

    if (!aluno) {
        return <div style={containerStyle}>{message}</div>;
    }

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ ...buttonStyle, width: 'auto', backgroundColor: '#6c757d' }}>
                    &larr; Voltar
                </button>
                <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={{ width: '100px' }} />
                <div style={{ width: 'auto' }}></div>
            </div>
            
            <h2 style={titleStyle}>Registrar Pagamento</h2>
            <h3 style={{ color: 'white' }}>Aluno: {aluno.nome}</h3>
            <form onSubmit={handleAddPayment} style={formStyle}>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Valor Pago (Ienes):</label>
                    <input
                        type="number"
                        value={valorPago}
                        onChange={(e) => setValorPago(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Data do Pagamento:</label>
                    <input
                        type="date"
                        value={dataPagamento}
                        onChange={(e) => setDataPagamento(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>
                <button type="submit" style={buttonStyle}>
                    Registrar Pagamento
                </button>
            </form>
            {message && <p style={messageStyle}>{message}</p>}
        </div>
    );
}

export default AddPayment;