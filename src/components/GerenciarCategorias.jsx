// src/components/GerenciarCategorias.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaListAlt, FaPlus, FaTrashAlt, FaSave, FaTimes } from 'react-icons/fa'; // IMPORT CORRIGIDO
import './GerenciarCategorias.css';

function GerenciarCategorias() {
    const navigate = useNavigate();
    const [modalidades, setModalidades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [novaModalidade, setNovaModalidade] = useState('');
    const [novasSubcategorias, setNovasSubcategorias] = useState({});

    const fetchCategorias = useCallback(async () => {
        setIsLoading(true);
        const docRef = doc(db, 'categorias', 'config');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().modalidades) {
            setModalidades(docSnap.data().modalidades);
        } else {
            setModalidades([
                { nome: 'jiu-jitsu', subcategorias: ['Quedas', 'Passagens', 'Raspagens'] },
                { nome: 'capoeira', subcategorias: [] },
            ]);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchCategorias();
    }, [fetchCategorias]);

    const handleAddModalidade = () => {
        if (novaModalidade && !modalidades.find(m => m.nome === novaModalidade.toLowerCase())) {
            setModalidades([...modalidades, { nome: novaModalidade.toLowerCase(), subcategorias: [] }]);
            setNovaModalidade('');
        }
    };

    const handleRemoveModalidade = (nomeModalidade) => {
        if (window.confirm(`Tem certeza que deseja remover a modalidade "${nomeModalidade}"?`)) {
            setModalidades(modalidades.filter(m => m.nome !== nomeModalidade));
        }
    };
    
    const handleAddSubcategoria = (nomeModalidade) => {
        const subcategoriaText = novasSubcategorias[nomeModalidade]?.trim();
        if (!subcategoriaText) return;

        const newModalidades = modalidades.map(m => {
            if (m.nome === nomeModalidade) {
                if (m.subcategorias.find(s => s.toLowerCase() === subcategoriaText.toLowerCase())) {
                    alert('Esta subcategoria já existe.');
                    return m;
                }
                return { ...m, subcategorias: [...m.subcategorias, subcategoriaText] };
            }
            return m;
        });
        setModalidades(newModalidades);
        setNovasSubcategorias({ ...novasSubcategorias, [nomeModalidade]: '' });
    };

    const handleRemoveSubcategoria = (nomeModalidade, subcategoriaToRemove) => {
        const newModalidades = modalidades.map(m => {
            if (m.nome === nomeModalidade) {
                return { ...m, subcategorias: m.subcategorias.filter(s => s !== subcategoriaToRemove) };
            }
            return m;
        });
        setModalidades(newModalidades);
    };

    const handleSaveChanges = async () => {
        if (!window.confirm("Você tem certeza que quer salvar estas alterações no banco de dados?")) return;
        
        setIsSaving(true);
        try {
            const docRef = doc(db, 'categorias', 'config');
            await setDoc(docRef, { modalidades: modalidades });
            alert('Categorias salvas com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar categorias: ", error);
            alert('Ocorreu um erro ao salvar as categorias.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="manager-container">Carregando categorias...</div>;
    }

    return (
        <div className="manager-container">
            <button onClick={() => navigate('/dashboard')} className="back-button">← Voltar</button>
            <h2 className="manager-title">Gerenciar Categorias de Vídeos</h2>

            <div className="form-container">
                <h3 className="section-title"><FaPlus /> Adicionar Nova Modalidade</h3>
                <div className="add-item-form">
                    <input
                        type="text"
                        placeholder="Nome da nova modalidade"
                        value={novaModalidade}
                        onChange={(e) => setNovaModalidade(e.target.value)}
                        className="manager-input"
                    />
                    <button onClick={handleAddModalidade} className="add-button">Adicionar</button>
                </div>
            </div>

            <div className="list-container">
                <h3 className="section-title"><FaListAlt /> Lista de Modalidades</h3>
                {modalidades.map((mod, index) => (
                    <div key={index} className="modality-item">
                        <div className="modality-header">
                            <h4>{mod.nome.charAt(0).toUpperCase() + mod.nome.slice(1)}</h4>
                            <button onClick={() => handleRemoveModalidade(mod.nome)} className="delete-button-small"><FaTrashAlt /></button>
                        </div>
                        <div className="subcategory-list">
                            {mod.subcategorias.map((sub, subIndex) => (
                                <div key={subIndex} className="subcategory-item">
                                    <span>{sub}</span>
                                    <button onClick={() => handleRemoveSubcategoria(mod.nome, sub)} className="delete-button-small subtle"><FaTimes /></button>
                                </div>
                            ))}
                        </div>
                        <div className="add-item-form">
                            <input
                                type="text"
                                placeholder="Adicionar subcategoria"
                                value={novasSubcategorias[mod.nome] || ''}
                                onChange={(e) => setNovasSubcategorias({ ...novasSubcategorias, [mod.nome]: e.target.value })}
                                className="manager-input"
                            />
                            <button onClick={() => handleAddSubcategoria(mod.nome)} className="add-button">Adicionar</button>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={handleSaveChanges} className="save-changes-button" disabled={isSaving}>
                <FaSave /> {isSaving ? 'Salvando...' : 'Salvar Alterações no Banco de Dados'}
            </button>
        </div>
    );
}

export default GerenciarCategorias;