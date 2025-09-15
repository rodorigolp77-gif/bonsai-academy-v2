 // src/components/GerenciarMeusVideos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { FaVideo, FaPlus, FaTrashAlt } from 'react-icons/fa';
import './GerenciarVideos.css'; // Reutilizando o mesmo CSS do admin

function GerenciarMeusVideos() {
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);
    const [professorData, setProfessorData] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [titulo, setTitulo] = useState('');
    const [url, setUrl] = useState('');
    const [modalidade, setModalidade] = useState('');
    const [subcategoria, setSubcategoria] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        if (!auth.currentUser) {
            setError("Usuário não autenticado.");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Buscar dados do professor logado para saber suas modalidades
            const userDocRef = query(collection(db, 'alunos'), where("uid", "==", auth.currentUser.uid));
            const userSnapshot = await getDocs(userDocRef);
            if (userSnapshot.empty) throw new Error("Dados do professor não encontrados.");
            
            const profData = userSnapshot.docs[0].data();
            setProfessorData(profData);

            // 2. Buscar as categorias gerais
            const categoriasDocRef = doc(db, 'categorias', 'config');
            const categoriasDocSnap = await getDoc(categoriasDocRef);
            if (categoriasDocSnap.exists()) {
                setCategorias(categoriasDocSnap.data().modalidades);
            }

            // 3. Buscar apenas os vídeos das modalidades do professor
            if (profData.modalidade && profData.modalidade.length > 0) {
                const videosRef = collection(db, 'videoaulas');
                const q = query(videosRef, where('modalidade', 'in', profData.modalidade), orderBy('dataUpload', 'desc'));
                const querySnapshot = await getDocs(q);
                const videosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setVideos(videosList);
            }
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
            setError('Não foi possível carregar os dados.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddVideo = async (e) => {
        e.preventDefault();
        // ... (Lógica de adicionar o vídeo, similar à do admin)
    };

    const handleDeleteVideo = async (id) => {
        // ... (Lógica de deletar o vídeo, similar à do admin)
    };

    const formatDate = (timestamp) => timestamp?.toDate().toLocaleDateString('pt-BR') || 'Data inválida';

    const selectedCategoriaObj = categorias.find(c => c.nome === modalidade);

    return (
        <div className="manager-container">
            <button onClick={() => navigate('/professor/dashboard')} className="back-button">← Voltar ao Painel</button>
            <h2 className="manager-title">Gerenciar Meus Vídeos</h2>

            <div className="form-container">
                <h3 className="section-title"><FaPlus /> Adicionar Vídeo</h3>
                <form onSubmit={handleAddVideo}>
                    <input type="text" placeholder="Título do Vídeo" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="manager-input" required />
                    <input type="url" placeholder="Link do Vídeo (YouTube)" value={url} onChange={(e) => setUrl(e.target.value)} className="manager-input" required />
                    
                    <select value={modalidade} onChange={(e) => { setModalidade(e.target.value); setSubcategoria(''); }} className="manager-input" required>
                        <option value="">Selecione a Modalidade...</option>
                        {/* Mostra apenas as modalidades do professor */}
                        {professorData?.modalidade.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                        ))}
                    </select>
                    
                    {selectedCategoriaObj && selectedCategoriaObj.subcategorias.length > 0 && (
                        <select value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} className="manager-input" required>
                            <option value="">Selecione a Subcategoria...</option>
                            {selectedCategoriaObj.subcategorias.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    )}
                    
                    <button type="submit" className="save-button" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Vídeo'}</button>
                </form>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="list-container">
                 <h3 className="section-title"><FaVideo /> Meus Vídeos Cadastrados</h3>
                 {isLoading ? <p>Carregando...</p> : videos.length === 0 ? <p>Nenhum vídeo cadastrado.</p> : (
                    <ul className="manager-list">
                        {videos.map(video => (
                            <li key={video.id} className="manager-list-item">
                                <div className="item-details">
                                    <p className="item-title">{video.titulo}</p>
                                    <p className="item-meta">Modalidade: {video.modalidade} {video.subcategoria && `/ ${video.subcategoria}`}</p>
                                </div>
                                <button onClick={() => handleDeleteVideo(video.id)} className="delete-button"><FaTrashAlt /></button>
                            </li>
                        ))}
                    </ul>
                 )}
            </div>
        </div>
    );
}

export default GerenciarMeusVideos;