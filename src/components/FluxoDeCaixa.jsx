import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from "../firebaseConfig";
import bonsaiLogo from '../assets/bonsai_logo.png';

function FluxoDeCaixa() {
    const navigate = useNavigate();
    const [transacoes, setTransacoes] = useState([]);
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [tipo, setTipo] = useState('saida');
    const [isFixa, setIsFixa] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
    const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

    const fetchTransacoes = async () => {
        try {
            const pagamentosRef = collection(db, 'pagamentos');
            const pagamentosQuery = query(pagamentosRef, orderBy('data_pagamento', 'desc'));
            const pagamentosSnapshot = await getDocs(pagamentosQuery);
            
            const pagamentosList = pagamentosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                tipo: 'entrada',
                data: doc.data().data_pagamento,
                descricao: `Pagamento de ${doc.data().nome} - ${doc.data().observacoes || 'Mensalidade'}`,
                valor: doc.data().valor_pago,
            }));

            const fluxoCaixaRef = collection(db, 'fluxo_de_caixa');
            const fluxoCaixaQuery = query(fluxoCaixaRef, orderBy('data', 'desc'));
            const fluxoCaixaSnapshot = await getDocs(fluxoCaixaQuery);
            const fluxoCaixaList = fluxoCaixaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const todasTransacoes = [...pagamentosList, ...fluxoCaixaList];
            todasTransacoes.sort((a, b) => b.data.toDate() - a.data.toDate());
            
            setTransacoes(todasTransacoes);

        } catch (error) {
            console.error("Erro ao buscar transações:", error);
        }
    };

    useEffect(() => {
        fetchTransacoes();
    }, []);

    const handleSubmitTransaction = async (e) => {
        e.preventDefault();
        try {
            const transactionData = {
                descricao,
                valor: parseFloat(valor),
                tipo,
                isFixa: tipo === 'saida' ? isFixa : false,
            };

            if (editingTransaction) {
                const docRef = doc(db, 'fluxo_de_caixa', editingTransaction.id);
                await updateDoc(docRef, transactionData);
                alert('Transação alterada com sucesso!');
            } else {
                await addDoc(collection(db, 'fluxo_de_caixa'), {
                    ...transactionData,
                    data: Timestamp.now(),
                });
                alert('Transação adicionada com sucesso!');
            }
            
            await fetchTransacoes();
            resetForm();
        } catch (error) {
            console.error("Erro ao salvar transação:", error);
            alert('Erro ao salvar transação. Verifique o console para mais detalhes.');
        }
    };
    
    const handleEditTransaction = (transaction) => {
        if (transaction.nome) {
            alert("Pagamentos de alunos não podem ser editados aqui. Altere no perfil do aluno.");
            return;
        }
        setEditingTransaction(transaction);
        setDescricao(transaction.descricao);
        setValor(transaction.valor.toString());
        setTipo(transaction.tipo);
        setIsFixa(transaction.isFixa || false);
    };

    const resetForm = () => {
        setEditingTransaction(null);
        setDescricao('');
        setValor('');
        setTipo('saida');
        setIsFixa(false);
    };
    
    const handleDeleteTransacao = async (id, isPayment) => {
        if (isPayment) {
            alert("Pagamentos de alunos não podem ser excluídos do fluxo de caixa. Para estornar, adicione uma transação de saída manualmente.");
            return;
        }

        if (window.confirm("Tem certeza que deseja excluir esta transação manual?")) {
            try {
                await deleteDoc(doc(db, 'fluxo_de_caixa', id));
                await fetchTransacoes();
                resetForm();
            } catch (error) {
                console.error("Erro ao deletar transação:", error);
            }
        }
    };

    const transacoesFiltradas = transacoes.filter(t => {
        const dataTransacao = t.data.toDate();
        return dataTransacao.getMonth() === mesSelecionado && dataTransacao.getFullYear() === anoSelecionado;
    });

    const entradas = transacoesFiltradas.filter(t => t.tipo === 'entrada');
    const saidas = transacoesFiltradas.filter(t => t.tipo === 'saida');

    const totalEntradas = entradas.reduce((acc, t) => acc + (t.valor || 0), 0);
    const totalSaidas = saidas.reduce((acc, t) => acc + (t.valor || 0), 0);
    const saldo = totalEntradas - totalSaidas;
    
    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return '¥ 0';
        }
        return `¥ ${value.toLocaleString('ja-JP')}`;
    };

    const formatDate = (timestamp) => timestamp ? timestamp.toDate().toLocaleDateString('pt-BR') : 'N/A';

    const meses = Array.from({length: 12}, (_, i) => new Date(0, i).toLocaleString('pt-BR', { month: 'long' }));
    const anos = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h2 style={titleStyle}>Fluxo de Caixa</h2>
            
            <div style={resumoStyle}>
                <p style={{...resumoItemStyle, color: 'green'}}>Total de Entradas: {formatCurrency(totalEntradas)}</p>
                <p style={{...resumoItemStyle, color: 'red'}}>Total de Saídas: {formatCurrency(totalSaidas)}</p>
                <p style={{...resumoItemStyle, fontWeight: 'bold', color: saldo >= 0 ? 'green' : 'red'}}>Saldo do Mês: {formatCurrency(saldo)}</p>
            </div>

            <div style={filterContainerStyle}>
                <select value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))} style={selectStyle}>
                    {meses.map((mes, index) => <option key={index} value={index}>{mes.charAt(0).toUpperCase() + mes.slice(1)}</option>)}
                </select>
                <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))} style={selectStyle}>
                    {anos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                </select>
            </div>
            
            <form onSubmit={handleSubmitTransaction} style={formStyle}>
                <h4>Adicionar Transação Manual</h4>
                <input
                    type="text"
                    placeholder="Descrição"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                    style={inputStyle}
                />
                <input
                    type="number"
                    placeholder="Valor"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                    step="1"
                    style={inputStyle}
                />
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={selectStyle}>
                    <option value="saida">Saída</option>
                    <option value="entrada">Entrada</option>
                </select>
                {tipo === 'saida' && (
                    <div style={checkboxContainerStyle}>
                        <input
                            type="checkbox"
                            checked={isFixa}
                            onChange={(e) => setIsFixa(e.target.checked)}
                            id="isFixa"
                        />
                        <label htmlFor="isFixa">Despesa Fixa?</label>
                    </div>
                )}
                <div style={{display: 'flex', gap: '10px'}}>
                    <button type="submit" style={submitButtonStyle}>
                        {editingTransaction ? 'Salvar Alterações' : 'Adicionar Transação'}
                    </button>
                    {editingTransaction && (
                        <button type="button" onClick={resetForm} style={cancelButtonStyle}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            <hr style={dividerStyle} />
            
            <h3 style={listaTitleStyle}>Transações de {meses[mesSelecionado]} de {anoSelecionado}</h3>
            <ul style={listStyle}>
                {transacoesFiltradas.map(transacao => (
                    <li key={transacao.id} style={{ ...listItemStyle, borderLeft: `5px solid ${transacao.tipo === 'entrada' ? 'green' : 'red'}` }}>
                        <div>
                            <p style={itemText}>{transacao.descricao}</p>
                            <small style={itemDate}>{formatDate(transacao.data)}</small>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span style={{fontWeight: 'bold'}}>{formatCurrency(transacao.valor)}</span>
                            {!transacao.nome && (
                                <div style={buttonContainerStyle}>
                                    <button onClick={() => handleEditTransaction(transacao)} style={editButtonStyle}>Alterar</button>
                                    <button onClick={() => handleDeleteTransacao(transacao.id, !!transacao.nome)} style={deleteButtonStyle}>Excluir</button>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
                {transacoesFiltradas.length === 0 && <p style={{color: 'black'}}>Nenhuma transação encontrada para este período.</p>}
            </ul>

            <button onClick={() => navigate('/dashboard')} style={backButtonStyle}>Voltar para o Painel</button>
        </div>
    );
}

// Estilos
const containerStyle = { 
    padding: '20px', maxWidth: '800px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif', 
    border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700', 
    backgroundColor: '#ffffff', // Fundo branco
    color: '#333333' // Cor de texto geral mais escura
};
const logoStyle = { width: '150px', marginBottom: '10px' };
const titleStyle = { color: '#000000', textShadow: 'none' }; // Título preto, sem sombra
const resumoStyle = { marginBottom: '20px', padding: '15px', border: '1px solid #FFD700', borderRadius: '10px', backgroundColor: '#f8f8f8' }; // Fundo claro para o resumo
const resumoItemStyle = { margin: '5px 0', fontSize: '1.2em' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '20px', border: '1px solid #cccccc', borderRadius: '10px', backgroundColor: '#f0f0f0', color: '#333333' }; // Fundo claro para o formulário, letras escuras
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#ffffff', color: '#000000' }; // Input com fundo branco e letras pretas
const selectStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#ffffff', color: '#000000' }; // Select com fundo branco e letras pretas
const submitButtonStyle = { padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const dividerStyle = { borderTop: '1px solid #FFD700', margin: '20px 0' };
const listaTitleStyle = { color: '#000000' }; // Título da lista preto
const listStyle = { listStyleType: 'none', padding: '0' };
const listItemStyle = { padding: '15px', border: '1px solid #FFD700', borderRadius: '10px', marginBottom: '10px', backgroundColor: '#f8f8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', color: '#333333' }; // Item da lista com fundo claro e letras escuras
const itemText = { margin: '0', fontSize: '1em', color: '#333333' }; // Texto do item preto
const itemDate = { margin: '0', fontSize: '0.8em', color: '#555555' }; // Data do item cinza escuro
const deleteButtonStyle = { padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const backButtonStyle = { padding: '15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', width: '100%' };
const checkboxContainerStyle = { display: 'flex', alignItems: 'center', gap: '10px', color: '#333333', justifyContent: 'center' }; // Checkbox com letras pretas
const buttonContainerStyle = { display: 'flex', gap: '10px' };
const editButtonStyle = { padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const cancelButtonStyle = { padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const filterContainerStyle = { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' };

export default FluxoDeCaixa;