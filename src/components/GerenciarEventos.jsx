// src/components/GerenciarEventos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';import { FaPlus, FaTrashAlt, FaCalendarAlt } from 'react-icons/fa';

function GerenciarEventos() {
    const navigate = useNavigate();
    const [eventos, setEventos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para o formulário de novo evento
    const [titulo, setTitulo] = useState('');
    const [data, setData] = useState('');
    const [descricao, setDescricao] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchEventos = useCallback(async () => {
        setIsLoading(true);
        try {
            const eventosRef = collection(db, 'eventos');
            const q = query(eventosRef, orderBy('data', 'desc'));
            const querySnapshot = await getDocs(q);
            const eventosList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEventos(eventosList);
        } catch (err) {
            console.error("Erro ao buscar eventos:", err);
            setError('Não foi possível carregar os eventos.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEventos();
    }, [fetchEventos]);

    const handleAddEvento = async (e) => {
        e.preventDefault();
        if (!titulo || !data || !descricao) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        setIsSaving(true);
        try {
            const dataDoEvento = Timestamp.fromDate(new Date(data));
            await addDoc(collection(db, 'eventos'), {
                titulo,
                data: dataDoEvento,
                descricao,
                dataCriacao: Timestamp.now()
            });
            // Limpa o formulário e recarrega a lista
            setTitulo('');
            setData('');
            setDescricao('');
            fetchEventos(); 
        } catch (err) {
            console.error("Erro ao adicionar evento:", err);
            setError('Falha ao salvar o evento.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEvento = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este evento?')) {
            try {
                await deleteDoc(doc(db, 'eventos', id));
                fetchEventos(); // Recarrega a lista após a exclusão
            } catch (err) {
                console.error("Erro ao excluir evento:", err);
                setError('Falha ao excluir o evento.');
            }
        }
    };

    const formatDate = (timestamp) => {
        if (timestamp instanceof Timestamp) {
            return timestamp.toDate().toLocaleDateString('pt-BR', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }
        return 'Data inválida';
    };

    return (
        <div style={containerStyle}>
            <button onClick={() => navigate('/dashboard')} style={backButtonStyle}>← Voltar ao Painel</button>
            <h2 style={titleStyle}>Gerenciar Eventos</h2>

            {/* Formulário para Adicionar Novo Evento */}
            <div style={formContainerStyle}>
                <h3 style={sectionTitleStyle}><FaPlus /> Adicionar Novo Evento</h3>
                <form onSubmit={handleAddEvento}>
                    <input
                        type="text"
                        placeholder="Título do Evento"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        style={inputStyle}
                        required
                    />
                    <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        style={inputStyle}
                        required
                    />
                    <textarea
                        placeholder="Descrição do Evento"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        style={textareaStyle}
                        rows="4"
                        required
                    ></textarea>
                    <button type="submit" style={saveButtonStyle} disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Evento'}
                    </button>
                </form>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Lista de Eventos Cadastrados */}
            <div style={listContainerStyle}>
                <h3 style={sectionTitleStyle}><FaCalendarAlt /> Eventos Cadastrados</h3>
                {isLoading ? (
                    <p>Carregando eventos...</p>
                ) : eventos.length === 0 ? (
                    <p>Nenhum evento cadastrado ainda.</p>
                ) : (
                    <ul style={listStyle}>
                        {eventos.map(evento => (
                            <li key={evento.id} style={listItemStyle}>
                                <div>
                                    <p style={eventTitleStyle}>{evento.titulo}</p>
                                    <p style={eventDateStyle}>{formatDate(evento.data)}</p>
                                    <p style={eventDescStyle}>{evento.descricao}</p>
                                </div>
                                <button onClick={() => handleDeleteEvento(evento.id)} style={deleteButtonStyle}>
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


// Estilos (CSS-in-JS)
const containerStyle = { padding: '20px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px', border: '2px solid #FFD700', color: 'white' };
const backButtonStyle = { position: 'absolute', top: '30px', left: '30px', backgroundColor: '#333', color: '#FFD700', border: '1px solid #FFD700', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' };
const titleStyle = { color: '#FFD700', textAlign: 'center', marginBottom: '30px' };
const formContainerStyle = { backgroundColor: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '10px', marginBottom: '30px' };
const sectionTitleStyle = { borderBottom: '2px solid #FFD700', paddingBottom: '10px', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#333', color: 'white', boxSizing: 'border-box' };
const textareaStyle = { ...inputStyle, resize: 'vertical' };
const saveButtonStyle = { width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em' };
const listContainerStyle = { marginTop: '30px' };
const listStyle = { listStyleType: 'none', padding: '0' };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '10px' };
const eventTitleStyle = { margin: 0, fontWeight: 'bold', fontSize: '1.2em', color: '#FFD700' };
const eventDateStyle = { margin: '5px 0', color: '#ccc', fontSize: '0.9em' };
const eventDescStyle = { margin: 0, color: 'white' };
const deleteButtonStyle = { backgroundColor: 'transparent', color: '#dc3545', border: 'none', cursor: 'pointer', fontSize: '1.5em' };

export default GerenciarEventos;