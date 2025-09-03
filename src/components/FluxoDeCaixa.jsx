import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import bonsaiLogo from '../assets/bonsai_logo.png';

function FluxoDeCaixa() {
    const navigate = useNavigate();
    const [entradas, setEntradas] = useState([]);
    const [saidas, setSaidas] = useState([]);
    const [despesasFixas, setDespesasFixas] = useState([]);
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [tipo, setTipo] = useState('entrada');
    const [isFixa, setIsFixa] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const fetchTransacoes = async () => {
        try {
            const transacoesRef = collection(db, 'fluxo_de_caixa');
            const q = query(transacoesRef, orderBy('data', 'desc'));
            const querySnapshot = await getDocs(q);
            const transacoesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const entradasFiltradas = transacoesList.filter(t => t.tipo === 'entrada');
            const saidasNaoFixas = transacoesList.filter(t => t.tipo === 'saida' && !t.isFixa);
            const saidasFixas = transacoesList.filter(t => t.tipo === 'saida' && t.isFixa);

            setEntradas(entradasFiltradas);
            setSaidas(saidasNaoFixas);
            setDespesasFixas(saidasFixas);
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
                categoria: '',
                isFixa: tipo === 'saida' ? isFixa : false,
            };

            if (editingTransaction) {
                const docRef = doc(db, 'fluxo_de_caixa', editingTransaction.id);
                await updateDoc(docRef, transactionData);
                alert('Transação alterada com sucesso!');
            } else {
                await addDoc(collection(db, 'fluxo_de_caixa'), {
                    ...transactionData,
                    data: new Date(),
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
        setTipo('entrada');
        setIsFixa(false);
    };

    const handleFetchStudentPayments = async () => {
        try {
            const hoje = new Date();
            const semanaPassada = new Date(hoje);
            semanaPassada.setDate(hoje.getDate() - 7);

            const pagamentosRef = collection(db, 'pagamentos');
            const q = query(
                pagamentosRef,
                where('data_pagamento', '>=', Timestamp.fromDate(semanaPassada)),
                where('data_pagamento', '<=', Timestamp.fromDate(hoje))
            );
            const querySnapshot = await getDocs(q);
            
            let totalPagamentos = 0;
            querySnapshot.forEach(doc => {
                totalPagamentos += doc.data().valor_pago || 0;
            });

            if (totalPagamentos > 0) {
                await addDoc(collection(db, 'fluxo_de_caixa'), {
                    descricao: `Total de mensalidades da semana (${semanaPassada.toLocaleDateString()} - ${hoje.toLocaleDateString()})`,
                    valor: totalPagamentos,
                    tipo: 'entrada',
                    categoria: 'Mensalidades',
                    isFixa: false,
                    data: new Date(),
                });
                alert(`Total de ¥${totalPagamentos} inserido no fluxo de caixa!`);
                await fetchTransacoes();
            } else {
                alert('Nenhum pagamento encontrado na última semana.');
            }
        } catch (error) {
            console.error("Erro ao buscar pagamentos dos alunos:", error);
            alert('Erro ao buscar pagamentos. Verifique o console para mais detalhes.');
        }
    };

    const handleFetchMonthlyPayments = async () => {
        try {
            const hoje = new Date();
            const mesPassado = new Date(hoje);
            mesPassado.setMonth(hoje.getMonth() - 1);
            
            const pagamentosRef = collection(db, 'pagamentos');
            const q = query(
                pagamentosRef,
                where('data_pagamento', '>=', Timestamp.fromDate(mesPassado)),
                where('data_pagamento', '<=', Timestamp.fromDate(hoje))
            );
            const querySnapshot = await getDocs(q);

            let totalPagamentos = 0;
            querySnapshot.forEach(doc => {
                totalPagamentos += doc.data().valor_pago || 0;
            });

            if (totalPagamentos > 0) {
                await addDoc(collection(db, 'fluxo_de_caixa'), {
                    descricao: `Total de mensalidades do mês (${mesPassado.toLocaleDateString()} - ${hoje.toLocaleDateString()})`,
                    valor: totalPagamentos,
                    tipo: 'entrada',
                    categoria: 'Mensalidades',
                    isFixa: false,
                    data: new Date(),
                });
                alert(`Total de ¥${totalPagamentos} inserido no fluxo de caixa do último mês!`);
                await fetchTransacoes();
            } else {
                alert('Nenhum pagamento encontrado no último mês.');
            }
        } catch (error) {
            console.error("Erro ao buscar pagamentos mensais:", error);
            alert('Erro ao buscar pagamentos. Verifique o console para mais detalhes.');
        }
    };

    const handleFetchAnnualPayments = async () => {
        try {
            const hoje = new Date();
            const anoPassado = new Date(hoje);
            anoPassado.setFullYear(hoje.getFullYear() - 1);
            
            const pagamentosRef = collection(db, 'pagamentos');
            const q = query(
                pagamentosRef,
                where('data_pagamento', '>=', Timestamp.fromDate(anoPassado)),
                where('data_pagamento', '<=', Timestamp.fromDate(hoje))
            );
            const querySnapshot = await getDocs(q);

            let totalPagamentos = 0;
            querySnapshot.forEach(doc => {
                totalPagamentos += doc.data().valor_pago || 0;
            });

            if (totalPagamentos > 0) {
                await addDoc(collection(db, 'fluxo_de_caixa'), {
                    descricao: `Total de mensalidades do ano (${anoPassado.toLocaleDateString()} - ${hoje.toLocaleDateString()})`,
                    valor: totalPagamentos,
                    tipo: 'entrada',
                    categoria: 'Mensalidades',
                    isFixa: false,
                    data: new Date(),
                });
                alert(`Total de ¥${totalPagamentos} inserido no fluxo de caixa do último ano!`);
                await fetchTransacoes();
            } else {
                alert('Nenhum pagamento encontrado no último ano.');
            }
        } catch (error) {
            console.error("Erro ao buscar pagamentos anuais:", error);
            alert('Erro ao buscar pagamentos. Verifique o console para mais detalhes.');
        }
    };

    const handleDeleteTransacao = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
            try {
                await deleteDoc(doc(db, 'fluxo_de_caixa', id));
                await fetchTransacoes();
                resetForm();
            } catch (error) {
                console.error("Erro ao deletar transação:", error);
            }
        }
    };

    // NOVA FUNÇÃO: Deleta todos os dados do mês atual
    const handleDeleteMonthData = async () => {
        if (window.confirm("ATENÇÃO: Isso irá DELETAR TODAS as transações do mês atual. Tem certeza que deseja continuar?")) {
            try {
                const hoje = new Date();
                const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

                const transacoesRef = collection(db, 'fluxo_de_caixa');
                const q = query(
                    transacoesRef,
                    where('data', '>=', Timestamp.fromDate(primeiroDiaDoMes)),
                    where('data', '<=', Timestamp.fromDate(ultimoDiaDoMes))
                );
                
                const querySnapshot = await getDocs(q);
                const deletePromises = querySnapshot.docs.map(docToDelete => deleteDoc(doc(db, 'fluxo_de_caixa', docToDelete.id)));
                
                await Promise.all(deletePromises);
                
                alert('Todos os dados do mês atual foram deletados com sucesso.');
                await fetchTransacoes();
            } catch (error) {
                console.error("Erro ao deletar dados do mês:", error);
                alert('Erro ao deletar dados. Verifique o console para mais detalhes.');
            }
        }
    };

    const handleNavigateToExport = () => {
        navigate('/export');
    };

    const totalEntradas = entradas.reduce((acc, t) => acc + t.valor, 0);
    const totalSaidasFixas = despesasFixas.reduce((acc, t) => acc + t.valor, 0);
    const totalSaidasVariaveis = saidas.reduce((acc, t) => acc + t.valor, 0);
    const totalSaidas = totalSaidasFixas + totalSaidasVariaveis;
    const saldo = totalEntradas - totalSaidas;

    const formatCurrency = (value) => `¥ ${value.toFixed(0)}`;

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h2 style={titleStyle}>Fluxo de Caixa</h2>
            
            <div style={resumoStyle}>
                <p style={{...resumoItemStyle, color: 'green'}}>Total de Entradas: {formatCurrency(totalEntradas)}</p>
                <p style={{...resumoItemStyle, color: 'red'}}>Total de Saídas: {formatCurrency(totalSaidas)}</p>
                <p style={{...resumoItemStyle, fontWeight: 'bold', color: saldo >= 0 ? 'green' : 'red'}}>Saldo Atual: {formatCurrency(saldo)}</p>
            </div>
            
            <form onSubmit={handleSubmitTransaction} style={formStyle}>
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
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
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
                        {editingTransaction ? 'Salvar Alterações' : 'Adicionar'}
                    </button>
                    {editingTransaction && (
                        <button type="button" onClick={resetForm} style={cancelButtonStyle}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            <div style={buttonGroupStyle}>
                <button onClick={handleFetchStudentPayments} style={{...submitButtonStyle, backgroundColor: '#007bff'}}>
                    Entradas da Semana
                </button>
                <button onClick={handleFetchMonthlyPayments} style={{...submitButtonStyle, backgroundColor: '#007bff'}}>
                    Entradas do Mês
                </button>
                <button onClick={handleFetchAnnualPayments} style={{...submitButtonStyle, backgroundColor: '#007bff'}}>
                    Entradas do Ano
                </button>
            </div>
            <small style={{display: 'block', marginTop: '5px', color: '#ccc'}}>Adiciona total de mensalidades no fluxo de caixa.</small>

            <hr style={dividerStyle} />
            
            <button onClick={handleNavigateToExport} style={exportButtonStyle}>
                Exportar para Planilha
            </button>
            
            <button onClick={handleDeleteMonthData} style={{...deleteButtonStyle, width: '100%', padding: '12px', marginTop: '10px'}}>
                Limpar Dados do Mês
            </button>

            <h3 style={listaTitleStyle}>Despesas Fixas</h3>
            <ul style={listStyle}>
                {despesasFixas.map(transacao => (
                    <li key={transacao.id} style={{ ...listItemStyle, borderLeft: `5px solid #dc3545`, backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
                        <div>
                            <p style={itemText}>**{transacao.descricao}** - {formatCurrency(transacao.valor)}</p>
                            <small style={itemDate}>Fixo</small>
                        </div>
                        <div style={buttonContainerStyle}>
                            <button onClick={() => handleEditTransaction(transacao)} style={editButtonStyle}>Alterar</button>
                            <button onClick={() => handleDeleteTransacao(transacao.id)} style={deleteButtonStyle}>Excluir</button>
                        </div>
                    </li>
                ))}
            </ul>

            <h3 style={listaTitleStyle}>Últimas Transações (Entradas e Saídas Variáveis)</h3>
            <ul style={listStyle}>
                {entradas.concat(saidas).sort((a, b) => b.data.toDate() - a.data.toDate()).map(transacao => (
                    <li key={transacao.id} style={{ ...listItemStyle, borderLeft: `5px solid ${transacao.tipo === 'entrada' ? 'green' : 'red'}` }}>
                        <div>
                            <p style={itemText}>**{transacao.descricao}** - {formatCurrency(transacao.valor)}</p>
                            <small style={itemDate}>{transacao.data.toDate().toLocaleDateString('pt-BR')}</small>
                        </div>
                        <div style={buttonContainerStyle}>
                            <button onClick={() => handleEditTransaction(transacao)} style={editButtonStyle}>Alterar</button>
                            <button onClick={() => handleDeleteTransacao(transacao.id)} style={deleteButtonStyle}>Excluir</button>
                        </div>
                    </li>
                ))}
            </ul>

            <button onClick={() => navigate('/dashboard')} style={backButtonStyle}>Voltar para o Painel</button>
        </div>
    );
}

// Estilos
const containerStyle = {
    padding: '20px', maxWidth: '600px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif',
    border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', position: 'relative', color: 'white'
};
const logoStyle = { width: '150px', marginBottom: '10px' };
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700' };
const resumoStyle = { marginBottom: '20px', padding: '15px', border: '1px solid #FFD700', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.1)' };
const resumoItemStyle = { margin: '5px 0', fontSize: '1.2em' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' };
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' };
const selectStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' };
const submitButtonStyle = { padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const dividerStyle = { borderTop: '1px solid #FFD700', margin: '20px 0' };
const listaTitleStyle = { color: '#FFD700' };
const listStyle = { listStyleType: 'none', padding: '0' };
const listItemStyle = {
    padding: '15px', border: '1px solid #FFD700', borderRadius: '10px', marginBottom: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', textAlign: 'left'
};
const itemText = { margin: '0', fontSize: '1em' };
const itemDate = { margin: '0', fontSize: '0.8em', color: '#ccc' };
const deleteButtonStyle = {
    padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none',
    borderRadius: '5px', cursor: 'pointer'
};
const backButtonStyle = {
    padding: '15px', backgroundColor: '#dc3545', color: 'white', border: 'none',
    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};
const exportButtonStyle = {
    padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none',
    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px',
};
const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#FFD700'
};
const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginTop: '15px'
};
const buttonContainerStyle = {
    display: 'flex',
    gap: '10px',
};
const editButtonStyle = {
    padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none',
    borderRadius: '5px', cursor: 'pointer'
};
const cancelButtonStyle = {
    padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none',
    borderRadius: '5px', cursor: 'pointer'
};

export default FluxoDeCaixa;