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

    const handleCheckin = async () => {
        setFeedback('');
        if (alunoId.length !== 4) {
            setFeedback(`${messages.pt.invalidIdLength} / ${messages.ja.invalidIdLength}`);
            return;
        }

        try {
            const alunosRef = collection(db, 'alunos');
            let querySnapshot;

            // 1. Tenta buscar o ID como TEXTO (string)
            querySnapshot = await getDocs(query(alunosRef, where('aluno_id', '==', alunoId)));

            // 2. Se não encontrar, tenta buscar como NÚMERO
            if (querySnapshot.empty) {
                const idAsNumber = parseInt(alunoId, 10);
                querySnapshot = await getDocs(query(alunosRef, where('aluno_id', '==', idAsNumber)));
            }

            if (querySnapshot.empty) {
                setFeedback(`${messages.pt.checkinError} / ${messages.ja.checkinError}`);
                setAlunoId('');
                return;
            }

            const alunoData = querySnapshot.docs[0].data();
            await addDoc(collection(db, 'presencas'), {
                // CORREÇÃO CRÍTICA: Garantir que o ID seja salvo como texto (string)
                aluno_id: String(alunoData.aluno_id),
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
        <div className="checkin-background">
            <div className="vault-door">
                <div className="vault-hinge left"></div>
                <div className="vault-hinge right"></div>
                
                <div className="vault-center-panel">
                    <div className="vault-screen-frame">
                        <div className="vault-screen-top-light"></div>
                        <div className="vault-screen-content">
                            <div className="vault-screen-time">{currentDateTime}</div>
                            <input
                                type="password" 
                                value={alunoId}
                                readOnly
                                placeholder={messages.pt.placeholder}
                                className="vault-screen-input"
                            />
                            {feedback && <div className="vault-feedback-message">{feedback}</div>}
                        </div>
                    </div>

                    <div className="vault-keypad-grid">
                        <div className="keypad-row">
                            <button onClick={() => handleNumberClick('1')} className="keypad-button num">1</button>
                            <button onClick={() => handleNumberClick('2')} className="keypad-button num">2</button>
                            <button onClick={() => handleNumberClick('3')} className="keypad-button num">3</button>
                        </div>
                        <div className="keypad-row">
                            <button onClick={() => handleNumberClick('4')} className="keypad-button num">4</button>
                            <button onClick={() => handleNumberClick('5')} className="keypad-button num">5</button>
                            <button onClick={() => handleNumberClick('6')} className="keypad-button num">6</button>
                        </div>
                        <div className="keypad-row">
                            <button onClick={() => handleNumberClick('7')} className="keypad-button num">7</button>
                            <button onClick={() => handleNumberClick('8')} className="keypad-button num">8</button>
                            <button onClick={() => handleNumberClick('9')} className="keypad-button num">9</button>
                        </div>
                        <div className="keypad-row">
                            <button onClick={handleDelete} className="keypad-button fn red">X</button>
                            <button onClick={() => handleNumberClick('0')} className="keypad-button num">0</button>
                            <button onClick={handleCheckin} className="keypad-button fn green">+</button>
                        </div>
                        <div className="keypad-row full-width">
                            <button onClick={handleCheckin} className="keypad-button enter">ENTER</button>
                            <button onClick={handleDelete} className="keypad-button clear">CLEAR</button>
                        </div>
                    </div>
                </div>

                <div className="vault-handle left"></div>
                <div className="vault-handle right"></div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Check-in realizado!</h2>
                        <h1 className="modal-name">{checkedInStudentName}</h1>
                        <p className="modal-message">
                            {messages.pt.checkinMessage(checkedInStudentName)}<br/><br/>
                            {messages.ja.checkinMessage(checkedInStudentName)}
                        </p>
                        <p className="modal-training-message">
                            {messages.pt.goodTraining}<br/>{messages.ja.goodTraining}
                        </p>
                        <button onClick={closeModal} className="modal-close-button">OK</button>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4 className="modal-title">Digite a senha</h4>
                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="password-input"
                                autoFocus
                            />
                            {passwordError && <p style={{ color: '#dc3545', fontSize: '0.9em' }}>{passwordError}</p>}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="modal-confirm-button">Confirmar</button>
                                <button type="button" onClick={handlePasswordCancel} className="modal-cancel-button">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <button onClick={openPasswordModal} className="admin-access-button">Acesso Admin</button>
        </div>
    );
}

export default CheckinScreen;