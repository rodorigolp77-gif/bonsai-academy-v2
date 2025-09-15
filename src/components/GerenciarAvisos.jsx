// src/components/GerenciarAvisos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, Timestamp, query } from 'firebase/firestore';
import { FaBullhorn, FaPlus, FaTrashAlt } from 'react-icons/fa';
import './GerenciarAvisos.css';

function GerenciarAvisos() {
    const navigate = useNavigate();
    const [avisos, setAvisos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para o formulário 
    const [titulo, setTitulo] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchAvisos = useCallback(async () => {
        setIsLoading(true);
        try {
            const avisosRef = collection(db, 'avisos');
            const q = query(avisosRef, orderBy('dataCriacao', 'desc'));
            const querySnapshot = await getDocs(q);
            const avisosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvisos(avisosList);
        } catch (err) {
            console.error("Erro ao buscar avisos:", err);
            setError('Não foi possível carregar os avisos.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvisos();
    }, [fetchAvisos]);

    const handleAddAviso = async (e) => {
        e.preventDefault();
        if (!titulo || !mensagem) {
            alert('Por favor, preencha o título e a mensagem.');
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'avisos'), {
                titulo,
                mensagem,
                dataCriacao: Timestamp.now()
            });
            setTitulo('');
            setMensagem('');
            fetchAvisos(); 
        } catch (err) {
            console.error("Erro ao adicionar aviso:", err);
            setError('Falha ao salvar o aviso.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAviso = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este aviso?')) {
            try {
                await deleteDoc(doc(db, 'avisos', id));
                fetchAvisos();
            } catch (err) {
                console.error("Erro ao excluir aviso:", err);
                setError('Falha ao excluir o aviso.');
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
            <h2 className="manager-title">Gerenciar Quadro de Avisos</h2>

            <div className="form-container">
                <h3 className="section-title"><FaPlus /> Adicionar Novo Aviso</h3>
                <form onSubmit={handleAddAviso}>
                    <input type="text" placeholder="Título do Aviso" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="manager-input" required />
                    <textarea placeholder="Mensagem do Aviso" value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="manager-input" rows="4" required></textarea>
                    <button type="submit" className="save-button" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Aviso'}
                    </button>
                </form>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="list-container">
                <h3 className="section-title"><FaBullhorn /> Avisos Cadastrados</h3>
                {isLoading ? <p>Carregando...</p> : avisos.length === 0 ? <p>Nenhum aviso cadastrado ainda.</p> : (
                    <ul className="manager-list">
                        {avisos.map(aviso => (
                            <li key={aviso.id} className="manager-list-item">
                                <div className="item-details">
                                    <p className="item-title">{aviso.titulo}</p>
                                    <p className="item-meta">Mensagem: {aviso.mensagem}</p>
                                    <p className="item-meta">Criado em: {formatDate(aviso.dataCriacao)}</p>
                                </div>
                                <button onClick={() => handleDeleteAviso(aviso.id)} className="delete-button">
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

export default GerenciarAvisos;