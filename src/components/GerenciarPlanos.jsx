import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- LINHA QUE FALTAVA
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import './GerenciarPlanos.css'; 

function GerenciarPlanos() {
    const navigate = useNavigate(); // <-- ESSA LINHA PRECISA DO 'useNavigate' IMPORTADO

    // --- ESTADOS PARA CATEGORIAS ---
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // --- ESTADOS PARA PLANOS ---
    const [plans, setPlans] = useState([]);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDescription, setNewPlanDescription] = useState('');
    const [isVipPlan, setIsVipPlan] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // --- ESTADOS PARA EXERCÍCIOS ---
    const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', rest: '', videoUrl: '' });

    // --- ESTADOS GERAIS ---
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const categoriesCollectionRef = collection(db, 'fitnessCategories');
    const plansCollectionRef = collection(db, 'fitnessPlans');

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const q = query(categoriesCollectionRef, orderBy('createdAt', 'desc'));
            const data = await getDocs(q);
            setCategories(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            setError('');
        } catch (err) { console.error(err); setError('Falha ao carregar as categorias.'); } 
        finally { setLoadingCategories(false); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') return;
        setIsSaving(true);
        try {
            await addDoc(categoriesCollectionRef, { name: newCategoryName, createdAt: serverTimestamp() });
            setNewCategoryName('');
            await fetchCategories();
        } catch (err) { console.error(err); setError('Não foi possível adicionar a categoria.'); } 
        finally { setIsSaving(false); }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Tem certeza? Excluir uma categoria também excluirá TODOS os planos de treino dentro dela.')) {
            try {
                // Futuramente: adicionar lógica para deletar planos associados
                await deleteDoc(doc(db, 'fitnessCategories', id));
                await fetchCategories();
                setSelectedCategory(null);
                setSelectedPlan(null);
            } catch (err) { console.error(err); setError('Não foi possível excluir a categoria.'); }
        }
    };

    const fetchPlans = async (categoryId) => {
        if (!categoryId) { setPlans([]); return; }
        try {
            setLoadingPlans(true);
            const q = query(plansCollectionRef, where('categoryId', '==', categoryId), orderBy('createdAt', 'desc'));
            const data = await getDocs(q);
            setPlans(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        } catch (err) { console.error(err); setError('Falha ao carregar os planos.'); } 
        finally { setLoadingPlans(false); }
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        setSelectedPlan(null); // Reseta o plano selecionado ao trocar de categoria
        fetchPlans(category.id);
    };

    const handleAddPlan = async (e) => {
        e.preventDefault();
        if (newPlanName.trim() === '' || !selectedCategory) return;
        setIsSaving(true);
        try {
            await addDoc(plansCollectionRef, { 
                name: newPlanName, 
                description: newPlanDescription, 
                categoryId: selectedCategory.id, 
                is_vip: isVipPlan,
                createdAt: serverTimestamp(), 
                exercicios: [] 
            });
            setNewPlanName('');
            setNewPlanDescription('');
            setIsVipPlan(false);
            await fetchPlans(selectedCategory.id);
        } catch (err) { console.error(err); setError('Não foi possível adicionar o plano.'); } 
        finally { setIsSaving(false); }
    };

    const handleDeletePlan = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este plano de treino?')) {
            try {
                await deleteDoc(doc(db, 'fitnessPlans', id));
                await fetchPlans(selectedCategory.id);
                setSelectedPlan(null); // Reseta o plano selecionado
            } catch (err) { console.error(err); setError('Não foi possível excluir o plano.'); }
        }
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
    };

    const handleExerciseInputChange = (e) => {
        const { name, value } = e.target;
        setNewExercise(prev => ({ ...prev, [name]: value }));
    };

    const handleAddExercise = async (e) => {
        e.preventDefault();
        if (!newExercise.name || !newExercise.sets || !newExercise.reps || !newExercise.rest) {
            alert('Por favor, preencha todos os campos do exercício.');
            return;
        }
        const exerciseToAdd = { ...newExercise, id: Date.now().toString() };
        const planDocRef = doc(db, 'fitnessPlans', selectedPlan.id);
        try {
            await updateDoc(planDocRef, { exercicios: arrayUnion(exerciseToAdd) });
            const updatedPlan = { ...selectedPlan, exercicios: [...(selectedPlan.exercicios || []), exerciseToAdd] };
            setSelectedPlan(updatedPlan);
            setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
            setNewExercise({ name: '', sets: '', reps: '', rest: '', videoUrl: '' }); // Limpar formulário
        } catch (err) {
            console.error("Erro ao adicionar exercício: ", err);
            setError("Falha ao adicionar exercício.");
        }
    };

    const handleDeleteExercise = async (exerciseToRemove) => {
        if (!window.confirm(`Tem certeza que deseja remover o exercício "${exerciseToRemove.name}"?`)) return;
        const planDocRef = doc(db, 'fitnessPlans', selectedPlan.id);
        try {
            await updateDoc(planDocRef, { exercicios: arrayRemove(exerciseToRemove) });
             const updatedPlan = { ...selectedPlan, exercicios: selectedPlan.exercicios.filter(ex => ex.id !== exerciseToRemove.id) };
             setSelectedPlan(updatedPlan);
             setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
        } catch (err) {
            console.error("Erro ao remover exercício: ", err);
            setError("Falha ao remover exercício.");
        }
    };

    return (
        <div className="admin-container">
            <button onClick={() => navigate('/dashboard')} className="btn-back-dashboard">
                &larr; Voltar ao Painel Principal
            </button>
            <header className="admin-header">
                <h1>Gerenciar Planos de Treino (Fitness)</h1>
                <p>Crie e organize os treinos para os alunos.</p>
            </header>
            {error && <p className="error-message">{error}</p>}
            
            <div className="content-section">
                <h2>1. Selecione ou Crie uma Categoria</h2>
                <form onSubmit={handleAddCategory} className="add-form">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nome da nova categoria (ex: Musculação)" />
                    <button type="submit" disabled={isSaving}>{isSaving ? '...' : <><FaPlus /> Adicionar</>}</button>
                </form>
                <div className="item-list categories">
                    {loadingCategories ? <p>Carregando...</p> : categories.map(category => (
                        <div key={category.id} className={`list-item category ${selectedCategory?.id === category.id ? 'selected' : ''}`} onClick={() => handleSelectCategory(category)}>
                            <span>{category.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }} className="delete-btn"><FaTrashAlt /></button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedCategory && (
                <div className="content-section">
                    <h2>2. Selecione ou Crie um Plano para "{selectedCategory.name}"</h2>
                    <form onSubmit={handleAddPlan} className="add-form plan-form">
                        <input type="text" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="Nome do plano (ex: Treino A)" required />
                        <input type="text" value={newPlanDescription} onChange={(e) => setNewPlanDescription(e.target.value)} placeholder="Descrição (ex: Foco em Peito e Tríceps)" />
                        <div className="checkbox-vip-container">
                            <input 
                                type="checkbox" 
                                id="isVipPlan" 
                                checked={isVipPlan} 
                                onChange={(e) => setIsVipPlan(e.target.checked)} 
                            />
                            <label htmlFor="isVipPlan">É um Plano VIP?</label>
                        </div>
                        <button type="submit" disabled={isSaving}>{isSaving ? '...' : <><FaPlus /> Adicionar Plano</>}</button>
                    </form>
                    <div className="item-list">
                        {loadingPlans ? <p>Carregando planos...</p> : plans.map(plan => (
                            <div key={plan.id} className={`list-item plan ${selectedPlan?.id === plan.id ? 'selected' : ''}`} onClick={() => handleSelectPlan(plan)}>
                                <div><span>{plan.name} {plan.is_vip && '⭐'}</span><small>{plan.description}</small></div>
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="delete-btn"><FaTrashAlt /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedPlan && (
                <div className="content-section">
                    <h2>3. Adicione Exercícios ao Plano "{selectedPlan.name}"</h2>
                    <form onSubmit={handleAddExercise} className="exercise-form">
                        <input name="name" value={newExercise.name} onChange={handleExerciseInputChange} placeholder="Nome do Exercício" required/>
                        <input name="sets" value={newExercise.sets} onChange={handleExerciseInputChange} placeholder="Séries (ex: 4)" required/>
                        <input name="reps" value={newExercise.reps} onChange={handleExerciseInputChange} placeholder="Reps (ex: 8-12)" required/>
                        <input name="rest" value={newExercise.rest} onChange={handleExerciseInputChange} placeholder="Descanso (segundos)" type="number" required/>
                        <input name="videoUrl" value={newExercise.videoUrl} onChange={handleExerciseInputChange} placeholder="URL do Vídeo/GIF (opcional)" />
                        <button type="submit"><FaPlus /> Adicionar Exercício</button>
                    </form>
                    <div className="item-list exercise-list">
                        {(selectedPlan.exercicios || []).map(exercise => (
                            <div key={exercise.id} className="list-item exercise-item">
                                <span><strong>{exercise.name}</strong> - {exercise.sets}x{exercise.reps} ({exercise.rest}s)</span>
                                <button onClick={() => handleDeleteExercise(exercise)} className="delete-btn"><FaTrashAlt /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GerenciarPlanos;