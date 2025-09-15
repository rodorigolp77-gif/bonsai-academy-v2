 // src/components/GerenciarPlanosDeTreino.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, doc, getDoc, query, orderBy, getDocs, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import './GerenciarFitness.css'; // Reutilizaremos o mesmo CSS

const GerenciarPlanosDeTreino = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [categoria, setCategoria] = useState(null);
    const [planos, setPlanos] = useState([]);
    const [exercicios, setExercicios] = useState({}); // Objeto para guardar exercícios de cada plano
    const [loading, setLoading] = useState(true);
    const [planoSelecionado, setPlanoSelecionado] = useState(null); // Para saber qual plano estamos editando

    // Estados para o formulário de novo plano
    const [novoPlanoNome, setNovoPlanoNome] = useState('');
    const [novoPlanoDescricao, setNovoPlanoDescricao] = useState('');
    
    // Estados para o formulário de novo exercício
    const [novoExercicioNome, setNovoExercicioNome] = useState('');
    const [novoExercicioSeries, setNovoExercicioSeries] = useState('');
    const [novoExercicioReps, setNovoExercicioReps] = useState('');
    const [novoExercicioDescanso, setNovoExercicioDescanso] = useState('');
    const [novoExercicioUrl, setNovoExercicioUrl] = useState(''); // NOVO CAMPO

    const fetchPlanosEExercicios = useCallback(async () => {
        if (!categoryId) return;
        setLoading(true);
        try {
            const categoriaDoc = await getDoc(doc(db, 'fitnessCategorias', categoryId));
            if (categoriaDoc.exists()) {
                setCategoria({ id: categoriaDoc.id, ...categoriaDoc.data() });
            }

            const planosRef = collection(db, 'fitnessCategorias', categoryId, 'planosDeTreino');
            const qPlanos = query(planosRef, orderBy('nome'));
            const planosSnapshot = await getDocs(qPlanos);
            const planosList = planosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlanos(planosList);

            // Para cada plano, buscar seus exercícios
            const exerciciosPromises = planosList.map(plano =>
                getDocs(query(collection(db, 'fitnessCategorias', categoryId, 'planosDeTreino', plano.id, 'exercicios'), orderBy('ordem', 'asc')))
            );
            const exerciciosSnapshots = await Promise.all(exerciciosPromises);
            
            const exerciciosPorPlano = {};
            exerciciosSnapshots.forEach((snapshot, index) => {
                const planoId = planosList[index].id;
                exerciciosPorPlano[planoId] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            });
            setExercicios(exerciciosPorPlano);

        } catch (error) {
            console.error("Erro ao buscar dados: ", error);
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchPlanosEExercicios();
    }, [fetchPlanosEExercicios]);
    
    const handleAddPlano = async (e) => {
        e.preventDefault();
        if (novoPlanoNome.trim() === '') return;
        try {
            const planosRef = collection(db, 'fitnessCategorias', categoryId, 'planosDeTreino');
            await addDoc(planosRef, { nome: novoPlanoNome, descricao: novoPlanoDescricao });
            setNovoPlanoNome('');
            setNovoPlanoDescricao('');
            fetchPlanosEExercicios();
        } catch (error) {
            console.error("Erro ao adicionar plano: ", error);
        }
    };

    const handleAddExercicio = async (e, planoId) => {
        e.preventDefault();
        if (novoExercicioNome.trim() === '' || novoExercicioSeries.trim() === '' || novoExercicioReps.trim() === '') return;
        try {
            const exerciciosRef = collection(db, 'fitnessCategorias', categoryId, 'planosDeTreino', planoId, 'exercicios');
            const ordem = (exercicios[planoId]?.length || 0) + 1; // Para ordenar os exercícios
            await addDoc(exerciciosRef, {
                nome: novoExercicioNome,
                series: novoExercicioSeries,
                repeticoes: novoExercicioReps,
                descanso: novoExercicioDescanso,
                videoUrl: novoExercicioUrl, // SALVANDO O NOVO CAMPO
                ordem: ordem
            });
            // Limpa os campos do formulário
            setNovoExercicioNome('');
            setNovoExercicioSeries('');
            setNovoExercicioReps('');
            setNovoExercicioDescanso('');
            setNovoExercicioUrl('');
            fetchPlanosEExercicios(); // Recarrega tudo
        } catch (error) {
            console.error("Erro ao adicionar exercício: ", error);
        }
    };
    
    const handleDeletePlano = async (planoId) => {
        if (window.confirm("Tem certeza que deseja excluir este plano e todos os seus exercícios?")) {
            try {
                await deleteDoc(doc(db, 'fitnessCategorias', categoryId, 'planosDeTreino', planoId));
                fetchPlanosEExercicios();
            } catch (error) { console.error("Erro ao excluir plano: ", error); }
        }
    };

    const handleDeleteExercicio = async (planoId, exercicioId) => {
        if (window.confirm("Tem certeza que deseja excluir este exercício?")) {
            try {
                await deleteDoc(doc(db, 'fitnessCategorias', categoryId, 'planosDeTreino', planoId, 'exercicios', exercicioId));
                fetchPlanosEExercicios();
            } catch (error) { console.error("Erro ao excluir exercício: ", error); }
        }
    };

    if (loading) return <div className="loading-screen">Carregando...</div>;

    return (
        <div className="gerenciar-container">
            <header className="gerenciar-header">
                <h1>Planos de Treino: {categoria?.nome}</h1>
                <button onClick={() => navigate('/gerenciar-fitness')} className="back-button">&larr; Voltar para Categorias</button>
            </header>

            <div className="content-section">
                <h2>Adicionar Novo Plano de Treino</h2>
                <form onSubmit={handleAddPlano} className="add-form-vertical">
                    <input type="text" value={novoPlanoNome} onChange={(e) => setNovoPlanoNome(e.target.value)} placeholder="Nome do Plano (ex: Treino A - Peito e Tríceps)" required />
                    <textarea value={novoPlanoDescricao} onChange={(e) => setNovoPlanoDescricao(e.target.value)} placeholder="Breve descrição (opcional)" rows="2" />
                    <button type="submit">Adicionar Plano</button>
                </form>
            </div>
            
            <div className="content-section">
                <h2>Planos de Treino Existentes</h2>
                {planos.length > 0 ? planos.map(plano => (
                    <div key={plano.id} className="plano-card">
                        <div className="plano-header">
                            <h3>{plano.nome}</h3>
                            <p>{plano.descricao}</p>
                            <button className="btn-delete-plano" onClick={() => handleDeletePlano(plano.id)}>Excluir Plano</button>
                        </div>

                        <div className="exercicio-list">
                            <h4>Exercícios do Plano</h4>
                            {exercicios[plano.id] && exercicios[plano.id].length > 0 ? (
                                <table className="exercicio-table">
                                    <thead><tr><th>Exercício</th><th>Séries x Reps</th><th>Descanso</th><th>Vídeo/GIF</th><th>Ações</th></tr></thead>
                                    <tbody>
                                        {exercicios[plano.id].map(ex => (
                                            <tr key={ex.id}>
                                                <td>{ex.nome}</td>
                                                <td>{ex.series} x {ex.repeticoes}</td>
                                                <td>{ex.descanso || 'N/A'}</td>
                                                <td>{ex.videoUrl ? <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer">Ver Vídeo</a> : 'Não'}</td>
                                                <td><button className="btn-delete-ex" onClick={() => handleDeleteExercicio(plano.id, ex.id)}>X</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p>Nenhum exercício adicionado a este plano ainda.</p>}
                        </div>
                        
                        <div className="add-exercicio-form">
                            <h4>Adicionar Novo Exercício</h4>
                            <form onSubmit={(e) => handleAddExercicio(e, plano.id)}>
                                <input type="text" value={novoExercicioNome} onChange={e => setNovoExercicioNome(e.target.value)} placeholder="Nome do Exercício" required />
                                <input type="text" value={novoExercicioSeries} onChange={e => setNovoExercicioSeries(e.target.value)} placeholder="Séries (ex: 3)" required />
                                <input type="text" value={novoExercicioReps} onChange={e => setNovoExercicioReps(e.target.value)} placeholder="Repetições (ex: 10-12)" required />
                                <input type="text" value={novoExercicioDescanso} onChange={e => setNovoExercicioDescanso(e.target.value)} placeholder="Descanso (ex: 60s)" />
                                <input type="url" value={novoExercicioUrl} onChange={e => setNovoExercicioUrl(e.target.value)} placeholder="URL do Vídeo ou GIF (opcional)" />
                                <button type="submit">Adicionar Exercício</button>
                            </form>
                        </div>
                    </div>
                )) : <p>Nenhum plano de treino criado para esta categoria.</p>}
            </div>
        </div>
    );
};

export default GerenciarPlanosDeTreino;