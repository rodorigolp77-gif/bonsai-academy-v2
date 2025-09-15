 import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import bonsaiLogo from '../assets/bonsai_logo.png';
import './RegisterStudent.css';
import './StudentDetails.css';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';

const generateUniqueAttendanceId = async () => {
    let newId = '';
    let isUnique = false;
    const alunosRef = collection(db, 'alunos');

    while (!isUnique) {
        newId = Math.floor(1000 + Math.random() * 9000).toString();
        const q = query(alunosRef, where('aluno_id', '==', newId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            isUnique = true;
        }
    }
    return newId;
};

const modalityOptions = [
    { value: 'jiu-jitsu-kids', label: 'Jiu Jitsu Kids' },
    { value: 'jiu-jitsu-feminino', label: 'Jiu Jitsu Feminino' },
    { value: 'jiu-jitsu-adulto', label: 'Jiu Jitsu Adulto' },
    { value: 'capoeira', label: 'Capoeira' },
    { value: 'taekwondo', label: 'Taekwondo' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'outros', label: 'Outros' }, 
];

const jiuJitsuBelts = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta', 'preta e vermelha', 'vermelha e branca', 'vermelha'];
const capoeiraBelts = ['crua', 'amarela', 'laranja', 'azul', 'verde', 'roxa', 'marrom', 'preta'];
const dueDayOptions = [1, 10, 20, 28];

function RegisterStudent() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('ativo');
    const [photoUrl, setPhotoUrl] = useState('');
    const [attendanceId, setAttendanceId] = useState('');
    const [registrationDate, setRegistrationDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [age, setAge] = useState(''); 
    const [phone1, setPhone1] = useState('');
    const [phone2, setPhone2] = useState('');
    const [receiveWhatsapp, setReceiveWhatsapp] = useState(false);
    const [receiveLine, setReceiveLine] = useState(false);
    const [instagram, setInstagram] = useState('');
    const [modality, setModality] = useState([]);
    const [otherModalityText, setOtherModalityText] = useState(''); 
    const [isProfessor, setIsProfessor] = useState(false); 
    const [dueDay, setDueDay] = useState('');
    const [monthlyFee, setMonthlyFee] = useState('');
    const [observations, setObservations] = useState('');
    
    const [graduacoes, setGraduacoes] = useState([]);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [registeredStudentData, setRegisteredStudentData] = useState(null);
    const [generatedPassword, setGeneratedPassword] = useState('');

    useEffect(() => {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setRegistrationDate(formattedDate);

        const fetchUniqueId = async () => {
            const id = await generateUniqueAttendanceId();
            setAttendanceId(id);
        };
        fetchUniqueId();
    }, []);

    useEffect(() => {
        if (birthDate) {
            const today = new Date();
            const birth = new Date(birthDate);
            let calculatedAge = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                calculatedAge--;
            }
            setAge(calculatedAge);
        } else {
            setAge('');
        }
    }, [birthDate]);

    const handleModalityChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setModality([...modality, value]);
        } else {
            setModality(modality.filter(item => item !== value));
            if (value === 'outros') { 
                setOtherModalityText('');
            }
        }
    };
    
    const handlePrint = () => {
        if (!registeredStudentData) {
            setMessage('Dados do aluno não encontrados para impressão.');
            setMessageType('error');
            return;
        }

        const data = registeredStudentData;
        const password = generatedPassword;
        
        const graduacoesFormatted = data.graduacoes.map(g => 
            `<p><strong>Modalidade / Graduação:</strong> ${g.modalidade} - ${g.graduacao} (${g.grau}º Grau)</p>`
        ).join('');

        const printContent = `
            <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #000;">
                <img src="${bonsaiLogo}" alt="Logo Bonsai Jiu Jitsu" style="width: 200px; margin-bottom: 20px;" />
                <h1 style="font-size: 24px;">生徒の登録が完了しました</h1>
                <hr />
                <div style="text-align: left; width: 80%; margin: auto;">
                    <p><strong>ID de Cadastro:</strong> ${data.aluno_id}</p>
                    <p><strong>Nome:</strong> ${data.nome}</p>
                    <p><strong>E-mail de Login:</strong> ${data.email}</p>
                    <p><strong>Senha Inicial:</strong> ${password}</p>
                    ${graduacoesFormatted}
                </div>
            </div>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const handleNewRegistration = async () => {
        setName(''); setEmail(''); setStatus('ativo'); setPhotoUrl('');
        setStartDate(''); setBirthDate(''); setAge(''); 
        setPhone1(''); setPhone2('');
        setReceiveWhatsapp(false); setReceiveLine(false); setInstagram('');
        setModality([]); setOtherModalityText(''); 
        setIsProfessor(false); 
        setDueDay(''); setMonthlyFee(''); setObservations('');
        setGraduacoes([]);
        setGeneratedPassword('');
        
        const newId = await generateUniqueAttendanceId();
        setAttendanceId(newId);

        setShowOptions(false);
        setMessage('');
        setMessageType('');
        setRegisteredStudentData(null); 
    };

    const handleGoBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleAddGraduacao = () => {
        setGraduacoes([...graduacoes, { modalidade: '', graduacao: '', grau: 0 }]);
    };

    const handleGraduacaoChange = (index, field, value) => {
        const updatedGraduacoes = [...graduacoes];
        updatedGraduacoes[index][field] = value;
        setGraduacoes(updatedGraduacoes);
    };

    const handleRemoveGraduacao = (index) => {
        const updatedGraduacoes = [...graduacoes];
        updatedGraduacoes.splice(index, 1);
        setGraduacoes(updatedGraduacoes);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setMessageType('');
        setShowOptions(false);
        setGeneratedPassword('');

        if (!name || !email) {
            setMessage("Por favor, preencha o Nome e o E-mail (obrigatórios).");
            setMessageType('error');
            setLoading(false);
            return;
        }

        try {
            const password = `bonsai${attendanceId}`;
            setGeneratedPassword(password);

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            const birthDateTimestamp = birthDate ? Timestamp.fromDate(new Date(birthDate)) : null;
            const startDateTimestamp = startDate ? Timestamp.fromDate(new Date(startDate)) : null;
            
            const today = new Date();
            const dataVencimentoCompleta = dueDay ? new Date(today.getFullYear(), today.getMonth(), parseInt(dueDay)) : null;
            const dataVencimentoTimestamp = dataVencimentoCompleta ? Timestamp.fromDate(dataVencimentoCompleta) : null;
            
            const feeAsNumber = Number(monthlyFee) || 0;

            const studentData = {
                uid: uid,
                aluno_id: attendanceId,
                nome: name,
                email,
                is_professor: isProfessor, 
                status,
                photoUrl,
                data_registro: Timestamp.fromDate(new Date(registrationDate)),
                data_inicio: startDateTimestamp,
                data_nascimento: birthDateTimestamp,
                idade: age, 
                telefone_1: phone1,
                telefone_2: phone2,
                recebe_whatsapp: receiveWhatsapp,
                recebe_line: receiveLine,
                instagram,
                modalidade: modality,
                outros_modalidade_texto: otherModalityText, 
                data_vencimento: dataVencimentoTimestamp,
                mensalidade: feeAsNumber, 
                observacoes: observations,
                graduacoes: graduacoes,
                criado_em: Timestamp.fromDate(new Date()),
                is_vip: false,
                vip_expires_at: null
            };

            await addDoc(collection(db, 'alunos'), studentData);
            
            setMessage(`Aluno cadastrado com sucesso! E-mail: ${email}, Senha: ${password}`);
            setMessageType('success');
            setRegisteredStudentData(studentData); 
            setShowOptions(true);

        } catch (error) {
            console.error("Erro geral ao cadastrar aluno:", error);
            if (error.code === 'auth/email-already-in-use') {
                setMessage(`Erro: O e-mail ${email} já está em uso por outra conta.`);
            } else {
                setMessage(`Erro ao cadastrar aluno: ${error.message}`);
            }
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <img src={bonsaiLogo} alt="Logo" className="register-logo" />
            <h2 className="register-title">Cadastrar Novo Aluno</h2>
            
            {!showOptions && (
                <form onSubmit={handleSubmit} className="details-form">
                    <div className="details-section">
                        <h3>Dados Pessoais e de Identificação</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Nome Completo *</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'white' }}>E-mail (Login) *</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Data de Nascimento</label>
                                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Idade (Automático)</label>
                                <input type="text" value={age ? `${age} anos` : ''} readOnly />
                            </div>
                            <div className="form-group full-width">
                                <label style={{ color: 'white' }}>ID Presença (Automático)</label>
                                <input type="text" value={attendanceId} readOnly />
                            </div>
                            <div className="form-group full-width">
                                <label style={{ color: 'white' }}>URL da Foto de Perfil</label>
                                <input type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="details-section">
                        <h3>Informações de Contato</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Telefone 1</label>
                                <input type="tel" value={phone1} onChange={(e) => setPhone1(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Telefone 2</label>
                                <input type="tel" value={phone2} onChange={(e) => setPhone2(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Instagram</label>
                                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                            </div>
                            <div className="form-group full-width checkbox-group">
                                <label style={{ color: 'white' }}><input type="checkbox" checked={receiveWhatsapp} onChange={(e) => setReceiveWhatsapp(e.target.checked)} /> Recebe WhatsApp?</label>
                                <label style={{ color: 'white' }}><input type="checkbox" checked={receiveLine} onChange={(e) => setReceiveLine(e.target.checked)} /> Recebe LINE?</label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="details-section">
                        <h3>Detalhes da Academia</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Data de Registro (Automático)</label>
                                <input type="date" value={registrationDate} readOnly />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Data de Início</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="form-group full-width">
                                <label style={{ color: 'white' }} className="group-label">Modalidades Praticadas</label>
                                <div className="checkbox-options">
                                    {modalityOptions.map(option => (
                                        <label key={option.value} style={{ color: 'white' }}><input type="checkbox" value={option.value} checked={modality.includes(option.value)} onChange={handleModalityChange} /> {option.label}</label>
                                    ))}
                                </div>
                                {modality.includes('outros') && (
                                    <input type="text" value={otherModalityText} onChange={(e) => setOtherModalityText(e.target.value)} placeholder="Especifique a outra modalidade" className="other-modality-input" />
                                )}
                            </div>
                            
                            <div className="form-group full-width">
                                <label style={{ color: 'white' }} className="group-label">Graduações</label>
                                {graduacoes.map((grad, index) => (
                                    <div key={index} className="graduacao-item">
                                        <select value={grad.modalidade} onChange={(e) => handleGraduacaoChange(index, 'modalidade', e.target.value)}>
                                            <option value="">Modalidade</option>
                                            <option value="Jiu Jitsu">Jiu Jitsu</option>
                                            <option value="Capoeira">Capoeira</option>
                                            <option value="Taekwondo">Taekwondo</option>
                                        </select>
                                        <select value={grad.graduacao} onChange={(e) => handleGraduacaoChange(index, 'graduacao', e.target.value)}>
                                            <option value="">Graduação</option>
                                            {grad.modalidade === 'Jiu Jitsu' && jiuJitsuBelts.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                                            {grad.modalidade === 'Capoeira' && capoeiraBelts.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                                        </select>
                                        <input type="number" placeholder="Grau" value={grad.grau} min="0" onChange={(e) => handleGraduacaoChange(index, 'grau', parseInt(e.target.value))} />
                                        <button type="button" onClick={() => handleRemoveGraduacao(index)} className="btn btn-remove-grad"><FaTrashAlt /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddGraduacao} className="btn btn-add-grad"><FaPlus /> Adicionar Graduação</button>
                            </div>
                        </div>
                    </div>

                    <div className="details-section">
                        <h3>Financeiro e Status</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Status</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="ativo">Ativo</option>
                                    <option value="inativo">Inativo</option>
                                    <option value="atrasado">Atrasado</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'white' }}>Dia de Vencimento</label>
                                <select value={dueDay} onChange={(e) => setDueDay(e.target.value)}>
                                    <option value="">Selecione o Dia</option>
                                    {dueDayOptions.map(day => <option key={day} value={day}>{day}</option>)}
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label style={{ color: 'white' }}>Valor da Mensalidade (Ienes)</label>
                                <input type="number" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} min="0" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="details-section">
                        <h3>Outras Informações</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label style={{ color: 'white' }}>Observações</label>
                                <textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows="4" />
                            </div>
                            <div className="form-group checkbox-group full-width">
                                <label style={{ color: 'white' }}><input type="checkbox" checked={isProfessor} onChange={(e) => setIsProfessor(e.target.checked)} /> É Professor?</label>
                            </div>
                        </div>
                    </div>

                    <div className="details-actions">
                        <button type="submit" disabled={loading} className="btn btn-save">
                            {loading ? 'Registrando...' : 'Registrar Aluno'}
                        </button>
                        <button type="button" onClick={handleGoBackToDashboard} className="btn btn-cancel">
                            Voltar ao Painel
                        </button>
                    </div>
                </form>
            )}

            {showOptions && (
                <div className="success-options">
                    <p className={messageType === 'success' ? 'success-message' : 'error-message'}>{message}</p>
                    <button onClick={handlePrint} className="btn btn-print"><FaPrint /> Imprimir Ficha</button>
                    <button onClick={handleNewRegistration} className="btn btn-save">Cadastrar Novo Aluno</button>
                    <button onClick={handleGoBackToDashboard} className="btn btn-cancel">Voltar ao Painel</button>
                </div>
            )}
        </div>
    );
}

export default RegisterStudent;