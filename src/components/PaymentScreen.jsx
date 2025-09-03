import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore'; 
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';
import Receipt from './Receipt';
import ReactDOMServer from 'react-dom/server';

const messages = {
    pt: {
        title: "Registro de Pagamento",
        id_placeholder: "ID do aluno (4 dígitos)",
        amount_label: "Valor Pago (¥):",
        payment_date_label: "Data do Pagamento:",
        observations_label: "Valor pago referente à:", // Renomeado
        register_button: "Registrar Pagamento",
        search_button: "Buscar",
        search_error: "ID não encontrado. Tente novamente.",
        invalid_id: "O ID deve ter 4 dígitos.",
        loading: "Carregando...",
        unknown_error: "Ocorreu um erro. Tente novamente.",
        payment_success: (name) => `Pagamento de ${name} registrado com sucesso!`, // Mensagem adaptada
        receipt_print_button: "Imprimir Recibo",
        new_payment_button: "Fazer Novo Pagamento",
        overdue_message: (days) => `🚨 Atraso no Pagamento: ${days} dias 🚨`,
        on_time_message: "Pagamento em dia!",
        not_authenticated: "Você precisa estar logado para acessar esta página."
    }
};

function PaymentScreen() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [alunoId, setAlunoId] = useState('');
    const [alunoData, setAlunoData] = useState(null);
    const [diasAtraso, setDiasAtraso] = useState(null);
    const [valorPago, setValorPago] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [observacoes, setObservacoes] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPaymentRegistered, setIsPaymentRegistered] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setIsAuthenticated(true);
                if (id) {
                    fetchStudentData(id, true);
                } else {
                    setLoading(false);
                }
            } else {
                setIsAuthenticated(false);
                setLoading(false);
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [id, navigate]);

    const fetchStudentData = async (idToFetch, isDocId = false) => {
        setFeedback('');
        setAlunoData(null);
        setDiasAtraso(null);
        setLoading(true);

        try {
            let alunoDocSnap;
            let alunoDocRef;
            if (isDocId) {
                alunoDocRef = doc(db, 'alunos', idToFetch);
                alunoDocSnap = await getDoc(alunoDocRef);
            } else {
                const idNumber = parseInt(idToFetch);
                const alunosRef = collection(db, 'alunos');
                const q = query(alunosRef, where('aluno_id', '==', idNumber));
                const querySnapshot = await getDocs(q);
                alunoDocSnap = querySnapshot.empty ? null : querySnapshot.docs[0];
                if (alunoDocSnap) {
                    alunoDocRef = alunoDocSnap.ref;
                }
            }

            if (alunoDocSnap && alunoDocSnap.exists()) {
                const fetchedData = alunoDocSnap.data();
                setAlunoData({ ...fetchedData, docId: alunoDocRef.id });
                
                if (fetchedData.data_vencimento) {
                    const today = new Date();
                    const dueDate = fetchedData.data_vencimento.toDate();
                    
                    today.setHours(0, 0, 0, 0);
                    dueDate.setHours(0, 0, 0, 0);

                    const diffTime = today.getTime() - dueDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    setDiasAtraso(diffDays > 0 ? diffDays : 0);
                } else {
                    setDiasAtraso(0);
                }
            } else {
                setFeedback(messages.pt.search_error);
            }
        } catch (error) {
            console.error("Erro ao buscar aluno:", error);
            setFeedback(messages.pt.unknown_error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (alunoId.length !== 4) {
            setFeedback(messages.pt.invalid_id);
            return;
        }
        fetchStudentData(alunoId);
    };

    const handlePaymentRegistration = async () => {
        setLoading(true);
        setFeedback('');

        if (!alunoData || !valorPago) {
            setFeedback("Por favor, preencha o valor do pagamento.");
            setLoading(false);
            return;
        }

        try {
            const paymentTimestamp = Timestamp.fromDate(new Date(paymentDate));
            
            const pagamentoData = {
                aluno_id: alunoData.aluno_id,
                nome: alunoData.nome,
                valor_pago: parseFloat(valorPago),
                modalidade: alunoData.modalidade || 'Não especificada',
                observacoes: observacoes,
                data_pagamento: paymentTimestamp,
            };

            await addDoc(collection(db, 'pagamentos'), pagamentoData);
            
            const studentRef = doc(db, 'alunos', alunoData.docId);
            const today = new Date();
            let newDueDate = new Date();

            if (alunoData.data_vencimento && alunoData.data_vencimento.toDate() > today) {
                newDueDate = alunoData.data_vencimento.toDate();
            }

            newDueDate.setMonth(newDueDate.getMonth() + 1);

            await updateDoc(studentRef, {
                data_vencimento: Timestamp.fromDate(newDueDate),
                status: 'Ativo'
            });

            setReceiptData({
                ...pagamentoData,
                data_pagamento: new Date(paymentDate),
            });
            
            setIsPaymentRegistered(true);
            setFeedback(messages.pt.payment_success(alunoData.nome));

        } catch (error) {
            console.error("Erro ao registrar pagamento:", error);
            setFeedback(`Erro ao registrar pagamento: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!receiptData) return;
        const receiptHtml = ReactDOMServer.renderToString(<Receipt data={receiptData} />);
        
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Recibo de Pagamento</title>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } }</style>');
        printWindow.document.write('</head><body style="padding: 20px;">');
        printWindow.document.write(receiptHtml);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500); 
    };

    const handleNewPayment = () => {
        setIsPaymentRegistered(false);
        setAlunoData(null);
        setAlunoId('');
        setValorPago('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setObservacoes('');
        setReceiptData(null);
        setFeedback('');
    };

    if (!isAuthenticated) {
        return <div style={{...containerStyle, textAlign: 'center', color: '#FFD700'}}>{messages.pt.not_authenticated}</div>; 
    }

    if (loading) {
        return <div style={{...containerStyle, textAlign: 'center', paddingTop: '50px', color: '#FFD700'}}>{messages.pt.loading}</div>;
    }

    return (
        <div style={containerStyle}>
            <button onClick={() => navigate('/dashboard')} style={backButtonStyle}>← Voltar</button>
            <h2 style={titleStyle}>{messages.pt.title}</h2>

            {isPaymentRegistered ? (
                <div style={successMessageStyle}>
                    <p style={{color: '#28a745', fontWeight: 'bold'}}>{feedback}</p>
                    <button onClick={handlePrintReceipt} style={printReceiptButtonStyle}>
                        {messages.pt.receipt_print_button}
                    </button>
                    <button onClick={handleNewPayment} style={newPaymentButtonStyle}>
                        {messages.pt.new_payment_button}
                    </button>
                </div>
            ) : (
                <>
                    {!alunoData && (
                        <div style={formGroupStyle}>
                            <input
                                type="number"
                                placeholder={messages.pt.id_placeholder}
                                value={alunoId}
                                onChange={(e) => setAlunoId(e.target.value)}
                                style={{...inputStyle, width: '60%'}}
                            />
                            <button onClick={handleSearch} style={searchButtonStyle}>
                                {messages.pt.search_button}
                            </button>
                        </div>
                    )}
                    
                    {feedback && <p style={feedbackStyle}>{feedback}</p>}

                    {alunoData && (
                        <div style={studentInfoStyle}>
                            <p style={studentNameStyle}>{alunoData.nome}</p>

                            {diasAtraso !== null && (
                                <div style={diasAtraso > 0 ? warningStyle : onTimeStyle}>
                                    <p>
                                        {diasAtraso > 0 
                                            ? messages.pt.overdue_message(diasAtraso)
                                            : messages.pt.on_time_message}
                                    </p>
                                </div>
                            )}

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>{messages.pt.payment_date_label}</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>{messages.pt.amount_label}</label>
                                <input
                                    type="number"
                                    step="1"
                                    value={valorPago}
                                    onChange={(e) => setValorPago(e.target.value)}
                                    placeholder="Ex: 5000"
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>{messages.pt.observations_label}</label>
                                <textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Adicione uma observação (ex: Mensalidade de Setembro)"
                                    style={textareaStyle}
                                    rows="3"
                                ></textarea>
                            </div>

                            <button
                                onClick={handlePaymentRegistration}
                                style={registerButtonStyle}
                                disabled={loading || !valorPago}
                            >
                                {loading ? messages.pt.loading : messages.pt.register_button}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Estilos
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

const inputStyle = {
    width: '100%',
    padding: '10px', fontSize: '1em',
    border: '1px solid #ccc', borderRadius: '5px',
    backgroundColor: '#333', color: '#FFD700', 
    boxSizing: 'border-box'
};

const textareaStyle = {
    width: '100%', padding: '10px', fontSize: '1em',
    border: '1px solid #ccc', borderRadius: '5px',
    backgroundColor: '#333', color: 'white',
    boxSizing: 'border-box'
};

const searchButtonStyle = {
    padding: '10px 15px', fontSize: '1em', cursor: 'pointer',
    backgroundColor: '#007bff', color: 'white',
    border: 'none', borderRadius: '5px'
};

const studentInfoStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '20px', borderRadius: '10px',
    marginTop: '20px'
};

const studentNameStyle = {
    fontSize: '1.5em', fontWeight: 'bold',
    color: '#FFD700'
};

const labelStyle = {
    display: 'block', marginBottom: '5px', fontSize: '1em', textAlign: 'left'
};

const selectStyle = {
    width: '100%',
    padding: '8px', fontSize: '1em',
    border: '1px solid #ccc', borderRadius: '5px',
    backgroundColor: '#333', color: 'white',
    boxSizing: 'border-box'
};

const registerButtonStyle = {
    marginTop: '20px', padding: '12px 20px',
    fontSize: '1.2em', cursor: 'pointer',
    backgroundColor: '#28a745', color: 'white',
    border: 'none', borderRadius: '8px'
};

const feedbackStyle = {
    marginTop: '20px', fontWeight: 'bold', color: '#dc3545'
};

const successMessageStyle = {
    marginTop: '50px',
};

const printReceiptButtonStyle = {
    padding: '12px 20px',
    fontSize: '1em',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    marginTop: '20px',
    marginRight: '10px'
};

const newPaymentButtonStyle = {
    padding: '12px 20px',
    fontSize: '1em',
    cursor: 'pointer',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    marginTop: '20px'
};

const warningStyle = { 
    backgroundColor: '#dc3545', padding: '10px', borderRadius: '8px', 
    margin: '15px 0', fontWeight: 'bold', color: 'white'
};

const onTimeStyle = {
    backgroundColor: '#28a745', padding: '10px', borderRadius: '8px', 
    margin: '15px 0', fontWeight: 'bold', color: 'white'
};

export default PaymentScreen;