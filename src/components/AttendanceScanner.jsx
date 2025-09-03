import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../firebaseConfig'; // Importa a configuração do Firestore
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'; // Importa as funções necessárias

// Estilos
const scannerStyle = {
    padding: '20px',
    maxWidth: '500px',
    margin: 'auto',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
    marginBottom: '10px',
    backgroundColor: '#333',
    color: '#FFD700',
    border: '1px solid #FFD700',
    borderRadius: '4px',
    boxShadow: '0 0 5px #FFD700',
};

const confirmButtonStyle = {
    width: '100%',
    padding: '15px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.2em',
    backgroundColor: '#28a745',
    boxShadow: '0 0 15px #28a745',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    marginBottom: '10px'
};

const qrButtonStyle = {
    width: '100%',
    padding: '15px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.2em',
    backgroundColor: '#007bff',
    boxShadow: '0 0 15px #007bff',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
};

function AttendanceScanner() {
    const [scannedId, setScannedId] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [manualId, setManualId] = useState('');
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        let scanner = null;
        if (isScanning) {
            const qrCodeId = "qr-code-reader";
            scanner = new Html5QrcodeScanner(
                qrCodeId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            const onScanSuccess = (decodedText) => {
                console.log(`QR Code lido: ${decodedText}`);
                setScannedId(decodedText);
                setManualId(decodedText);
                setIsScanning(false);
                handleCheckin(decodedText);
            };

            const onScanFailure = (error) => {
                // console.warn(`Falha na leitura: ${error}`);
            };

            scanner.render(onScanSuccess, onScanFailure);
        }
        
        return () => {
            if (scanner) {
                scanner.clear().catch(error => console.error("Falha ao parar o scanner.", error));
            }
        };
    }, [isScanning]);

    const handleCheckin = async (id) => {
        setStatusMessage({ text: 'Processando check-in...', type: 'info' });

        try {
            const alunosRef = collection(db, 'alunos');
            const q = query(alunosRef, where('aluno_id', '==', parseInt(id)));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setStatusMessage({ text: 'Aluno não encontrado.', type: 'error' });
                return;
            }

            const alunoDoc = querySnapshot.docs[0];
            const alunoData = alunoDoc.data();
            const { nome, status, data_vencimento } = alunoData;

            const vencimentoDate = data_vencimento ? data_vencimento.toDate() : null;
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const estaEmDia = status === 'ativo' && (!vencimentoDate || vencimentoDate >= hoje);
            
            if (!estaEmDia) {
                setStatusMessage({
                    text: `Atenção, ${nome}! Mensalidade atrasada. Status: ${status}. Vencimento: ${vencimentoDate ? vencimentoDate.toLocaleDateString('pt-BR') : 'Não Definido'}.`,
                    type: 'warning'
                });
            }

            const presencaRef = collection(db, 'presenca');
            await addDoc(presencaRef, {
                alunoId: parseInt(id),
                alunoNome: nome,
                checkin_at: Timestamp.now(),
            });

            setStatusMessage({
                text: `Check-in de ${nome} registrado com sucesso!`,
                type: 'success'
            });
            console.log(`Check-in de ${nome} registrado com sucesso.`);

        } catch (error) {
            console.error("Erro ao registrar a presença:", error);
            setStatusMessage({
                text: `Erro ao processar o check-in. Tente novamente.`,
                type: 'error'
            });
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualId) {
            console.log(`ID digitado: ${manualId}`);
            setScannedId('');
            handleCheckin(manualId);
        } else {
            alert("Por favor, digite um ID.");
        }
    };

    const getMessageStyle = () => {
        switch (statusMessage.type) {
            case 'success':
                return { color: '#28a745', fontSize: '1.2em', fontWeight: 'bold' };
            case 'warning':
                return { color: '#ffc107', fontSize: '1.2em', fontWeight: 'bold' };
            case 'error':
                return { color: '#dc3545', fontSize: '1.2em', fontWeight: 'bold' };
            case 'info':
            default:
                return { color: '#17a2b8', fontSize: '1.2em', fontWeight: 'bold' };
        }
    };

    return (
        <div style={scannerStyle}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>Controle de Presença</h3>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ color: 'white', marginBottom: '-5px' }}>Digite o ID do Aluno:</p>
                <form onSubmit={handleManualSubmit} style={{ width: '100%' }}>
                    <input
                        type="number"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="ID do Aluno"
                        style={inputStyle}
                        required
                    />
                    <button type="submit" style={confirmButtonStyle}>
                        Confirmar ID
                    </button>
                </form>
                <p style={{ color: 'white' }}>-- OU --</p>
                
                {!isScanning ? (
                    <button onClick={() => setIsScanning(true)} style={qrButtonStyle}>
                        Ler com QR Code
                    </button>
                ) : (
                    <button onClick={() => setIsScanning(false)} style={{ ...qrButtonStyle, backgroundColor: '#dc3545' }}>
                        Parar Câmera
                    </button>
                )}
            </div>

            {isScanning && (
                <div style={{ marginTop: '20px' }}>
                    <p style={{ color: '#FFD700' }}>Aponte a câmera para o QR Code...</p>
                    <div id="qr-code-reader" style={{ width: '100%' }}></div>
                </div>
            )}

            {statusMessage.text && (
                <div style={{ marginTop: '20px' }}>
                    <p style={getMessageStyle()}>{statusMessage.text}</p>
                </div>
            )}
        </div>
    );
}

export default AttendanceScanner;