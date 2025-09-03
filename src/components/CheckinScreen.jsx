import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import bonsaiLogo from '../assets/bonsai_logo.png';

const SECURITY_PASSWORD = 'somosem5';

const messages = {
    pt: {
        placeholder: "Digite seu ID",
        checkinError: "ID incorreto.",
        invalidIdLength: "O ID deve ter 4 dígitos.",
        checkinMessage: (name) => `Olá, ${name}! Seu check-in foi realizado com sucesso.`,
        goodTraining: "Bons treinos!",
        prompt: "Por favor, digite a senha de segurança para sair:",
        logoutSuccess: "Logout realizado com sucesso!",
        logoutError: "Senha incorreta. Acesso negado."
    },
    ja: {
        placeholder: "IDを入力してください",
        checkinError: "正しいIDを入力してください。",
        invalidIdLength: "IDは4桁でなければなりません。",
        checkinMessage: (name) => `ようこそ、${name}さん! チェックインが完了しました。`,
        goodTraining: "良い稽古を！",
        prompt: "終了するためにセキュリティパスワードを入力してください:",
        logoutSuccess: "ログアウトしました",
        logoutError: "パスワードが正しくありません。"
    }
};

function CheckinScreen() {
    const navigate = useNavigate();
    const [alunoId, setAlunoId] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkedInStudentName, setCheckedInStudentName] = useState('');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [shouldNavigate, setShouldNavigate] = useState(false);

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setCurrentDateTime(`${formattedDate} - ${formattedTime}`);
        };

        const timerId = setInterval(updateDateTime, 1000);
        updateDateTime();

        const handlePopstate = (event) => {
            window.history.pushState(null, document.title, window.location.href);
            openPasswordModal();
        };

        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', handlePopstate);

        return () => {
            clearInterval(timerId);
            window.removeEventListener('popstate', handlePopstate);
        };
    }, []);

    useEffect(() => {
        if (shouldNavigate) {
            navigate('/dashboard');
            setShouldNavigate(false);
        }
    }, [shouldNavigate, navigate]);

    const handleNumberClick = (number) => {
        if (alunoId.length < 4) {
            setAlunoId(alunoId + number);
        }
    };

    const handleDelete = () => {
        setAlunoId(alunoId.slice(0, -1));
    };

    const handleCheckin = async () => {
        setFeedback('');

        if (alunoId.length !== 4) {
            setFeedback(`${messages.pt.invalidIdLength} / ${messages.ja.invalidIdLength}`);
            return;
        }

        try {
            const alunosRef = collection(db, 'alunos');
            let querySnapshot;

            querySnapshot = await getDocs(query(alunosRef, where('aluno_id', '==', alunoId)));

            if (querySnapshot.empty) {
                const idNumber = parseInt(alunoId);
                querySnapshot = await getDocs(query(alunosRef, where('aluno_id', '==', idNumber)));
            }
            
            if (querySnapshot.empty) {
                setFeedback(`${messages.pt.checkinError} / ${messages.ja.checkinError}`);
                return;
            }

            const alunoData = querySnapshot.docs[0].data();

            await addDoc(collection(db, 'presencas'), {
                aluno_id: alunoData.aluno_id,
                nome: alunoData.nome,
                data_presenca: serverTimestamp(),
            });

            setCheckedInStudentName(alunoData.nome);
            setIsModalOpen(true);

            setTimeout(() => {
                closeModal();
            }, 3000);

            setAlunoId('');
        } catch (error) {
            console.error('Erro no check-in:', error);
            setFeedback('Ocorreu um erro no check-in. Tente novamente.');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCheckedInStudentName('');
    };

    const openPasswordModal = () => {
        setIsPasswordModalOpen(true);
        setPasswordInput('');
        setPasswordError('');
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === SECURITY_PASSWORD) {
            setIsPasswordModalOpen(false);
            setShouldNavigate(true);
        } else {
            setPasswordError('Senha incorreta.');
        }
    };

    const handlePasswordCancel = () => {
        setIsPasswordModalOpen(false);
        setPasswordInput('');
        setPasswordError('');
    };

    return (
        <div style={containerStyle}>
            <button onClick={openPasswordModal} style={logoutButtonStyle}>X</button>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h2 style={titleStyle}>BONSAI JIU JITSU ACADEMY<br />ボンサイ柔術アカデミー</h2>
            
            <h3 style={checkinTitleStyle}>Check-in</h3>

            <div style={clockContainerStyle}>
                <p style={clockStyle}>{currentDateTime}</p>
            </div>

            <input
                type="text"
                placeholder={`${messages.pt.placeholder} / ${messages.ja.placeholder}`}
                value={alunoId}
                readOnly
                style={inputStyle}
            />

            <div style={keypadContainerStyle}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => handleNumberClick(num.toString())} style={numberButtonStyle}>
                        {num}
                    </button>
                ))}

                <button onClick={handleDelete} style={deleteButtonStyle}>⌫</button>
                <button onClick={() => handleNumberClick('0')} style={numberButtonStyle}>0</button>
                <button onClick={handleCheckin} style={checkinButtonStyle}>✓</button>
            </div>

            {feedback && <p style={feedbackStyle(false)}>{feedback}</p>}

            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={modalTitleStyle}>Check-in realizado!</h2>
                        <h1 style={modalNameStyle}>{checkedInStudentName}</h1>
                        <p style={modalMessageStyle}>
                            {messages.pt.checkinMessage(checkedInStudentName)}
                            <br /><br />
                            {messages.ja.checkinMessage(checkedInStudentName)}
                        </p>
                        <p style={modalTrainingMessageStyle}>
                            {messages.pt.goodTraining}
                            <br />
                            {messages.ja.goodTraining}
                        </p>
                        <button onClick={closeModal} style={modalCloseButtonStyle}>
                            OK
                        </button>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h4 style={modalTitleStyle}>Digite a senha</h4>
                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                style={inputStyle}
                                autoFocus
                            />
                            {passwordError && <p style={{ color: '#dc3545', fontSize: '0.9em' }}>{passwordError}</p>}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={{ ...modalButton, backgroundColor: '#28a745' }}>
                                    Confirmar
                                </button>
                                <button type="button" onClick={handlePasswordCancel} style={{ ...modalButton, backgroundColor: '#dc3545' }}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Estilos OTIMIZADOS
const containerStyle = {
    padding: '15px', maxWidth: '380px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif',
    border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', position: 'relative', color: 'white'
};

const logoutButtonStyle = {
    position: 'absolute', top: '5px', right: '5px', width: '25px', height: '25px',
    fontSize: '1em', backgroundColor: 'transparent', color: '#dc3545', border: 'none',
    borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold'
};

const logoStyle = { width: '150px', marginBottom: '5px' };
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700', margin: '0 0 10px', fontSize: '1.2em' };
const checkinTitleStyle = { color: 'white', marginBottom: '10px', fontSize: '2em', fontWeight: 'bold' };
const inputStyle = {
    width: '100%', padding: '12px', margin: '8px 0', textAlign: 'center', fontSize: '1.1em',
    border: '2px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: '#333', color: '#FFD700'
};
const keypadContainerStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '15px' };
const baseButtonStyle = { width: '70px', height: '70px', fontSize: '1.3em', border: 'none', borderRadius: '50%', cursor: 'pointer', transition: 'box-shadow 0.3s ease' };
const numberButtonStyle = { ...baseButtonStyle, backgroundColor: '#FFD700', color: '#333', boxShadow: '0 0 8px #FFD700' };
const deleteButtonStyle = { ...baseButtonStyle, backgroundColor: '#ccc', color: '#333', boxShadow: '0 0 8px #aaa' };
const checkinButtonStyle = { ...baseButtonStyle, backgroundColor: '#28a745', color: 'white', boxShadow: '0 0 10px #28a745' };

const clockContainerStyle = {
    backgroundColor: '#333',
    border: '1px solid #FFD700',
    borderRadius: '8px',
    padding: '8px',
    marginBottom: '8px',
};
const clockStyle = {
    color: '#FFD700',
    fontSize: '1.2em',
    fontWeight: 'bold',
    margin: 0,
    textShadow: '0 0 5px #FFD700',
};

const feedbackStyle = (isSuccess) => ({ marginTop: '15px', fontWeight: 'bold', color: isSuccess ? '#28a745' : '#dc3545' });

// Estilos da Modal
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '25px', borderRadius: '15px',
    width: '90%', maxWidth: '300px',
    textAlign: 'center',
    boxShadow: '0 0 30px #FFD700',
    border: '2px solid #FFD700',
    position: 'relative',
    animation: 'fadeIn 0.5s ease-out'
};

const modalTitleStyle = { color: '#FFD700', fontSize: '1.2em', marginBottom: '10px' };
const modalNameStyle = { color: 'white', fontSize: '1.8em', margin: '0 0 15px', textShadow: '0 0 10px #FFD700' };
const modalMessageStyle = { color: 'white', fontSize: '1em', lineHeight: '1.3', marginBottom: '15px' };
const modalTrainingMessageStyle = { color: '#FFD700', fontSize: '1.1em', fontWeight: 'bold' };
const modalCloseButtonStyle = {
    marginTop: '15px', padding: '10px 30px', backgroundColor: '#28a745', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1em'
};

const modalButton = {
    padding: '10px 15px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9em',
    flex: '1',
};

export default CheckinScreen;