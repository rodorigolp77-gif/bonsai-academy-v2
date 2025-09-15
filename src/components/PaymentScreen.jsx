import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { doc, getDoc, collection, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { FaPrint } from 'react-icons/fa';
import bonsaiLogo from '../assets/logorecibo.png';

const PaymentScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [paymentType, setPaymentType] = useState('normal'); // Estado para tipo de pagamento
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccessData, setPaymentSuccessData] = useState(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                if (!id) throw new Error("ID do aluno não fornecido.");
                const docRef = doc(db, 'alunos', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setStudentData(data);
                    setPaymentAmount(data.mensalidade || '');
                    
                    const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' });
                    setPaymentNotes(`Mensalidade de ${currentMonthName}`);
                } else {
                    throw new Error("Dados do aluno não encontrados.");
                }
            } catch (err) {
                console.error("Erro ao buscar dados do aluno:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStudentData();
    }, [id]);

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        if (!paymentAmount || !paymentMethod) {
            alert('Por favor, preencha o valor e o método de pagamento.');
            setIsProcessing(false);
            return;
        }

        try {
            const paymentDate = Timestamp.now();
            const paymentData = {
                aluno_id: String(studentData.aluno_id),
                aluno_doc_id: studentData.id,
                nome: studentData.nome,
                valor_pago: parseFloat(paymentAmount),
                metodo: paymentMethod,
                observacoes: paymentNotes,
                data_pagamento: paymentDate,
                modalidade: studentData.modalidade?.join(', ') || 'N/A',
            };

            const newPaymentRef = await addDoc(collection(db, 'pagamentos'), paymentData);

            const studentDocRef = doc(db, 'alunos', id);
            
            // Lógica para atualizar status e data de vencimento
            const today = new Date();
            const dueDay = studentData.data_vencimento?.toDate().getDate() || 28;
            let nextDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
            if (today.getDate() >= dueDay) {
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            }
            
            const studentUpdateData = {
                status: 'ativo',
                data_vencimento: Timestamp.fromDate(nextDueDate),
            };

            // Se o pagamento for VIP, adiciona os campos de VIP
            if (paymentType === 'vip') {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30); // Adiciona 30 dias
                studentUpdateData.is_vip = true;
                studentUpdateData.vip_expires_at = Timestamp.fromDate(expiryDate);
            }
            
            await updateDoc(studentDocRef, studentUpdateData);
            
            setPaymentSuccessData({ ...paymentData, id: newPaymentRef.id });

        } catch (err) {
            console.error("Erro ao processar o pagamento:", err);
            setError("Ocorreu um erro ao processar o pagamento.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handlePrintReceipt = (data) => {
        if (!data) return;
        const ACADEMY_INFO = {
            name: "盆栽アカデミー",
            address: "〒520-3234 滋賀県湖南市中央1丁目44-1 2階",
            website: "https://bonsaijjshiga.com/"
        };
        const formatDateTime = (timestamp) => {
            if (!timestamp || !timestamp.toDate) return 'N/A';
            const dateObj = timestamp.toDate();
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return dateObj.toLocaleDateString('ja-JP', options);
        };
        const printContent = `
            <html><head><title>Recibo - ${data.nome}</title>
            <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; -webkit-print-color-adjust: exact; }
                .receipt-container { border: 2px solid #ccc; border-radius: 10px; padding: 20px; max-width: 400px; margin: 20px auto; background-color: #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.1); color: #333; }
                .header { text-align: center; margin-bottom: 10px; }
                .logo { width: 100px; margin-bottom: 10px; }
                .header h2 { margin: 0; color: #333; }
                .header p { margin: 5px 0 0 0; color: #555; font-size: 0.9em; }
                .divider { border: 0; border-top: 1px dashed #ccc; margin: 15px 0; }
                .section { margin-bottom: 20px; }
                .section-title { border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; }
                .info-line { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .label { font-weight: bold; }
                .value { text-align: right; }
                .observations-text { font-style: italic; color: #666; text-align: left; font-size: 0.9em; border: 1px solid #eee; padding: 10px; border-radius: 5px; white-space: pre-wrap; }
                .footer { text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; color: #555; font-size: 0.9em; }
                @media print { .receipt-container { margin: 0; border: none; box-shadow: none; max-width: 100%; } }
            </style></head><body><div class="receipt-container">
                <div class="header">
                    <img src="${bonsaiLogo}" alt="盆栽アカデミーロゴ" class="logo" />
                    <h2>${ACADEMY_INFO.name}</h2><p>${ACADEMY_INFO.address}</p>
                </div><hr class="divider" />
                <div class="section">
                    <h4 class="section-title">お支払い領収書 (Recibo de Pagamento)</h4>
                    <div class="info-line"><span class="label">生徒名 (Nome):</span><span class="value">${data.nome}</span></div>
                    <div class="info-line"><span class="label">ID:</span><span class="value">${data.aluno_id}</span></div>
                    <div class="info-line"><span class="label">コース (Curso):</span><span class="value">${data.modalidade || '指定なし'}</span></div>
                </div><div class="section">
                    <h4 class="section-title">お支払い詳細 (Detalhes do Pagamento)</h4>
                    <div class="info-line"><span class="label">お支払い日時 (Data):</span><span class="value">${formatDateTime(data.data_pagamento)}</span></div>
                    <div class="info-line"><span class="label">お支払い金額 (Valor):</span><span class="value">¥ ${data.valor_pago.toLocaleString('ja-JP')}</span></div>
                </div>
                ${data.observacoes ? `<div class="section"><h4 class="section-title">備考 (Observações)</h4><p class="observations-text">${data.observacoes}</p></div>` : ''}
                <div class="footer"><p style="margin: 0">${ACADEMY_INFO.website}</p><p style="margin: 0; color: #555">ありがとうございました！</p></div>
            </div></body></html>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handleNewPayment = () => {
        setPaymentAmount(studentData.mensalidade || '');
        const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' });
        setPaymentNotes(`Mensalidade de ${currentMonthName}`);
        setPaymentMethod('');
        setPaymentSuccessData(null);
    };

    if (loading) return <div style={styles.loading}>Carregando...</div>;
    if (error) return <div style={styles.error}>Erro: {error}</div>;
    if (!studentData) return <div style={styles.error}>Aluno não encontrado.</div>;
    
    const nextDueDateText = studentData.data_vencimento ? studentData.data_vencimento.toDate().toLocaleDateString('pt-BR') : 'N/A';

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Lançar Pagamento</h1>
                <p style={styles.studentName}>Aluno: {studentData.nome}</p>
            </div>

            {paymentSuccessData ? (
                <div style={styles.successContainer}>
                    <h2 style={styles.successTitle}>Pagamento Processado com Sucesso!</h2>
                    <p><strong>Valor:</strong> ¥{paymentSuccessData.valor_pago.toLocaleString('ja-JP')}</p>
                    <p><strong>Data:</strong> {paymentSuccessData.data_pagamento.toDate().toLocaleDateString('pt-BR')}</p>
                    
                    <div style={styles.successActions}>
                        <button onClick={() => handlePrintReceipt(paymentSuccessData)} style={styles.printButton}>
                            <FaPrint /> Imprimir Recibo
                        </button>
                        <button onClick={handleNewPayment} style={styles.newPaymentButton}>
                            Lançar Outro Pagamento
                        </button>
                        <button onClick={() => navigate(`/student-details/${id}`)} style={styles.backButton}>
                            Voltar para Detalhes
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleProcessPayment} style={styles.form}>
                    <div style={styles.infoBox}>
                        <p>Próximo Vencimento: <strong style={styles.strong}>{nextDueDateText}</strong></p>
                        <p>Valor da Mensalidade: <strong style={styles.strong}>¥{studentData.mensalidade?.toLocaleString('ja-JP') || 'N/A'}</strong></p>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Valor Pago (¥)</label>
                        <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required min="0" style={styles.input}/>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Método de Pagamento</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required style={styles.select}>
                            <option value="">Selecione...</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao">Cartão de Crédito/Débito</option>
                            <option value="pix">Transferência (Pix, etc.)</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Observações (Descrição do Pagamento)</label>
                        <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows="3" style={styles.textarea}/>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Tipo de Pagamento</label>
                        <div style={styles.radioGroup}>
                            <label style={styles.radioLabel}>
                                <input type="radio" value="normal" checked={paymentType === 'normal'} onChange={(e) => setPaymentType(e.target.value)} />
                                Mensalidade Normal
                            </label>
                            <label style={styles.radioLabel}>
                                <input type="radio" value="vip" checked={paymentType === 'vip'} onChange={(e) => setPaymentType(e.target.value)} />
                                Assinatura VIP (30 dias)
                            </label>
                        </div>
                    </div>

                    <div style={styles.buttonContainer}>
                        <button type="submit" disabled={isProcessing} style={styles.processButton}>
                            {isProcessing ? 'Processando...' : 'Processar Pagamento'}
                        </button>
                        <button type="button" onClick={() => navigate(-1)} style={{...styles.backButton, position: 'static', marginTop: '10px'}}>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

// Estilos
const styles = {
    container: { padding: '20px', maxWidth: '600px', margin: '20px auto', backgroundColor: '#f8f9fa', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', fontFamily: 'Arial, sans-serif' },
    loading: { textAlign: 'center', fontSize: '1.5em', color: '#333', marginTop: '50px' },
    error: { textAlign: 'center', fontSize: '1.5em', color: '#dc3545', marginTop: '50px' },
    header: { textAlign: 'center', marginBottom: '20px' },
    title: { color: '#333', fontSize: '1.8em', marginBottom: '5px' },
    studentName: { color: '#666', fontSize: '1.1em', marginTop: '0' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    infoBox: { backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '10px' },
    strong: { fontWeight: 'bold', color: '#000' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontWeight: 'bold', color: '#555' },
    input: { padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1rem' },
    select: { padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1rem' },
    textarea: { padding: '10px', border: '1px solid #ccc', borderRadius: '5px', resize: 'vertical', fontSize: '1rem' },
    radioGroup: { display: 'flex', gap: '20px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px' },
    radioLabel: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },
    buttonContainer: { marginTop: '10px', display: 'flex', flexDirection: 'column' },
    processButton: { width: '100%', padding: '12px', fontSize: '1.1em', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', transition: 'background-color 0.3s ease' },
    successContainer: { textAlign: 'center', padding: '20px' },
    successTitle: { color: '#28a745' },
    successActions: { marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' },
    baseButton: { padding: '12px', fontSize: '1em', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' },
    printButton: { backgroundColor: '#007bff', color: 'white' },
    newPaymentButton: { backgroundColor: '#ffc107', color: '#212529' },
    backButton: { backgroundColor: '#6c757d', color: 'white' }
};

styles.printButton = { ...styles.baseButton, ...styles.printButton };
styles.newPaymentButton = { ...styles.baseButton, ...styles.newPaymentButton };
styles.backButton = { ...styles.baseButton, ...styles.backButton };

export default PaymentScreen;