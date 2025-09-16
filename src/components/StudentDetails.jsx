import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import {
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    orderBy
} from 'firebase/firestore';
import { FaEdit, FaSave, FaTimes, FaTrashAlt, FaPlus, FaCreditCard, FaPrint } from 'react-icons/fa';
import bonsaiLogo from '../assets/bonsai_logo.png';
import './StudentDetails.css';

// --- Constantes do Formulário ---
const modalityOptions = [
    { value: 'jiu-jitsu-kids', label: 'Jiu Jitsu Kids' },
    { value: 'jiu-jitsu-feminino', label: 'Jiu Jitsu Feminino' },
    { value: 'jiu-jitsu-adulto', label: 'Jiu Jitsu Adulto' },
    { value: 'capoeira', label: 'Capoeira' },
    { value: 'taekwondo', label: 'Taekwondo' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'outros', label: 'Outros' },
];

const jiuJitsuBelts = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'roxa', 'marrom', 'preta'];
const capoeiraBelts = ['crua', 'amarela', 'laranja', 'azul', 'verde', 'roxa', 'marrom', 'preta'];
const dueDayOptions = [1, 10, 20, 28];

// --- Início do Componente ---
const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        aluno_id: '', nome: '', data_nascimento: '', idade: '', email: '',
        telefone_1: '', telefone_2: '', instagram: '', recebe_whatsapp: false,
        recebe_line: false, data_registro: '', data_inicio: '', modalidade: [],
        outros_modalidade_texto: '', is_professor: false,
        status: '', mensalidade: '', data_vencimento: '', observacoes: '', uid: '',
        graduacoes: [],
        photoUrl: '',
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [payments, setPayments] = useState([]);
    
    // NOVOS ESTADOS PARA O HISTÓRICO DE PRESENÇAS
    const [attendance, setAttendance] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalPresences, setTotalPresences] = useState(0);

    const calculateAge = (dateOfBirth) => {
        const today = new Date();
        const birth = new Date(dateOfBirth);
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            calculatedAge--;
        }
        return calculatedAge;
    };

    const fetchStudentData = useCallback(async () => {
        if (!id) {
            setError("ID do aluno não foi fornecido.");
            setLoading(false);
            return;
        }

        try {
            const studentDocRef = doc(db, 'alunos', id);
            const studentDoc = await getDoc(studentDocRef);

            if (studentDoc.exists()) {
                const data = studentDoc.data();
                const idadeCalculada = data.data_nascimento ? calculateAge(data.data_nascimento.toDate()) : '';

                setFormData({
                    aluno_id: data.aluno_id || '', nome: data.nome || '',
                    data_nascimento: data.data_nascimento?.toDate().toISOString().split('T')[0] || '',
                    idade: idadeCalculada,
                    email: data.email || '', telefone_1: data.telefone_1 || '',
                    telefone_2: data.telefone_2 || '', instagram: data.instagram || '',
                    recebe_whatsapp: data.recebe_whatsapp || false, recebe_line: data.recebe_line || false,
                    data_registro: data.data_registro?.toDate().toISOString().split('T')[0] || '',
                    data_inicio: data.data_inicio?.toDate().toISOString().split('T')[0] || '',
                    modalidade: data.modalidade || [], outros_modalidade_texto: data.outros_modalidade_texto || '',
                    is_professor: data.is_professor || false,
                    status: data.status || 'ativo', mensalidade: data.mensalidade || '',
                    data_vencimento: data.data_vencimento?.toDate().getDate() || '',
                    observacoes: data.observacoes || '', uid: data.uid || '',
                    graduacoes: data.graduacoes || [],
                    photoUrl: data.photoUrl || ''
                });

                fetchPayments(id);
            } else {
                setError("Dados do aluno não encontrados.");
            }
        } catch (err) {
            console.error("Erro ao buscar dados do aluno:", err);
            setError("Ocorreu um erro ao carregar os dados.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchPayments = async (alunoDocId) => {
        try {
            const q = query(
                collection(db, 'pagamentos'),
                where('aluno_uid', '==', alunoDocId),
                orderBy('data_pagamento', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const paymentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const formattedPayments = paymentsData.map(p => {
                const dataPagamento = p.data_pagamento && typeof p.data_pagamento.toDate === 'function' ? p.data_pagamento.toDate() : null;
                return {
                    ...p,
                    data_pagamento: dataPagamento
                };
            });

            setPayments(formattedPayments);
        } catch (err) {
            console.error("Erro ao buscar pagamentos:", err);
        }
    };

    const fetchAttendanceByDate = async () => {
        if (!startDate || !endDate || !id) {
            alert('Por favor, selecione as datas de início e fim.');
            return;
        }

        try {
            const presencesRef = collection(db, 'presencas');
            const startTimestamp = Timestamp.fromDate(new Date(startDate + 'T00:00:00'));
            const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));

            const q = query(
                presencesRef,
                where('aluno_uid', '==', id),
                where('data_presenca', '>=', startTimestamp),
                where('data_presenca', '<=', endTimestamp),
                orderBy('data_presenca', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const attendanceData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const formattedAttendance = attendanceData.map(a => {
                const dataPresenca = a.data_presenca && typeof a.data_presenca.toDate === 'function' ? a.data_presenca.toDate() : null;
                return {
                    ...a,
                    data_presenca: dataPresenca
                };
            });

            setAttendance(formattedAttendance);
            setTotalPresences(formattedAttendance.length);
        } catch (err) {
            console.error("Erro ao buscar presenças:", err);
        }
    };


    useEffect(() => {
        fetchStudentData();
    }, [fetchStudentData]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleModalityChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const newModalidades = checked ? [...prev.modalidade, value] : prev.modalidade.filter(m => m !== value);
            return { ...prev, modalidade: newModalidades, outros_modalidade_texto: newModalidades.includes('outros') ? prev.outros_modalidade_texto : '' };
        });
    };

    const handleAddGraduacao = () => {
        setFormData(prev => ({
            ...prev,
            graduacoes: [...prev.graduacoes, { modalidade: '', graduacao: '', grau: 0 }],
        }));
    };

    const handleGraduacaoChange = (index, field, value) => {
        const updatedGraduacoes = [...formData.graduacoes];
        updatedGraduacoes[index][field] = value;
        setFormData(prev => ({ ...prev, graduacoes: updatedGraduacoes }));
    };

    const handleRemoveGraduacao = (index) => {
        const updatedGraduacoes = [...formData.graduacoes];
        updatedGraduacoes.splice(index, 1);
        setFormData(prev => ({ ...prev, graduacoes: updatedGraduacoes }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToUpdate = {
                ...formData,
                mensalidade: Number(formData.mensalidade) || 0,
                data_nascimento: formData.data_nascimento ? Timestamp.fromDate(new Date(formData.data_nascimento)) : null,
                data_inicio: formData.data_inicio ? Timestamp.fromDate(new Date(formData.data_inicio)) : null,
                data_registro: formData.data_registro ? Timestamp.fromDate(new Date(formData.data_registro)) : null,
                data_vencimento: formData.data_vencimento ? Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth(), parseInt(formData.data_vencimento))) : null,
            };
            
            delete dataToUpdate.uid;
            delete dataToUpdate.aluno_id;
            delete dataToUpdate.idade;
            
            await updateDoc(doc(db, 'alunos', id), dataToUpdate);
            setIsEditing(false);
            fetchStudentData();
        } catch (err) {
            console.error("Erro ao salvar:", err);
            setError("Não foi possível salvar as alterações.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => setShowConfirmModal(true);

    const confirmDelete = async () => {
        try {
            await deleteDoc(doc(db, 'alunos', id));
            navigate('/lista-alunos');
        } catch (err) {
            console.error("Erro ao deletar:", err);
            setError("Não foi possível deletar o aluno.");
            setShowConfirmModal(false);
        }
    };
    
    const handlePrintRegistration = () => {
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
        };

        const password = `bonsai${formData.aluno_id}`;
        const modalidadeDisplay = formData.modalidade.length > 0 
            ? formData.modalidade.map(m => modalityOptions.find(opt => opt.value === m)?.label || m).join(', ')
            : 'Nenhuma';
        
        const graduacoesDisplay = formData.graduacoes.length > 0
            ? '<ul>' + formData.graduacoes.map(g => `<li>${g.modalidade} - ${g.graduacao} (${g.grau}º grau)</li>`).join('') + '</ul>'
            : 'Nenhuma';
        
        const printContent = `
            <html>
            <head>
                <title>Ficha Cadastral - ${formData.nome}</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; font-size: 9.5pt; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                    .print-container { width: 100%; max-width: 794px; margin: auto; padding: 25px; box-sizing: border-box; }
                    .header { display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 15px; }
                    .logo { width: 70px; height: 70px; margin-right: 15px; }
                    .academy-title h1 { margin: 0; color: #333; font-size: 18pt; }
                    .academy-title p { margin: 0; color: #555; font-size: 10pt; }
                    h2.student-name { text-align: center; margin: 18px 0; font-size: 15pt; color: #333; }
                    h3.section-title { background-color: #f2f2f2; padding: 5px 8px; margin-top: 18px; margin-bottom: 8px; border-radius: 3px; font-size: 10.5pt; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5pt; }
                    td { padding: 7px 9px; border: 1px solid #ddd; text-align: left; vertical-align: top; }
                    td:first-child { font-weight: bold; width: 30%; background-color: #f9f9f9; }
                    .highlight { background-color: #fff3cd !important; font-weight: bold; font-size: 10.5pt; }
                    p { white-space: pre-wrap; word-wrap: break-word; }
                    ul { padding-left: 20px; margin: 0; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <img src="${bonsaiLogo}" alt="Bonsai Logo" class="logo" />
                        <div class="academy-title">
                            <h1>Bonsai Jiu Jitsu Academy</h1>
                            <p>Ficha de Cadastro de Aluno / 生徒登録フォーム</p>
                        </div>
                    </div>
                    <h2 class="student-name">${formData.nome}</h2>

                    <h3 class="section-title">Dados de Acesso (App) / アプリのアクセス情報</h3>
                    <table><tbody>
                        <tr><td>E-mail (Login) / メール (ログイン)</td><td class="highlight">${formData.email || 'N/A'}</td></tr>
                        <tr><td>Senha (Padrão) / パスワード (初期)</td><td class="highlight">${password}</td></tr>
                    </tbody></table>

                    <h3 class="section-title">Dados Pessoais / 個人情報</h3>
                    <table><tbody>
                        <tr><td>ID de Presença / 出席ID</td><td>${formData.aluno_id || 'N/A'}</td></tr>
                        <tr><td>Data de Nascimento / 生年月日</td><td>${formatDate(formData.data_nascimento)}</td></tr>
                        <tr><td>Idade / 年齢</td><td>${formData.idade ? `${formData.idade} anos / 歳` : 'N/A'}</td></tr>
                    </tbody></table>
                    
                    <h3 class="section-title">Informações de Contato / 連絡先情報</h3>
                    <table><tbody>
                        <tr><td>Telefone 1 / 電話番号1</td><td>${formData.telefone_1 || 'N/A'}</td></tr>
                        <tr><td>Instagram / インスタグラム</td><td>${formData.instagram || 'N/A'}</td></tr>
                    </tbody></table>
                    
                    <h3 class="section-title">Detalhes da Academia / アカデミー詳細</h3>
                    <table><tbody>
                        <tr><td>Data de Registro / 登録日</td><td>${formatDate(formData.data_registro)}</td></tr>
                        <tr><td>Data de Início / 開始日</td><td>${formatDate(formData.data_inicio)}</td></tr>
                        <tr><td>Modalidade(s) / 種目</td><td>${modalidadeDisplay}</td></tr>
                        <tr><td>Graduação(ões) / 帯・段位</td><td>${graduacoesDisplay}</td></tr>
                        <tr><td>Mensalidade / 月謝</td><td>¥${Number(formData.mensalidade).toLocaleString('ja-JP') || 'N/A'}</td></tr>
                    </tbody></table>
                    
                    <h3 class="section-title">Observações / 備考</h3>
                    <p>${formData.observacoes || 'Nenhuma observação.'}</p>
                </div>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };


    const handlePrintPayments = () => { /* ... */ };
    const handlePrintAttendance = () => { /* ... */ };

    const handleReprintReceipt = (payment) => {
        const receiptData = {
            aluno: formData,
            pagamento: payment,
        };

        localStorage.setItem('receiptData', JSON.stringify(receiptData));
        navigate(`/receipt`);
    };

    if (loading) return <div className="details-loading">Carregando dados do aluno...</div>;
    if (error) return <div className="details-error">Erro: {error}</div>;

    const isReadOnly = !isEditing;

    return (
        <div className="details-container">
            <div className="details-header">
                <button onClick={() => navigate(-1)} className="back-button">&larr; Voltar</button>
                <h1>{isEditing ? "Editando Aluno" : "Detalhes do Aluno"}</h1>
                <p>{formData.nome}</p>
            </div>

            <form className="details-form" onSubmit={(e) => e.preventDefault()}>
                <div className="details-section">
                    <h3>Dados Pessoais e de Identificação</h3>
                    <div className="form-grid">
                        <div className="form-group full-width"><label>Nome Completo</label><input type="text" name="nome" value={formData.nome} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                        <div className="form-group"><label>Data de Nascimento</label><input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                        <div className="form-group"><label>Idade</label><input type="text" value={formData.idade ? `${formData.idade} anos` : ''} readOnly /></div>
                        <div className="form-group full-width"><label>ID de Presença (não editável)</label><input type="text" value={formData.aluno_id} readOnly /></div>
                        <div className="form-group full-width"><label>URL da Foto de Perfil</label><input type="text" name="photoUrl" value={formData.photoUrl} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                    </div>
                </div>
                <div className="details-section">
                    <h3>Informações de Contato</h3>
                    <div className="form-grid">
                        <div className="form-group"><label>E-mail</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                        <div className="form-group"><label>Instagram</label><input type="text" name="instagram" value={formData.instagram} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                        <div className="form-group"><label>Telefone 1</label><input type="tel" name="telefone_1" value={formData.telefone_1} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                        <div className="form-group"><label>Telefone 2</label><input type="tel" name="telefone_2" value={formData.telefone_2} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                        <div className="form-group checkbox-group full-width">
                            <label><input type="checkbox" name="recebe_whatsapp" checked={formData.recebe_whatsapp} onChange={handleInputChange} disabled={isReadOnly} /> Receber WhatsApp?</label>
                            <label><input type="checkbox" name="recebe_line" checked={formData.recebe_line} onChange={handleInputChange} disabled={isReadOnly} /> Receber LINE?</label>
                        </div>
                    </div>
                </div>
                <div className="details-section">
                    <h3>Detalhes da Academia</h3>
                    <div className="form-grid">
                        <div className="form-group"><label>Data de Registro</label><input type="date" name="data_registro" value={formData.data_registro} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                        <div className="form-group"><label>Data de Início</label><input type="date" name="data_inicio" value={formData.data_inicio} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                        <div className="form-group checkbox-group full-width">
                            <label className="group-label">Modalidades</label>
                            <div className="checkbox-options">{modalityOptions.map(option => (<label key={option.value}><input type="checkbox" value={option.value} checked={formData.modalidade.includes(option.value)} onChange={handleModalityChange} disabled={isReadOnly} /> {option.label}</label>))}</div>
                            {formData.modalidade.includes('outros') && (<input type="text" name="outros_modalidade_texto" value={formData.outros_modalidade_texto} onChange={handleInputChange} placeholder="Especifique a outra modalidade" readOnly={isReadOnly} className="other-modality-input" />)}
                        </div>
                        <div className="form-group full-width">
                            <label className="group-label">Graduações</label>
                            {isReadOnly && formData.graduacoes.length === 0 && (<p className="no-data">Nenhuma graduação registrada.</p>)}
                            {formData.graduacoes && formData.graduacoes.map((grad, index) => (
                                <div key={index} className="graduacao-item">
                                    <select value={grad.modalidade} onChange={(e) => handleGraduacaoChange(index, 'modalidade', e.target.value)} disabled={isReadOnly} ><option value="">Modalidade</option><option value="jiu-jitsu">Jiu Jitsu</option><option value="capoeira">Capoeira</option><option value="taekwondo">Taekwondo</option></select>
                                    <select value={grad.graduacao} onChange={(e) => handleGraduacaoChange(index, 'graduacao', e.target.value)} disabled={isReadOnly} ><option value="">Graduação</option>{grad.modalidade === 'jiu-jitsu' && jiuJitsuBelts.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}{grad.modalidade === 'capoeira' && capoeiraBelts.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}</select>
                                    <input type="number" placeholder="Grau" value={grad.grau} min="0" max="6" onChange={(e) => handleGraduacaoChange(index, 'grau', parseInt(e.target.value))} readOnly={isReadOnly} />
                                    {!isReadOnly && ( <button type="button" onClick={() => handleRemoveGraduacao(index)} className="btn btn-remove-grad"><FaTrashAlt /></button> )}
                                </div>
                            ))}
                            {!isReadOnly && ( <button type="button" onClick={handleAddGraduacao} className="btn btn-add-grad"><FaPlus /> Adicionar Graduação</button> )}
                        </div>
                    </div>
                </div>
                <div className="details-section">
                    <h3>Financeiro e Status</h3>
                    <div className="form-grid">
                        <div className="form-group"><label>Status do Aluno</label><select name="status" value={formData.status} onChange={handleInputChange} disabled={isReadOnly}><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="atrasado">Atrasado</option></select></div>
                        <div className="form-group"><label>Dia do Vencimento</label><select name="data_vencimento" value={formData.data_vencimento} onChange={handleInputChange} disabled={isReadOnly}><option value="">Selecione o Dia</option>{dueDayOptions.map(day => <option key={day} value={day}>{day}</option>)}</select></div>
                        <div className="form-group full-width"><label>Valor da Mensalidade (¥)</label><input type="number" name="mensalidade" value={formData.mensalidade} onChange={handleInputChange} readOnly={isReadOnly} /></div>
                    </div>
                </div>
                <div className="details-section">
                    <h3>Outras Informações</h3>
                    <div className="form-grid">
                        <div className="form-group full-width"><label>Observações</label><textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} readOnly={isReadOnly} rows="4" /></div>
                        <div className="form-group checkbox-group full-width"><label><input type="checkbox" name="is_professor" checked={formData.is_professor} onChange={handleInputChange} disabled={isReadOnly} /> É Professor?</label></div>
                    </div>
                </div>
            </form>
            
            <div className="details-actions">
                {isReadOnly ? (
                    <>
                        <button onClick={() => setIsEditing(true)} className="btn btn-edit"><FaEdit /> Editar</button>
                        <button onClick={handleDelete} className="btn btn-delete"><FaTrashAlt /> Excluir</button>
                        <button onClick={() => navigate(`/payments/${id}`)} className="btn btn-payment"><FaCreditCard /> Lançar Pagamento</button>
                        <button onClick={handlePrintRegistration} className="btn btn-print"><FaPrint /> Imprimir Ficha</button>
                    </>
                ) : (
                    <>
                        <button onClick={handleSave} className="btn btn-save" disabled={isSaving}><FaSave /> {isSaving ? 'Salvando...' : 'Salvar'}</button>
                        <button onClick={() => { setIsEditing(false); fetchStudentData(); }} className="btn btn-cancel"><FaTimes /> Cancelar</button>
                    </>
                )}
            </div>

            {/* HISTÓRICO DE PAGAMENTOS */}
            <div className="details-section history-section">
                <div className="history-header">
                    <h3>Histórico de Pagamentos</h3>
                    {/* Botão de imprimir pagamentos removido */}
                </div>
                <div className="payment-history-scroll"> {/* Contêiner com barra de rolagem */}
                    {payments.length > 0 ? (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Método</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.data_pagamento?.toLocaleDateString('pt-BR') || 'N/A'}</td>
                                        <td>¥{p.valor_total?.toLocaleString('ja-JP') || 'N/A'}</td>
                                        <td>{p.metodo_pagamento || 'N/A'}</td>
                                        <td>
                                            <button onClick={() => handleReprintReceipt(p)} className="btn btn-reprint"><FaPrint /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : ( <p>Nenhum histórico de pagamento encontrado.</p> )}
                </div>
            </div>

            {/* HISTÓRICO DE PRESENÇAS */}
            <div className="details-section history-section">
                <div className="history-header">
                    <h3>Histórico de Presenças</h3>
                    <button onClick={handlePrintAttendance} className="btn btn-print"><FaPrint /> Imprimir Presenças</button>
                </div>
                <div className="presence-search-bar">
                    <span>De:</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span>Até:</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <button onClick={fetchAttendanceByDate}>Pesquisar</button>
                </div>
                {attendance.length > 0 && (
                    <div className="total-presences">
                        Total de presenças no período: <strong>{totalPresences}</strong>
                    </div>
                )}
                <div className="presence-history-scroll"> {/* Contêiner com barra de rolagem */}
                    {attendance.length > 0 ? (
                        <table className="history-table">
                            <thead><tr><th>Data</th></tr></thead>
                            <tbody>
                                {attendance.map(a => (
                                    <tr key={a.id}>
                                        <td>{a.data_presenca?.toLocaleDateString('pt-BR') || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : ( <p>Nenhum histórico de presença encontrado para o período.</p> )}
                </div>
            </div>

            {showConfirmModal && (
                <div className="details-modal-overlay">
                    <div className="details-modal-content">
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir permanentemente o aluno **{formData.nome}**?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-delete">Sim, Excluir</button>
                            <button onClick={() => setShowConfirmModal(false)} className="btn btn-cancel">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDetails;