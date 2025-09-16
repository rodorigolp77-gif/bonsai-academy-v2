// src/components/CheckinScreen.jsx

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../firebaseConfig";
import { useNavigate } from 'react-router-dom';
import bonsaiLogo from '../assets/bonsai_logo.png';
import './CheckinScreen.css';

const SECURITY_PASSWORD = 'somosem5';

const messages = {
    pt: {
        placeholder: "ID",
        checkinError: "ID incorreto.",
        invalidIdLength: "O ID deve ter 4 dígitos.",
        checkinMessage: (name) => `Olá, ${name}! Seu check-in foi realizado com sucesso.`,
        goodTraining: "Bons treinos!",
        prompt: "Por favor, digite a senha de segurança para sair:",
        logoutSuccess: "Logout realizado com sucesso!",
        logoutError: "Senha incorreta. Acesso negado."
    },
    ja: {
        placeholder: "ID",
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

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setCurrentDateTime(`${formattedDate} - ${formattedTime}`);
        };
        const timerId = setInterval(updateDateTime, 1000);
        updateDateTime();
        return () => clearInterval(timerId);
    }, []);

    const handleNumberClick = (number) => {
        if (alunoId.length < 4) {
            setAlunoId(alunoId + number);
        }
    };

    const handleDelete = () => {
        setAlunoId(alunoId.slice(0, -1));
    };

    const handleClear = () => {
        setAlunoId('');
        setFeedback('');
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

            const idAsNumber = parseInt(alunoId, 10);
            querySnapshot = await getDocs(query(alunosRef, where('aluno_id', '==', idAsNumber)));

            if (querySnapshot.empty) {
                querySnapshot = await getDocs(query(alunosRef, where('aluno_id', '==', alunoId)));
            }

            if (querySnapshot.empty) {
                setFeedback(`${messages.pt.checkinError} / ${messages.ja.checkinError}`);
                setAlunoId('');
                return;
            }

            const alunoDoc = querySnapshot.docs[0];
            const alunoData = alunoDoc.data();

            await addDoc(collection(db, 'presencas'), {
                aluno_uid: alunoDoc.id,
                aluno_id: alunoData.aluno_id,
                nome: alunoData.nome,
                data_presenca: serverTimestamp(),
            });

            setCheckedInStudentName(alunoData.nome);
            setIsModalOpen(true);
            setTimeout(() => closeModal(), 3000);
            setAlunoId('');
        } catch (error) {
            console.error('Erro no check-in:', error);
            setFeedback('Ocorreu um erro no check-in. Tente novamente.');
            setAlunoId('');
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
            navigate('/dashboard');
        } else {
            setPasswordError('Senha incorreta.');
        }
    };

    const handlePasswordCancel = () => {
        setIsPasswordModalOpen(false);
    };

    return (
        <div className="checkin-container-neon">
            <img src={bonsaiLogo} alt="Bonsai Logo" className="bonsai-logo-checkin" />
            <div className="security-panel">
                <div className="security-screen">
                    <p className="screen-armed">SYSTEM ARMED</p>
                </div>
                <div className="keypad-grid-neon">
                    <button onClick={() => handleNumberClick('1')} className="keypad-button-neon">1</button>
                    <button onClick={() => handleNumberClick('2')} className="keypad-button-neon">2</button>
                    <button onClick={() => handleNumberClick('3')} className="keypad-button-neon">3</button>
                    <button onClick={() => handleNumberClick('4')} className="keypad-button-neon">4</button>
                    <button onClick={() => handleNumberClick('5')} className="keypad-button-neon">5</button>
                    <button onClick={() => handleNumberClick('6')} className="keypad-button-neon">6</button>
                    <button onClick={() => handleNumberClick('7')} className="keypad-button-neon">7</button>
                    <button onClick={() => handleNumberClick('8')} className="keypad-button-neon">8</button>
                    <button onClick={() => handleNumberClick('9')} className="keypad-button-neon">9</button>
                    <button onClick={handleDelete} className="keypad-button-neon fn">DEL</button>
                    <button onClick={() => handleNumberClick('0')} className="keypad-button-neon">0</button>
                    <button onClick={handleCheckin} className="keypad-button-neon fn">ENT</button>
                </div>
            </div>

            <div className="input-feedback-panel">
                <div className="date-time-display">{currentDateTime}</div>
                <input
                    type="password"
                    value={alunoId}
                    readOnly
                    placeholder={messages.pt.placeholder}
                    className="checkin-input-neon"
                />
                <div className="feedback-message-neon">{feedback}</div>
                <div className="actions-buttons-neon">
                    <button onClick={handleCheckin} className="action-button-neon green-neon">ENTER</button>
                    <button onClick={handleClear} className="action-button-neon red-neon">CLEAR</button>
                </div>
                <button onClick={openPasswordModal} className="admin-access-button">Acesso Admin</button>
            </div>

            {isModalOpen && (
                <div className="modal-overlay-neon">
                    <div className="modal-content-neon">
                        <h2 className="modal-title-neon">Check-in realizado!</h2>
                        <h1 className="modal-name-neon">{checkedInStudentName}</h1>
                        <p className="modal-message-neon">
                            {messages.pt.checkinMessage(checkedInStudentName)}<br/><br/>
                            {messages.ja.checkinMessage(checkedInStudentName)}
                        </p>
                        <p className="modal-training-message-neon">
                            {messages.pt.goodTraining}<br/>{messages.ja.goodTraining}
                        </p>
                        <button onClick={closeModal} className="modal-close-button-neon">OK</button>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="modal-overlay-neon">
                    <div className="modal-content-neon password-modal">
                        <h4 className="modal-title-neon">Digite a senha</h4>
                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="password-input-neon"
                                autoFocus
                            />
                            {passwordError && <p className="error-message-neon">{passwordError}</p>}
                            <div className="modal-buttons-neon">
                                <button type="submit" className="action-button-neon green-neon">Confirmar</button>
                                <button type="button" onClick={handlePasswordCancel} className="action-button-neon red-neon">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CheckinScreen;