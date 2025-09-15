import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, Timestamp, serverTimestamp, updateDoc } from 'firebase/firestore';
import { FaChalkboardTeacher, FaPlus, FaTrashAlt, FaCalendarAlt, FaEdit, FaArrowLeft } from 'react-icons/fa';
import Modal from 'react-modal';
import './GerenciarAulas.css';

const diasDaSemana = [
    { valor: 1, nome: 'Segunda-feira' },
    { valor: 2, nome: 'Terça-feira' },
    { valor: 3, nome: 'Quarta-feira' },
    { valor: 4, nome: 'Quinta-feira' },
    { valor: 5, nome: 'Sexta-feira' }, 
    { valor: 6, nome: 'Sábado' },
    { valor: 7, nome: 'Domingo' },
];

const customModalStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff',
        border: 'none',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000,
    }
};

Modal.setAppElement('#root');

function GerenciarAulas() {
    const navigate = useNavigate();
    const [aulas, setAulas] = useState([]);
    const [mesesCronograma, setMesesCronograma] = useState([]);
    const [tecnicasDoMes, setTecnicasDoMes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('horarios');
    const [selectedMes, setSelectedMes] = useState(null);

    // Estados para gerenciar horários
    const [modalidade, setModalidade] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [horarioInicio, setHorarioInicio] = useState('');
    const [horarioFim, setHorarioFim] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Novos estados para o cronograma de técnicas
    const [newTecnica, setNewTecnica] = useState('');
    const [newTecnicaMes, setNewTecnicaMes] = useState('');
    
    // Estados para os modais de edição e de mês
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTecnicaId, setEditTecnicaId] = useState(null);
    const [editTecnicaNome, setEditTecnicaNome] = useState('');
    
    const [isEditMesModalOpen, setIsEditMesModalOpen] = useState(false);
    const [editMesId, setEditMesId] = useState(null);
    const [editMesNome, setEditMesNome] = useState('');

    const fetchAulas = useCallback(async () => {
        setIsLoading(true);
        try {
            const aulasRef = collection(db, 'aulas');
            const q = query(aulasRef, orderBy('diaSemanaValor'), orderBy('horarioInicio'));
            const querySnapshot = await getDocs(q);
            const aulasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAulas(aulasList);
        } catch (err) {
            console.error("Erro ao buscar aulas:", err);
            setError('Não foi possível carregar as aulas.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchMesesCronograma = useCallback(async () => {
        setIsLoading(true);
        try {
            const mesesRef = collection(db, 'cronogramas');
            const q = query(mesesRef, orderBy('dataCriacao'));
            const querySnapshot = await getDocs(q);
            const mesesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMesesCronograma(mesesList);
        } catch (err) {
            console.error("Erro ao buscar meses do cronograma:", err);
            setError('Não foi possível carregar os meses.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTecnicasDoMes = useCallback(async (mesId) => {
        setIsLoading(true);
        try {
            const tecnicasRef = collection(db, 'cronogramas', mesId, 'tecnicas');
            const q = query(tecnicasRef, orderBy('dataCriacao'));
            const querySnapshot = await getDocs(q);
            const tecnicasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTecnicasDoMes(tecnicasList);
        } catch (err) {
            console.error("Erro ao buscar técnicas do mês:", err);
            setError('Não foi possível carregar as técnicas para este mês.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'horarios') {
            fetchAulas();
        } else {
            if (selectedMes) {
                fetchTecnicasDoMes(selectedMes.id);
            } else {
                fetchMesesCronograma();
            }
        }
    }, [activeTab, selectedMes, fetchAulas, fetchMesesCronograma, fetchTecnicasDoMes]);

    const handleAddAula = async (e) => {
        e.preventDefault();
        if (!modalidade || !diaSemana || !horarioInicio || !horarioFim) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        setIsSaving(true);
        const diaSelecionado = diasDaSemana.find(d => d.nome === diaSemana);
        try {
            await addDoc(collection(db, 'aulas'), {
                modalidade,
                diaSemana: diaSelecionado.nome,
                diaSemanaValor: diaSelecionado.valor,
                horarioInicio,
                horarioFim,
                dataCriacao: Timestamp.now()
            });
            setModalidade('');
            setDiaSemana('');
            setHorarioInicio('');
            setHorarioFim('');
            fetchAulas();
        } catch (err) {
            console.error("Erro ao adicionar aula:", err);
            setError('Falha ao salvar a aula.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAula = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este horário?')) {
            try {
                await deleteDoc(doc(db, 'aulas', id));
                fetchAulas();
            } catch (err) {
                console.error("Erro ao excluir aula:", err);
                setError('Falha ao excluir a aula.');
            }
        }
    };

    const handleAddMes = async (e) => {
        e.preventDefault();
        if (!newTecnicaMes) {
            alert('Por favor, digite o nome do mês.');
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'cronogramas'), {
                mes: newTecnicaMes,
                dataCriacao: serverTimestamp()
            });
            setNewTecnicaMes('');
            fetchMesesCronograma();
        } catch (err) {
            console.error("Erro ao adicionar mês:", err);
            setError('Falha ao salvar o mês.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditMes = (mes) => {
        setEditMesId(mes.id);
        setEditMesNome(mes.mes);
        setIsEditMesModalOpen(true);
    };

    const handleUpdateMes = async (e) => {
        e.preventDefault();
        if (!editMesNome) {
            alert('Por favor, preencha o campo do mês.');
            return;
        }
        setIsSaving(true);
        const mesDocRef = doc(db, 'cronogramas', editMesId);
        try {
            await updateDoc(mesDocRef, {
                mes: editMesNome,
            });
            setIsEditMesModalOpen(false);
            fetchMesesCronograma();
        } catch (err) {
            console.error("Erro ao atualizar mês:", err);
            setError('Falha ao atualizar o mês.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMes = async (mesId, mesNome) => {
        if (window.confirm(`Tem certeza que deseja excluir o cronograma de ${mesNome}? Isso apagará todas as técnicas dentro dele.`)) {
            try {
                await deleteDoc(doc(db, 'cronogramas', mesId));
                fetchMesesCronograma();
            } catch (err) {
                console.error("Erro ao excluir mês:", err);
                setError('Falha ao excluir o mês.');
            }
        }
    };
    
    const handleAddTecnica = async (e) => {
        e.preventDefault();
        if (!newTecnica) {
            alert('Por favor, digite o nome da técnica.');
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'cronogramas', selectedMes.id, 'tecnicas'), {
                tecnica: newTecnica,
                dataCriacao: serverTimestamp()
            });
            setNewTecnica('');
            fetchTecnicasDoMes(selectedMes.id);
        } catch (err) {
            console.error("Erro ao adicionar técnica:", err);
            setError('Falha ao salvar a técnica.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTecnica = async (tecnicaId) => {
        if (window.confirm('Tem certeza que deseja excluir esta técnica?')) {
            try {
                await deleteDoc(doc(db, 'cronogramas', selectedMes.id, 'tecnicas', tecnicaId));
                fetchTecnicasDoMes(selectedMes.id);
            } catch (err) {
                console.error("Erro ao excluir técnica:", err);
                setError('Falha ao excluir a técnica.');
            }
        }
    };

    const handleEditTecnica = (tecnica) => {
        setEditTecnicaId(tecnica.id);
        setEditTecnicaNome(tecnica.tecnica);
        setIsEditModalOpen(true);
    };

    const handleUpdateTecnica = async (e) => {
        e.preventDefault();
        if (!editTecnicaNome) {
            alert('Por favor, preencha o campo de técnica.');
            return;
        }
        setIsSaving(true);
        const tecnicaDocRef = doc(db, 'cronogramas', selectedMes.id, 'tecnicas', editTecnicaId);
        try {
            await updateDoc(tecnicaDocRef, {
                tecnica: editTecnicaNome,
            });
            setIsEditModalOpen(false);
            fetchTecnicasDoMes(selectedMes.id);
        } catch (err) {
            console.error("Erro ao atualizar técnica:", err);
            setError('Falha ao atualizar a técnica.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderAulas = () => (
        <>
            <div className="form-container">
                <h3 className="section-title"><FaPlus /> Adicionar Novo Horário</h3>
                <form onSubmit={handleAddAula} className="aulas-form">
                    <input type="text" placeholder="Nome da Modalidade (ex: Jiu Jitsu Adulto)" value={modalidade} onChange={(e) => setModalidade(e.target.value)} className="manager-input" required />
                    <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} className="manager-input" required>
                        <option value="">Selecione o Dia da Semana</option>
                        {diasDaSemana.map(dia => <option key={dia.valor} value={dia.nome}>{dia.nome}</option>)}
                    </select>
                    <div className="time-inputs">
                        <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} className="manager-input" required />
                        <span>até</span>
                        <input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} className="manager-input" required />
                    </div>
                    <button type="submit" className="save-button" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Horário'}</button>
                </form>
            </div>
            <div className="list-container">
                <h3 className="section-title"><FaChalkboardTeacher /> Horários Cadastrados</h3>
                {isLoading ? <p>Carregando...</p> : aulas.length === 0 ? <p>Nenhum horário cadastrado.</p> : (
                    diasDaSemana.map(dia => {
                        const aulasDoDia = aulas.filter(aula => aula.diaSemana === dia.nome);
                        if (aulasDoDia.length === 0) return null;
                        return (
                            <div key={dia.valor} className="day-schedule-admin">
                                <h4 className="day-title-admin">{dia.nome}</h4>
                                <ul className="manager-list">
                                    {aulasDoDia.map(aula => (
                                        <li key={aula.id} className="manager-list-item">
                                            <div className="item-details">
                                                <p className="item-title">{aula.modalidade}</p>
                                                <p className="item-meta">{aula.horarioInicio} - {aula.horarioFim}</p>
                                            </div>
                                            <button onClick={() => handleDeleteAula(aula.id)} className="delete-button">
                                                <FaTrashAlt />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })
                )}
            </div>
        </>
    );

    const renderCronograma = () => {
        if (!selectedMes) {
            return (
                <>
                    <div className="form-container">
                        <h3 className="section-title"><FaPlus /> Adicionar Mês</h3>
                        <form onSubmit={handleAddMes} className="aulas-form">
                            <input type="text" placeholder="Nome do Mês (ex: Setembro 2025)" value={newTecnicaMes} onChange={(e) => setNewTecnicaMes(e.target.value)} className="manager-input" required />
                            <button type="submit" className="save-button" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Mês'}</button>
                        </form>
                    </div>
                    <div className="list-container">
                        <h3 className="section-title"><FaCalendarAlt /> Meses do Cronograma</h3>
                        {isLoading ? <p>Carregando...</p> : mesesCronograma.length === 0 ? <p>Nenhum mês cadastrado.</p> : (
                            mesesCronograma.map(mes => (
                                <div key={mes.id} className="manager-list-item">
                                    <div className="item-details" onClick={() => setSelectedMes(mes)}>
                                        <p className="item-title">{mes.mes}</p>
                                    </div>
                                    <div className="action-buttons">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditMes(mes); }} className="edit-button">
                                            <FaEdit />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMes(mes.id, mes.mes); }} className="delete-button">
                                            <FaTrashAlt />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            );
        } else {
            return (
                <>
                    <div className="form-container">
                        <h3 className="section-title">
                            <button onClick={() => setSelectedMes(null)} className="back-button"><FaArrowLeft /></button>
                            <span style={{ marginLeft: '10px' }}>Técnicas de {selectedMes.mes}</span>
                        </h3>
                        <form onSubmit={handleAddTecnica} className="aulas-form">
                            <input type="text" placeholder="Nome da Técnica (ex: Arm-lock)" value={newTecnica} onChange={(e) => setNewTecnica(e.target.value)} className="manager-input" required />
                            <button type="submit" className="save-button" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Adicionar Técnica'}</button>
                        </form>
                    </div>
                    <div className="list-container">
                        <h3 className="section-title"><FaCalendarAlt /> Lista de Técnicas</h3>
                        {isLoading ? <p>Carregando...</p> : tecnicasDoMes.length === 0 ? <p>Nenhuma técnica cadastrada.</p> : (
                            tecnicasDoMes.map(tec => (
                                <div key={tec.id} className="manager-list-item">
                                    <div className="item-details">
                                        <p className="item-title">{tec.tecnica}</p>
                                    </div>
                                    <div className="action-buttons">
                                        <button onClick={() => handleEditTecnica(tec)} className="edit-button">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDeleteTecnica(tec.id)} className="delete-button">
                                            <FaTrashAlt />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} style={customModalStyles} contentLabel="Editar Técnica">
                        <div className="modal-header-edit">
                            <h3>Editar Técnica</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateTecnica} className="modal-form-edit">
                            <input type="text" value={editTecnicaNome} onChange={(e) => setEditTecnicaNome(e.target.value)} placeholder="Técnica" required />
                            <button type="submit" className="save-button" disabled={isSaving}>{isSaving ? 'Atualizando...' : 'Atualizar'}</button>
                        </form>
                    </Modal>
                </>
            );
        }
    };

    return (
        <div className="manager-container">
            <button onClick={() => navigate('/dashboard')} className="back-button">← Voltar ao Painel</button>
            <h2 className="manager-title">Gerenciar Aulas</h2>
            <div className="tab-navigation">
                <button 
                    onClick={() => setActiveTab('horarios')} 
                    className={`tab-button ${activeTab === 'horarios' ? 'active' : ''}`}
                >
                    Horários
                </button>
                <button 
                    onClick={() => setActiveTab('cronograma')} 
                    className={`tab-button ${activeTab === 'cronograma' ? 'active' : ''}`}
                >
                    Cronograma de Técnicas
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
            {activeTab === 'horarios' ? renderAulas() : renderCronograma()}
        
            {/* Modal de Edição do Mês */}
            <Modal isOpen={isEditMesModalOpen} onRequestClose={() => setIsEditMesModalOpen(false)} style={customModalStyles} contentLabel="Editar Mês">
                <div className="modal-header-edit">
                    <h3>Editar Mês</h3>
                    <button onClick={() => setIsEditMesModalOpen(false)} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleUpdateMes} className="modal-form-edit">
                    <input type="text" value={editMesNome} onChange={(e) => setEditMesNome(e.target.value)} placeholder="Nome do Mês" required />
                    <button type="submit" className="save-button" disabled={isSaving}>{isSaving ? 'Atualizando...' : 'Atualizar'}</button>
                </form>
            </Modal>
        </div>
    );
}

export default GerenciarAulas;