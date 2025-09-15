import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // USE ESTA LINHA (note o `../../`)
import { useNavigate } from 'react-router-dom';

function ExportPage() {
    const [transacoes, setTransacoes] = useState([]);
    const navigate = useNavigate();
 
    useEffect(() => {
        const fetchAllTransacoes = async () => {
            try {
                const transacoesRef = collection(db, 'fluxo_de_caixa');
                const q = query(transacoesRef, orderBy('data', 'asc'));
                const querySnapshot = await getDocs(q);
                const transacoesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTransacoes(transacoesList);
            } catch (error) {
                console.error("Erro ao buscar transações:", error);
            }
        };
        fetchAllTransacoes();
    }, []);

    const generateTextForClipboard = () => {
        if (transacoes.length === 0) return '';
    
        let textContent = "Data\tTipo\tDescricao\tValor\tFixa\tCategoria\n";
    
        transacoes.forEach(t => {
            const dataFormatada = t.data.toDate().toLocaleDateString('pt-BR');
            const tipo = t.tipo === 'entrada' ? 'Entrada' : 'Saída';
            const isFixa = t.isFixa ? 'Sim' : 'Não';
            const categoria = t.categoria || '-';
            const linha = `${dataFormatada}\t${tipo}\t"${t.descricao}"\t${t.valor}\t${isFixa}\t${categoria}`;
            textContent += linha + "\n";
        });
    
        // Cálculos para o resumo
        const hoje = new Date();
        
        // CÁLCULO SEMANAL
        const primeiroDiaDaSemana = new Date(hoje);
        primeiroDiaDaSemana.setDate(hoje.getDate() - 7);
        const transacoesSemana = transacoes.filter(t => t.data.toDate() >= primeiroDiaDaSemana);
        const entradasSemana = transacoesSemana.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
        const saidasSemana = transacoesSemana.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
        const lucroSemana = entradasSemana - saidasSemana;

        // CÁLCULO MENSAL
        const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const transacoesMes = transacoes.filter(t => t.data.toDate() >= primeiroDiaDoMes);
        const entradasMes = transacoesMes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
        const saidasMes = transacoesMes.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
        const lucroMes = entradasMes - saidasMes;
    
        // CÁLCULO ANUAL
        const primeiroDiaDoAno = new Date(hoje.getFullYear(), 0, 1);
        const transacoesAno = transacoes.filter(t => t.data.toDate() >= primeiroDiaDoAno);
        const entradasAno = transacoesAno.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
        const saidasAno = transacoesAno.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
        const lucroAno = entradasAno - saidasAno;
    
        textContent += "\n\nResumo\n";
        textContent += "Período\tTotal Entradas\tTotal Despesas\tLucro/Prejuízo\n";
        textContent += `Semana\t${entradasSemana}\t${saidasSemana}\t${lucroSemana}\n`;
        textContent += `Mês\t${entradasMes}\t${saidasMes}\t${lucroMes}\n`;
        textContent += `Ano\t${entradasAno}\t${saidasAno}\t${lucroAno}\n`;
    
        return textContent;
    };
    
    return (
        <div style={containerStyle}>
            <h2 style={titleStyle}>Pronto para Exportar</h2>
            <p style={{ color: '#ccc', textAlign: 'center' }}>
                Copie o texto abaixo e cole na primeira célula (A1) da sua planilha no Google Sheets.
            </p>
            <textarea
                style={textareaStyle}
                value={generateTextForClipboard()}
                readOnly
            />
            <div style={buttonGroupStyle}>
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(generateTextForClipboard());
                        alert('Dados copiados para a área de transferência!');
                    }} 
                    style={copyButtonStyle}
                >
                    Copiar Dados
                </button>
                <button onClick={() => navigate('/fluxo-de-caixa')} style={backButtonStyle}>
                    Voltar
                </button>
            </div>
        </div>
    );
}

// Estilos
const containerStyle = {
    padding: '20px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif',
    border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', position: 'relative', color: 'white'
};
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700', textAlign: 'center' };
const textareaStyle = {
    width: '100%', height: '400px', backgroundColor: '#333', color: 'white',
    border: '1px solid #FFD700', borderRadius: '5px', padding: '10px',
    fontSize: '12px', resize: 'none', fontFamily: 'monospace'
};
const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '20px'
};
const backButtonStyle = {
    padding: '12px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none',
    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};
const copyButtonStyle = {
    padding: '12px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none',
    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

export default ExportPage;