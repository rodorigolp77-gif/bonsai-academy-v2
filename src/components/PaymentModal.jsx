import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
// ADICIONADO: 'updateDoc' e 'doc' para atualizar o aluno
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore'; 
import { FaTimes, FaPlus, FaTrashAlt } from 'react-icons/fa';
import './PaymentModal.css';

const productOptions = [
    'Mensalidade', 'Kimono', 'Camiseta', 'Rashguard', 'Patch', 'Faixa', 
    'Graduação', 'Boné', 'Calça', 'Shorts', 'Legging', 'Protetor Bucal', 'Outro'
];

function PaymentModal({ student, onClose, onSuccess }) {
    const defaultMonth = new Date().toISOString().slice(0, 7);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const [referenceMonth, setReferenceMonth] = useState(defaultMonth);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // ADICIONADO: State para controlar o tipo de pagamento (Normal ou VIP)
    const [paymentType, setPaymentType] = useState('normal');

    useEffect(() => {
        const newTotal = items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0);
        setTotal(newTotal);
    }, [items]);

    const handleAddItemRow = () => setItems(prev => [...prev, { id: Date.now(), name: '', customName: '', qty: 1, price: '' }]);
    const handleRemoveItemRow = (id) => setItems(prev => prev.filter(item => item.id !== id));
    const handleItemChange = (id, field, value) => setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

    // ATUALIZADO: handleSubmit agora inclui a lógica VIP e de atualização do aluno
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) { setError('Adicione pelo menos um item.'); return; }
        setLoading(true);
        setError('');

        try {
            // 1. Cria o registro de pagamento (como antes)
            const [year, month] = referenceMonth.split('-');
            const itemsToSave = items.map(item => ({
                nome: item.name === 'Outro' ? item.customName : item.name,
                quantidade: Number(item.qty),
                preco_unitario: Number(item.price)
            }));
            const paymentData = {
                aluno_uid: student.id,
                aluno_id: student.aluno_id,
                nome_aluno: student.nome,
                valor_total: total,
                itens: itemsToSave,
                mes_referencia: `${month}-${year}`,
                data_pagamento: Timestamp.fromDate(new Date(`${paymentDate}T12:00:00`)),
            };
            const docRef = await addDoc(collection(db, 'pagamentos'), paymentData);

            // 2. ADICIONADO: Prepara a atualização do perfil do aluno
            const studentDocRef = doc(db, 'alunos', student.id);
            const today = new Date();
            const dueDay = student.dia_vencimento || 28; // Pega o dia de vencimento do aluno ou usa 28 como padrão
            let nextDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
            if (today.getDate() >= dueDay) {
                nextDueDate.setMonth(nextDueDate.getMonth() + 1); // Pula para o próximo mês se já passou o dia do vencimento
            }
            const studentUpdateData = {
                status: 'ativo',
                data_vencimento: Timestamp.fromDate(nextDueDate),
            };

            // 3. ADICIONADO: Lógica para o pagamento VIP
            if (paymentType === 'vip') {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30); // Adiciona 30 dias de acesso
                studentUpdateData.is_vip = true;
                studentUpdateData.vip_expires_at = Timestamp.fromDate(expiryDate);
            }
            
            // 4. ADICIONADO: Executa a atualização no perfil do aluno
            await updateDoc(studentDocRef, studentUpdateData);
            
            const paymentResult = { ...paymentData, id: docRef.id };
            onSuccess(paymentResult);

        } catch (err) {
            console.error("Erro ao registrar pagamento: ", err);
            setError('Falha ao registrar o pagamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content payment-modal">
                <button onClick={onClose} className="modal-close-button"><FaTimes /></button>
                <h3>Registrar Pagamento para</h3>
                <h2>{student.nome}</h2>
                <form onSubmit={handleSubmit} className="payment-form">
                    <div className="items-container">
                        {/* ... sua lista de itens continua a mesma ... */}
                        <div className="items-header">
                          <span>Item</span><span>Nome (se "Outro")</span><span>Qtd.</span><span>Preço Unit.</span><span>Subtotal</span><span></span>
                        </div>
                        {items.map((item) => (
                            <div key={item.id} className="item-row">
                                <select value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} required><option value="">Selecione...</option>{productOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                                <input type="text" placeholder="Nome do item" value={item.customName} onChange={e => handleItemChange(item.id, 'customName', e.target.value)} disabled={item.name !== 'Outro'} required={item.name === 'Outro'}/>
                                <input type="number" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', e.target.value)} min="1" required/>
                                <input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', e.target.value)} min="0" placeholder="¥" required/>
                                <span className="subtotal">¥{((item.qty || 0) * (item.price || 0)).toLocaleString('ja-JP')}</span>
                                <button type="button" onClick={() => handleRemoveItemRow(item.id)} className="btn-remove-item"><FaTrashAlt /></button>
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
                        {/* ADICIONADO: Campo para escolher o tipo de pagamento */}
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
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>{loading ? 'Salvando...' : 'Confirmar Pagamento'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PaymentModal;