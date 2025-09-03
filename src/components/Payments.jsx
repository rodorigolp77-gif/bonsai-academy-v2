import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Payments() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div>
            <h2>Tela de Pagamento</h2>
            <p>Carregando informações de pagamento para o aluno com ID: {id}</p>
            <button onClick={() => navigate('/dashboard')}>Voltar para o Dashboard</button>
        </div>
    );
}

export default Payments;