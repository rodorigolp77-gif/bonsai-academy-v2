// src/components/GerenciarResultados.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { FaTrophy, FaPlus, FaTrashAlt } from 'react-icons/fa';
import './GerenciarResultados.css'; // Usaremos um CSS próprio, que será o próximo passo

function GerenciarResultados() {
    const navigate = useNavigate();
    const [resultados, setResultados] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para o formulário
    const [titulo, setTitulo] = useState('');
    const [data, setData] = useState('');
    const [descricao, setDescricao] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchResultados = useCallback(async () => {
        setIsLoading(true);
        try {
            const resultadosRef = collection(db, 'resultados');
            const q = query(resultadosRef, orderBy('data', 'desc'));
            const querySnapshot = await getDocs(q);
            const resultadosList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setResultados(resultadosList);
        } catch (err) {
            console.error("Erro ao buscar resultados:", err);
            setError('Não foi possível carregar os resultados.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResultados();
    }, [fetchResultados]);

    const handleAddResultado = async (e) => {
        e.preventDefault();
        if (!titulo || !data || !descricao) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        setIsSaving(true);
        try {
            const dataDoResultado = Timestamp.fromDate(new Date(data));
            await addDoc(collection(db, 'resultados'), {
                titulo,
                data: dataDoResultado,
                descricao,
                dataCriacao: Timestamp.now()
            });
            setTitulo('');
            setData('');
            setDescricao('');
            fetchResultados(); 
        } catch (err) {
            console.error("Erro ao adicionar resultado:", err);
            setError('Falha ao salvar o resultado.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteResultado = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este resultado?')) {
            try {
                await deleteDoc(doc(db, 'resultados', id));
                fetchResultados();
            } catch (err) {
                console.error("Erro ao excluir resultado:", err);
                setError('Falha ao excluir o resultado.');
            }
        }
    };
    
    const formatDate = (timestamp) => {
        if (timestamp instanceof Timestamp) {
            return timestamp.toDate().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        return 'Data inválida';
    };

    return (
        <div className="manager-container">
            <button onClick={() => navigate('/dashboard')} className="back-button">← Voltar ao Painel</button>
            <h2 className="manager-title">Gerenciar Resultados</h2>

            <div className="form-container">
                <h3 className="section-title"><FaPlus /> Adicionar Novo Resultado</h3>
                <form onSubmit={handleAddResultado}>
                    <input type="text" placeholder="Título do Resultado (ex: Campeonato Paulista)" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="manager-input" required />
                    <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="manager-input" required />
                    <textarea placeholder="Descrição do Resultado (ex: 1º Lugar - Faixa Azul)" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="manager-input" rows="4" required></textarea>
                    <button type="submit" className="save-button" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Resultado'}
                    </button>
                </form>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="list-container">
                <h3 className="section-title"><FaTrophy /> Resultados Cadastrados</h3>
                {isLoading ? <p>Carregando...</p> : resultados.length === 0 ? <p>Nenhum resultado cadastrado ainda.</p> : (
                    <ul className="manager-list">
                        {resultados.map(resultado => (
                            <li key={resultado.id} className="manager-list-item">
                                <div className="item-details">
                                    <p className="item-title">{resultado.titulo}</p>
                                    <p className="item-meta">Data: {formatDate(resultado.data)}</p>
                                    <p className="item-meta">Descrição: {resultado.descricao}</p>
                                </div>
                                <button onClick={() => handleDeleteResultado(resultado.id)} className="delete-button">
                                    <FaTrashAlt />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default GerenciarResultados;