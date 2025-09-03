// src/components/StudentRegistrationScreen.jsx
import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore'; 
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const messages = {
    pt: {
        title: "Cadastro de Aluno",
        name_label: "Nome:",
        id_label: "ID do Aluno (4 dígitos):",
        modality_label: "Modalidade:",
        due_date_label: "Dia de Vencimento:",
        register_button: "Cadastrar Aluno",
        success: "Aluno cadastrado com sucesso!",
        error: "Erro ao cadastrar aluno.",
        invalid_id: "O ID deve ter 4 dígitos.",
        all_fields: "Por favor, preencha todos os campos.",
    }
};

function StudentRegistrationScreen() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [modality, setModality] = useState('');
    const [dueDate, setDueDate] = useState(''); // Guarda a data em formato de string (yyyy-mm-dd)
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        setLoading(true);
        setFeedback('');

        if (!name || !id || !modality || !dueDate) {
            setFeedback(messages.pt.all_fields);
            setLoading(false);
            return;
        }

        if (id.length !== 4) {
            setFeedback(messages.pt.invalid_id);
            setLoading(false);
            return;
        }

        try {
            // >>> CONVERTE A DATA DO CAMPO DE INPUT PARA TIMESTAMP <<<
            const dueDateTimestamp = Timestamp.fromDate(new Date(dueDate));

            const alunoData = {
                nome: name,
                aluno_id: parseInt(id),
                modalidade: modality,
                // Salva a data no formato nativo do Firestore
                data_vencimento: dueDateTimestamp,
                data_criacao: Timestamp.now(),
            };

            await addDoc(collection(db, 'alunos'), alunoData);
            setFeedback(messages.pt.success);
            setName('');
            setId('');
            setModality('');
            setDueDate('');
            await new Promise(resolve => setTimeout(resolve, 2000));
            navigate('/dashboard');

        } catch (error) {
            console.error("Erro ao cadastrar aluno:", error);
            setFeedback(messages.pt.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <button onClick={() => navigate('/dashboard')} style={backButtonStyle}>← Voltar</button>
            <h2 style={titleStyle}>{messages.pt.title}</h2>
            <div style={formGroupStyle}>
                <label style={labelStyle}>{messages.pt.name_label}</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                />
            </div>
            <div style={formGroupStyle}>
                <label style={labelStyle}>{messages.pt.id_label}</label>
                <input
                    type="number"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    style={inputStyle}
                />
            </div>
            <div style={formGroupStyle}>
                <label style={labelStyle}>{messages.pt.modality_label}</label>
                <input
                    type="text"
                    value={modality}
                    onChange={(e) => setModality(e.target.value)}
                    style={inputStyle}
                />
            </div>
            <div style={formGroupStyle}>
                <label style={labelStyle}>{messages.pt.due_date_label}</label>
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={inputStyle}
                />
            </div>
            {feedback && <p style={feedbackStyle}>{feedback}</p>}
            <button
                onClick={handleRegister}
                style={registerButtonStyle}
                disabled={loading}
            >
                {loading ? 'Cadastrando...' : messages.pt.register_button}
            </button>
        </div>
    );
}

// Estilos (podem ser movidos para um arquivo CSS se preferir)
const containerStyle = {
    padding: '20px',
    maxWidth: '400px',
    margin: 'auto',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    color: 'white'
};
const backButtonStyle = {
    position: 'absolute', top: '10px', left: '10px', padding: '8px 12px',
    fontSize: '0.9em', backgroundColor: '#333', color: 'white',
    border: '1px solid #FFD700', borderRadius: '8px', cursor: 'pointer'
};
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700', marginBottom: '20px' };
const formGroupStyle = { marginBottom: '15px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '1em', textAlign: 'left' };
const inputStyle = {
    width: '100%', padding: '10px', fontSize: '1em', border: '1px solid #ccc',
    borderRadius: '5px', backgroundColor: '#333', color: '#FFD700', boxSizing: 'border-box'
};
const registerButtonStyle = {
    marginTop: '20px', padding: '12px 20px', fontSize: '1.2em', cursor: 'pointer',
    backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px'
};
const feedbackStyle = { marginTop: '20px', fontWeight: 'bold', color: '#dc3545' };

export default StudentRegistrationScreen;