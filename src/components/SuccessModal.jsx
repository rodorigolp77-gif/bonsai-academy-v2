import React from 'react';
import { FaPrint, FaPlus, FaTimes } from 'react-icons/fa';
import './SuccessModal.css';

function SuccessModal({ paymentData, onPrint, onNewPayment, onClose }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content success-modal">
                <button onClick={onClose} className="modal-close-button"><FaTimes /></button>
                
                <div className="success-icon">
                    <span>&#10004;</span>
                </div>
                
                <h2>Pagamento Registrado com Sucesso!</h2>
                
                <div className="payment-summary">
                    <p><strong>Aluno:</strong> {paymentData.nome_aluno}</p>
                    <p><strong>Valor Total:</strong> <span>¥{paymentData.valor_total.toLocaleString('ja-JP')}</span></p>
                </div>

                <div className="success-actions">
                    <button onClick={onPrint} className="btn-action btn-print">
                        <FaPrint /> Imprimir Recibo
                    </button>
                    <button onClick={onNewPayment} className="btn-action btn-new-payment">
                        <FaPlus /> Lançar Outro Pagamento
                    </button>
                    <button onClick={onClose} className="btn-action btn-close">
                        Sair
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SuccessModal;