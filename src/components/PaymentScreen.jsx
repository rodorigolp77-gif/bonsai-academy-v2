import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import './PaymentScreen.css';

const productOptions = [
    'Mensalidade', 'Kimono', 'Faixa', 'Patch', 'Legging', 'Rashguard', 
    'Boné', 'Protetor Bucal', 'Luvas', 'Caneleiras', 'Cotoveleiras', 'Outro'
];

function PaymentScreen() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // States do formulário
    const defaultMonth = new Date().toISOString().slice(0, 7);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const [referenceMonth, setReferenceMonth] = useState(defaultMonth);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [paymentType, setPaymentType] = useState('normal');

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!studentId) {
                setError("ID do aluno não encontrado."); setLoading(false); return;
            }
            try {
                const studentDocRef = doc(db, 'alunos', studentId);
                const studentDocSnap = await getDoc(studentDocRef);
                if (studentDocSnap.exists()) {
                    setStudent({ id: studentDocSnap.id, ...studentDocSnap.data() });
                } else { setError('Aluno não encontrado.'); }
            } catch (err) { setError('Ocorreu um erro ao carregar os dados.'); }
            finally { setLoading(false); }
        };
        fetchStudentData();
    }, [studentId]);

    useEffect(() => {
        const newTotal = items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0);
        setTotal(newTotal);
    }, [items]);

    const handleAddItemRow = () => setItems(prev => [...prev, { id: Date.now(), name: '', customName: '', qty: 1, price: '' }]);
    const handleRemoveItemRow = (id) => setItems(prev => prev.filter(item => item.id !== id));
    const handleItemChange = (id, field, value) => setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) { setError('Adicione pelo menos um item.'); return; }
        setLoading(true);
        try {
            const [year, month] = referenceMonth.split('-');
            const itemsToSave = items.map(item => ({
                nome: item.name === 'Outro' ? item.customName : item.name,
                quantidade: Number(item.qty),
                preco_unitario: Number(item.price)
            }));
            
            // 1. Cria o objeto de pagamento
            const paymentData = {
                aluno_uid: student.id,
                aluno_id: student.aluno_id,
                nome_aluno: student.nome,
                valor_total: total,
                itens: itemsToSave,
                mes_referencia: `${month}-${year}`,
                data_pagamento: Timestamp.fromDate(new Date(`${paymentDate}T12:00:00`)),
                metodo_pagamento: paymentType // Adiciona o método de pagamento aqui
            };
            
            // 2. Salva o pagamento no Firebase
            await addDoc(collection(db, 'pagamentos'), paymentData);

            // 3. Atualiza o perfil do aluno no Firebase
            const studentDocRef = doc(db, 'alunos', studentId);
            const today = new Date();
            const dueDay = student.dia_vencimento || 28;
            let nextDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
            if (today.getDate() >= dueDay) { nextDueDate.setMonth(nextDueDate.getMonth() + 1); }
            
            const studentUpdateData = {
                status: 'ativo',
                data_vencimento: Timestamp.fromDate(nextDueDate),
            };

            if (paymentType === 'vip') {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                studentUpdateData.is_vip = true;
                studentUpdateData.vip_expires_at = Timestamp.fromDate(expiryDate);
            }
            
            await updateDoc(studentDocRef, studentUpdateData);
            
            // 4. Cria o objeto COMPLETO para o recibo e salva no localStorage
            const receiptData = {
                aluno: student,
                pagamento: paymentData,
            };
            localStorage.setItem('receiptData', JSON.stringify(receiptData));

            // 5. Redireciona para a página de recibo
            navigate(`/receipt`);
        } catch (err) {
            console.error("Erro ao registrar pagamento:", err);
            setError('Falha ao registrar o pagamento.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-screen">Carregando...</div>;
    if (error) return <div className="error-screen">{error}</div>;

    return (
        <div className="payment-screen-container">
            <header className="payment-header">
                <h3>Registrar Pagamento para</h3>
                <h2>{student?.nome}</h2>
            </header>
            <form onSubmit={handleSubmit} className="payment-form">
                <div className="items-container">
                    <div className="items-header">
                        <span>Produto</span>
                        <span>Nome Específico (se "Outro")</span>
                        <span>Quantidade</span>
                        <span>Preço Unitário (¥)</span>
                        <span>Subtotal</span>
                        <span></span>
                    </div>
                    {items.map((item) => (
                        <div key={item.id} className="item-row">
                            <select value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} required>
                                <option value="">Selecione...</option>
                                {productOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <input type="text" placeholder="Nome do item" value={item.customName} onChange={e => handleItemChange(item.id, 'customName', e.target.value)} disabled={item.name !== 'Outro'} required={item.name === 'Outro'}/>
                            <input type="number" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', e.target.value)} min="1" required/>
                            <input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', e.target.value)} min="0" placeholder="Ex: 10000" required/>
                            <span className="subtotal">¥{((item.qty || 0) * (item.price || 0)).toLocaleString('ja-JP')}</span>
                            <button type="button" onClick={() => handleRemoveItemRow(item.id)} className="btn-remove-item" title="Remover Item"><FaTrashAlt /></button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddItemRow} className="btn-add-item"><FaPlus /> Adicionar Item</button>
                </div>
                <div className="form-grid-bottom">
                    <div className="form-group">
                        <label>Mês de Referência</label>
                        <input type="month" value={referenceMonth} onChange={e => setReferenceMonth(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Data do Pagamento</label>
                        <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Tipo de Pagamento</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input type="radio" value="normal" checked={paymentType === 'normal'} onChange={(e) => setPaymentType(e.target.value)} />
                                Normal
                            </label>
                            <label className="radio-label">
                                <input type="radio" value="vip" checked={paymentType === 'vip'} onChange={(e) => setPaymentType(e.target.value)} />
                                VIP (30 dias)
                            </label>
                        </div>
                    </div>
                </div>
                <div className="total-display">Total: <span>¥{total.toLocaleString('ja-JP')}</span></div>
                {error && <p className="error-message">{error}</p>}
                <div className="page-actions">
                    <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancelar</button>
                    <button type="submit" className="btn-save" disabled={loading}>{loading ? 'Salvando...' : 'Confirmar e Gerar Recibo'}</button>
                </div>
            </form>
        </div>
    );
}
export default PaymentScreen;