import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Receipt from './Receipt';
import './ReceiptPage.css';

function ReceiptPage() {
    const [receiptData, setReceiptData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedData = localStorage.getItem('receiptData');
        if (storedData) {
            const data = JSON.parse(storedData);
            
            // CONVERSÃO 1: Converte o Timestamp de pagamento para um objeto Date.
            const paymentTimestamp = data.pagamento.data_pagamento;
            const convertedPaymentDate = paymentTimestamp && paymentTimestamp.seconds 
                ? new Date(paymentTimestamp.seconds * 1000)
                : null;
            data.pagamento.data_pagamento = convertedPaymentDate;

            // CONVERSÃO 2: Converte o Timestamp de expiração VIP para um objeto Date.
            // A verificação é crucial para garantir que a conversão só ocorra se a propriedade existir.
            if (data.aluno.is_vip && data.aluno.vip_expires_at) {
                const vipTimestamp = data.aluno.vip_expires_at;
                const convertedVipDate = vipTimestamp && vipTimestamp.seconds
                    ? new Date(vipTimestamp.seconds * 1000)
                    : null;
                data.aluno.vip_expires_at = convertedVipDate;
            }
            
            setReceiptData(data);
        } else {
            navigate('/dashboard');
        }
    }, [navigate]);

    if (!receiptData) {
        return <div>Não foi possível carregar os dados do recibo. Por favor, tente novamente.</div>;
    }
    
    return (
        <div className="receipt-page-container">
            <header className="receipt-actions-header">
                <button onClick={() => window.print()} className="btn-print">
                    Imprimir Recibo
                </button>
                <button onClick={() => navigate('/dashboard')} className="btn-back">
                    Voltar para o Painel
                </button>
            </header>
            
            <div className="receipt-content">
                <Receipt data={receiptData} />
            </div>
        </div>
    );
}

export default ReceiptPage;