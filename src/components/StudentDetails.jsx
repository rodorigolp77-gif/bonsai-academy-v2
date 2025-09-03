import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import {
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    collection,
    query,
    where,
    getDocs,
    getDoc
} from 'firebase/firestore';
import { FaEdit, FaSave, FaTimes, FaTrashAlt, FaPrint, FaCreditCard, FaSearch } from 'react-icons/fa';
import bonsaiLogo from '../assets/bonsai_logo.png'; // Importa o logo para a impressão

// Opções e dados do formulário de cadastro (ATUALIZADO para incluir traduções japonesas e 'outros')
const modalityOptions = [
    { value: 'jiu-jitsu-kids', label: 'Jiu Jitsu Kids', japanese: '柔術キッズ (Jujutsu kizzu)' },
    { value: 'jiu-jitsu-feminino', label: 'Jiu Jitsu Feminino', japanese: '女性柔術 (Josei jujutsu)' },
    { value: 'jiu-jitsu-adulto', label: 'Jiu Jitsu Adulto', japanese: '柔術成人 (Jujutsu seijin)' },
    { value: 'capoeira', label: 'Capoeira', japanese: 'カポエイラ (Kapoeira)' },
    { value: 'taekwondo', label: 'Taekwondo', japanese: 'テコンドー (Tekondō)' },
    { value: 'fitness', label: 'Fitness', japanese: 'フィットネス (Fittonesu)' },
    { value: 'outros', label: 'Outros', japanese: 'その他 (Sono hoka)' }, 
];

const beltOptions = [
    'branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'
];

const dueDayOptions = [1, 10, 20, 28];

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        aluno_id: '',
        nome: '',
        data_nascimento: '',
        data_inicio: '',
        telefone_1: '',
        telefone_2: '',
        email: '',
        modalidade: [],
        outros_modalidade_texto: '', 
        data_registro: '',
        data_vencimento: '',
        recebe_whatsapp: false,
        recebe_line: false,
        instagram: '',
        faixa: '',
        grau: 0,
        status: '',
        mensalidade: '',
        observacoes: '',
        is_professor: false, 
        idade: '', 
        uid: '' 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [payments, setPayments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [attendanceFilter, setAttendanceFilter] = useState('mensal');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [receiptSearchId, setReceiptSearchId] = useState(''); 
    const [foundReceipt, setFoundReceipt] = useState(null); 

    const convertTimestampToString = (ts) => {
        if (ts instanceof Timestamp) {
            return ts.toDate().toISOString().split('T')[0];
        }
        return '';
    };

    useEffect(() => {
        const fetchStudentAndHistory = async () => {
            if (!id) {
                setError("ID do estudante não fornecido.");
                setLoading(false);
                return;
            }

            try {
                const studentDocRef = doc(db, 'alunos', id);
                const studentDoc = await getDoc(studentDocRef);

                if (studentDoc.exists()) {
                    const data = studentDoc.data();
                    
                    setFormData({
                        ...data,
                        data_nascimento: convertTimestampToString(data.data_nascimento),
                        data_inicio: convertTimestampToString(data.data_inicio),
                        data_registro: convertTimestampToString(data.data_registro),
                        data_vencimento: data.data_vencimento ? data.data_vencimento.toDate().getDate() : '',
                        is_professor: data.is_professor || false, 
                        idade: data.idade !== undefined ? data.idade : '', 
                        outros_modalidade_texto: data.outros_modalidade_texto || '', 
                        uid: data.uid || '' 
                    });

                    if (data.aluno_id) {
                        fetchPayments(data.aluno_id);
                        fetchAttendance(data.aluno_id);
                    } else {
                        console.warn("aluno_id não encontrado no documento. Histórico pode estar incompleto.");
                    }
                } else {
                    setError('Estudante não encontrado.');
                }
            } catch (err) {
                console.error("Erro ao buscar estudante:", err);
                setError('Erro ao carregar dados do estudante.');
            } finally {
                setLoading(false);
            }
        };

        const fetchPayments = async (alunoId) => {
            try {
                const paymentsRef = collection(db, 'pagamentos');
                const q = query(paymentsRef, where('aluno_id', '==', alunoId));
                const querySnapshot = await getDocs(q);
                const paymentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPayments(paymentsData.sort((a, b) => b.data_pagamento.seconds - a.data_pagamento.seconds));
            } catch (err) {
                console.error("Erro ao buscar histórico de pagamentos:", err);
            }
        };

        const fetchAttendance = async (alunoId) => {
            try {
                const attendanceRef = collection(db, 'presencas');
                const q = query(attendanceRef, where('aluno_id', '==', alunoId));
                const querySnapshot = await getDocs(q);
                const attendanceData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAttendance(attendanceData.sort((a, b) => b.data_presenca.seconds - a.data_presenca.seconds));
            } catch (err) {
                console.error("Erro ao buscar histórico de presenças:", err);
            }
        };

        fetchStudentAndHistory();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleModalityChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prevData => {
            const newModalidades = checked
                ? [...prevData.modalidade, value]
                : prevData.modalidade.filter(m => m !== value);
            
            if (!checked && value === 'outros') {
                return { ...prevData, modalidade: newModalidades, outros_modalidade_texto: '' };
            }
            return { ...prevData, modalidade: newModalidades };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);

        const convertToTimestamp = (dateString) => {
            if (!dateString) return null;
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts.map(Number);
                const dateObj = new Date(year, month - 1, day);
                return isNaN(dateObj) ? null : Timestamp.fromDate(dateObj);
            }
            return null;
        };

        const dataVencimentoTimestamp = formData.data_vencimento ?
            Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth(), parseInt(formData.data_vencimento))) : null;

        const updatedData = {
            ...formData,
            data_nascimento: convertToTimestamp(formData.data_nascimento),
            data_inicio: convertToTimestamp(formData.data_inicio),
            data_registro: convertToTimestamp(formData.data_registro),
            data_vencimento: dataVencimentoTimestamp,
            grau: parseInt(formData.grau),
            mensalidade: parseFloat(formData.mensalidade)
        };

        try {
            // Remove o UID do update se você não quiser que ele seja alterável pelo formulário
            const { uid, ...dataToUpdate } = updatedData; 
            await updateDoc(doc(db, 'alunos', id), dataToUpdate);
            setIsEditing(false);
        } catch (err) {
            console.error("Erro ao salvar estudante:", err);
            setError('Erro ao salvar dados do estudante.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteDoc(doc(db, 'alunos', id));
            navigate('/'); 
        } catch (err) {
            console.error("Erro ao excluir estudante:", err);
            setError('Erro ao excluir dados do estudante.');
        }
    };

    const handlePayment = () => {
        navigate(`/payments/${id}`);
    };

    const handleSearchReceipt = async () => { 
        if (!receiptSearchId) {
            setFoundReceipt(null);
            return;
        }
        try {
            const receiptDocRef = doc(db, 'pagamentos', receiptSearchId);
            const receiptDoc = await getDoc(receiptDocRef);
            if (receiptDoc.exists()) {
                setFoundReceipt({ id: receiptDoc.id, ...receiptDoc.data() });
            } else {
                setFoundReceipt(null);
                alert(`Recibo com ID ${receiptSearchId} não encontrado.`);
            }
        } catch (error) {
            console.error("Erro ao buscar recibo:", error);
            alert("Ocorreu um erro ao buscar o recibo.");
        }
    };

    const handlePrintReceipt = (data) => {
        const printContent = `<div style="font-family: sans-serif; padding: 20px;">
                <h1 style="text-align: center;">Recibo de Pagamento</h1>
                <p><strong>Recibo para:</strong> ${data.nome}</p>
                <p><strong>Data do Pagamento:</strong> ${formatDate(data.data_pagamento)}</p>
                <p><strong>Valor Pago:</strong> ${formatCurrency(data.valor_pago)}</p>
                <p><strong>Referente a:</strong> ${data.observacoes || 'N/A'}</p>
            </div>`;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp instanceof Timestamp ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        if (isNaN(date.getTime())) return 'N/A'; 
        return date.toLocaleDateString('ja-JP');
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return `¥${parseFloat(amount).toLocaleString('ja-JP')}`;
    };

    const filterAttendance = () => {
        const now = new Date();
        let filteredData = attendance;

        if (attendanceFilter === 'semanal') {
            const lastWeek = new Date(now.setDate(now.getDate() - 7));
            filteredData = attendance.filter(p => new Date(p.data_presenca.seconds * 1000) > lastWeek);
        } else if (attendanceFilter === 'mensal') {
            const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
            filteredData = attendance.filter(p => new Date(p.data_presenca.seconds * 1000) > lastMonth);
        } else if (attendanceFilter === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); 
            filteredData = attendance.filter(p => {
                const date = new Date(p.data_presenca.seconds * 1000);
                return date >= start && date <= end;
            });
        }
        return filteredData;
    };

    const handlePrintPayments = () => {
        const printContent = `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="text-align: center;">Histórico de Pagamentos - ${formData.nome}</h1>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; border: 1px solid #ddd;">Data</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Valor</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Método</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(p => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(p.data_pagamento)}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(p.valor)}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${p.metodo || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const handlePrintAttendance = () => {
        const filteredAttendance = filterAttendance();
        const printContent = `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="text-align: center;">Histórico de Presenças - ${formData.nome}</h1>
                <p style="text-align: center;">Filtro: ${attendanceFilter === 'semanal' ? 'Últimos 7 dias' : attendanceFilter === 'mensal' ? 'Últimos 30 dias' : 'Período Personalizado'}</p>
                <p style="text-align: center;">Total de Presenças: ${filteredAttendance.length}</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; border: 1px solid #ddd;">Data da Presença</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredAttendance.map(p => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(p.data_presenca)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    // FUNÇÃO ATUALIZADA: Imprimir detalhes completos do estudante com novo cabeçalho e otimização A4
    const handlePrintStudentDetails = () => {
        const data = formData;
        const password = `bonsai${data.aluno_id}`; // Recria a senha para impressão

        // Mapeia as modalidades selecionadas para seus nomes em japonês
        const modalitiesInJapanese = data.modalidade
            .map(m => modalityOptions.find(opt => opt.value === m)?.japanese || m)
            .join(', ');

        const printContent = `
            <div style="font-family: sans-serif; text-align: center; padding: 20px;"> <!-- Reduzido padding -->
                <img src="${bonsaiLogo}" alt="Logo Bonsai Jiu Jitsu" style="width: 150px; margin-bottom: 10px;" /> <!-- Logo menor -->
                <h1 style="font-size: 20px; margin-bottom: 20px;">BONSAI JIU JITSU ACADEMY - SHIGA</h1> <!-- Novo cabeçalho -->
                
                <hr style="border: 1px solid #ccc; width: 80%; margin: 20px auto;" /> <!-- Margem da linha reduzida -->
                <div style="text-align: left; width: 80%; margin: auto; line-height: 1.4;"> <!-- line-height reduzido -->
                    <p><strong>登録ID (Tōroku ID) / ID de Cadastro:</strong> ${data.aluno_id}</p>
                    <p><strong>氏名 (Shimei) / Nome:</strong> ${data.nome}</p>
                    <p style="background-color: #fce205; padding: 4px; border-radius: 3px; margin: 5px 0;"> <!-- Padding reduzido, margem adicionada -->
                        <strong>Eメール (E-mēru) / E-mail de Login:</strong> <span style="font-weight: bold; color: #333;">${data.email}</span>
                    </p>
                    <p style="background-color: #fce205; padding: 4px; border-radius: 3px; margin: 5px 0;"> <!-- Padding reduzido, margem adicionada -->
                        <strong>パスワード (Pasuwādo) / Senha Inicial:</strong> <span style="font-weight: bold; color: #333;">${password}</span>
                    </p>
                    <p><strong>先生 (Sensei) / Professor:</strong> ${data.is_professor ? 'はい (Hai - Sim)' : 'いいえ (Iie - Não)'}</p>
                    <p><strong>ステータス (Sutētasu) / Status:</strong> ${data.status === 'ativo' ? 'アクティブ (Akutibu)' : data.status === 'inativo' ? '非アクティブ (Hiakutibu)' : '期限切れ (Kigengire)'}</p>
                    <p><strong>登録日 (Tōroku-bi) / Data de Registro:</strong> ${formatDate(data.data_registro)}</p>
                    <p><strong>入会日 (Nyūkai-bi) / Data de Início:</strong> ${formatDate(data.data_inicio)}</p>
                    <p><strong>誕生日 (Tanjō-bi) / Data de Nascimento:</strong> ${formatDate(data.data_nascimento)}</p>
                    <p><strong>年齢 (Nenrei) / Idade:</strong> ${data.idade !== '' ? `${data.idade}歳 (${data.idade} sai)` : '未登録 (Mitoroku)'}</p>
                    <p><strong>電話番号 (Denwa bangō) / Telefone 1:</strong> ${data.telefone_1}</p>
                    <p><strong>電話番号 (Denwa bangō) / Telefone 2:</strong> ${data.telefone_2 || 'N/A'}</p>
                    <p><strong>WhatsApp受信 (WhatsApp jushin) / Receber WhatsApp:</strong> ${data.recebe_whatsapp ? 'はい (Hai - Sim)' : 'いいえ (Iie - Não)'}</p>
                    <p><strong>LINE受信 (LINE jushin) / Receber LINE:</strong> ${data.recebe_line ? 'はい (Hai - Sim)' : 'いいえ (Iie - Não)'}</p>
                    <p><strong>インスタグラム (Instagramu) / Instagram:</strong> ${data.instagram || 'N/A'}</p>
                    <p><strong>受講クラス (Jukō kurasu) / Modalidade:</strong> ${modalitiesInJapanese} ${data.outros_modalidade_texto ? `(${data.outros_modalidade_texto})` : ''}</p>
                    <p><strong>帯 (Obi) / Faixa:</strong> ${data.faixa}</p>
                    <p><strong>度 (Do) / Grau:</strong> ${data.grau}</p>
                    <p><strong>月謝日 (Gessha-bi) / Dia da Mensalidade:</strong> ${data.data_vencimento || 'N/A'}</p>
                    <p><strong>月謝額 (Gessha-gaku) / Valor da Mensalidade:</strong> ${formatCurrency(data.mensalidade)}</p>
                    <p><strong>備考 (Bikō) / Observações:</strong> ${data.observacoes || 'なし (Nashi)'}</p>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #666;"> <!-- Margem e font-size reduzidos -->
                    <p>Por favor, instrua o aluno a trocar a senha no primeiro acesso por segurança.</p>
                </div>
            </div>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };


    if (loading) return <div style={loadingStyle}>Carregando...</div>;
    if (error) return <div style={errorStyle}>{error}</div>;

    const isReadOnly = !isEditing;

    const currentAttendance = filterAttendance();

    return (
        <div style={containerStyle}>
            <div style={backButtonContainerStyle}>
                <button onClick={() => navigate(-1)} style={backButtonStyle}>
                    &larr; Voltar
                </button>
            </div>
            
            <h1 style={titleStyle}>{formData.nome}</h1>
            <h2 style={subtitleStyle}>Detalhes do Estudante</h2>
            
            <div style={formContainerStyle}>
                {/* ID Presença */}
                <label style={labelStyle}>ID Presença</label>
                <input
                    type="text"
                    name="aluno_id"
                    value={formData.aluno_id}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: '#444', cursor: 'not-allowed' }}
                />

                {/* Nome Completo */}
                <label style={labelStyle}>Nome Completo</label>
                <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />

                {/* E-mail */}
                <label style={labelStyle}>E-mail</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />
                
                {/* É Professor? */}
                <label style={labelStyle}>É Professor?</label>
                <div style={formGroupStyle}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', color: 'white' }}>
                        <label style={{ fontWeight: 'normal', color: 'white' }}>
                            <input
                                type="checkbox"
                                name="is_professor"
                                checked={formData.is_professor}
                                onChange={handleInputChange}
                                disabled={isReadOnly}
                            /> Sim
                        </label>
                    </div>
                </div>


                {/* Data de Registro */}
                <label style={labelStyle}>Data de Registro (AAAA-MM-DD)</label>
                <input
                    type="text"
                    name="data_registro"
                    value={formData.data_registro}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />

                {/* Data de Início */}
                <label style={labelStyle}>Data de Início (AAAA-MM-DD)</label>
                <input
                    type="text"
                    name="data_inicio"
                    value={formData.data_inicio}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />
                
                {/* Data de Nascimento */}
                <label style={labelStyle}>Data de Nascimento (AAAA-MM-DD)</label>
                <input
                    type="text"
                    name="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />

                {/* Idade */}
                <label style={labelStyle}>Idade</label>
                <input
                    type="text"
                    name="idade"
                    value={formData.idade !== '' ? `${formData.idade} anos` : ''}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: '#444', cursor: 'not-allowed' }}
                />
                
                {/* Telefone 1 */}
                <label style={labelStyle}>Telefone 1</label>
                <input
                    type="tel"
                    name="telefone_1"
                    value={formData.telefone_1}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />
                
                {/* Telefone 2 */}
                <label style={labelStyle}>Telefone 2</label>
                <input
                    type="tel"
                    name="telefone_2"
                    value={formData.telefone_2}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />

                {/* Checkboxes de Contato */}
                <div style={formGroupStyle}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', color: 'white' }}>
                        <label style={{ fontWeight: 'normal', color: 'white' }}>
                            <input
                                type="checkbox"
                                name="recebe_whatsapp"
                                checked={formData.recebe_whatsapp}
                                onChange={handleInputChange}
                                disabled={isReadOnly}
                            /> WhatsApp
                        </label>
                        <label style={{ fontWeight: 'normal', color: 'white' }}>
                            <input
                                type="checkbox"
                                name="recebe_line"
                                checked={formData.recebe_line}
                                onChange={handleInputChange}
                                disabled={isReadOnly}
                            /> LINE
                        </label>
                    </div>
                </div>

                {/* Instagram */}
                <label style={labelStyle}>Instagram</label>
                <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />

                {/* Modalidade (Checkboxes) */}
                <label style={labelStyle}>Modalidade</label>
                <div style={checklistStyle}>
                    {modalityOptions.map(option => (
                        <div key={option.value} style={checkboxItemStyle}>
                            <input
                                type="checkbox"
                                id={option.value}
                                value={option.value}
                                checked={formData.modalidade.includes(option.value)}
                                onChange={handleModalityChange}
                                disabled={isReadOnly}
                            />
                            <label htmlFor={option.value}>{option.label}</label>
                        </div>
                    ))}
                </div>
                {/* Campo para Outros */}
                {formData.modalidade.includes('outros') && (
                    <input
                        type="text"
                        name="outros_modalidade_texto"
                        value={formData.outros_modalidade_texto}
                        onChange={handleInputChange}
                        placeholder="Especifique a modalidade (Outros)"
                        style={isReadOnly ? { ...readOnlyInputStyle, marginTop: '5px' } : { ...inputStyle, marginTop: '5px' }}
                        readOnly={isReadOnly}
                    />
                )}

                {/* Faixa (Select) */}
                <label style={labelStyle}>Faixa</label>
                <select
                    name="faixa"
                    value={formData.faixa}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    disabled={isReadOnly}
                >
                    <option value="">Selecione a Faixa</option>
                    {beltOptions.map(option => (
                        <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
                    ))}
                </select>

                {/* Grau */}
                <label style={labelStyle}>Grau (0-4)</label>
                <input
                    type="number"
                    name="grau"
                    value={formData.grau}
                    onChange={handleInputChange}
                    min="0" max="4"
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />

                {/* Status */}
                <label style={labelStyle}>Status</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    disabled={isReadOnly}
                >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="atrasado">Atrasado</option>
                </select>

                {/* Dia de Vencimento */}
                <label style={labelStyle}>Dia de Vencimento</label>
                <select
                    name="data_vencimento"
                    value={formData.data_vencimento}
                    onChange={handleInputChange}
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    disabled={isReadOnly}
                >
                    <option value="">Selecione o Dia</option>
                    {dueDayOptions.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>

                {/* Valor da Mensalidade */}
                <label style={labelStyle}>Valor da Mensalidade (Ienes)</label>
                <input
                    type="number"
                    name="mensalidade"
                    value={formData.mensalidade}
                    onChange={handleInputChange}
                    min="0"
                    style={isReadOnly ? readOnlyInputStyle : inputStyle}
                    readOnly={isReadOnly}
                />

                {/* Observações */}
                <label style={labelStyle}>Observações</label>
                <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    rows="4"
                    style={isReadOnly ? { ...readOnlyInputStyle, height: 'auto', minHeight: '100px' } : { ...inputStyle, height: 'auto', minHeight: '100px' }}
                    readOnly={isReadOnly}
                />
            </div>
            
            <div style={buttonContainerStyle}>
                {isReadOnly ? (
                    <>
                        <button onClick={() => setIsEditing(true)} style={editButtonStyle}>
                            <FaEdit /> Editar
                        </button>
                        <button onClick={handleDelete} style={deleteButtonStyle}>
                            <FaTrashAlt /> Excluir
                        </button>
                        <button onClick={handlePrintStudentDetails} style={printButtonStyle}> 
                            <FaPrint /> Imprimir Ficha
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={handleSave} style={saveButtonStyle} disabled={isSaving}>
                            <FaSave /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <button onClick={() => { setIsEditing(false); }} style={cancelButtonStyle}>
                            <FaTimes /> Cancelar
                        </button>
                    </>
                )}
            </div>

            {isReadOnly && (
                <button 
                    onClick={handlePayment} 
                    style={payButtonStyle}
                >
                    <FaCreditCard /> Fazer Pagamento
                </button>
            )}

            <div style={historyContainerStyle}>
                <h3 style={sectionTitleStyle}>Histórico de Presença</h3>
                <div style={filterContainerStyle}>
                    <button
                        onClick={() => setAttendanceFilter('semanal')}
                        style={{ ...filterButtonStyle, backgroundColor: attendanceFilter === 'semanal' ? '#FFD700' : '#444' }}
                    >
                        Semanal
                    </button>
                    <button
                        onClick={() => setAttendanceFilter('mensal')}
                        style={{ ...filterButtonStyle, backgroundColor: attendanceFilter === 'mensal' ? '#FFD700' : '#444' }}
                    >
                        Mensal
                    </button>
                    <button
                        onClick={() => setAttendanceFilter('custom')}
                        style={{ ...filterButtonStyle, backgroundColor: attendanceFilter === 'custom' ? '#FFD700' : '#444' }}
                    >
                        Período
                    </button>
                </div>
                {attendanceFilter === 'custom' && (
                    <div style={dateRangeContainerStyle}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={dateInputStyle}
                        />
                        <span style={{ color: 'white' }}>até</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={dateInputStyle}
                        />
                    </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '10px' }}>
                    <button onClick={handlePrintAttendance} style={printButtonStyle}><FaPrint /> Imprimir Presenças</button>
                </div>

                <p style={totalCountStyle}>Total de Presenças: {currentAttendance.length}</p>

                {currentAttendance.length > 0 ? (
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>Data da Presença</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentAttendance.map(p => (
                                <tr key={p.id}>
                                    <td>{formatDate(p.data_presenca)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>Nenhuma presença encontrada para este período.</p>
                )}
            </div>

            <div style={historyContainerStyle}>
                <h3 style={sectionTitleStyle}>Histórico de Pagamento</h3>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <button onClick={handlePrintPayments} style={printButtonStyle}><FaPrint /> Imprimir Pagamentos</button>
                </div>
                {payments.length > 0 ? (
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Valor</th>
                                <th>Método</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p.id}>
                                    <td>{formatDate(p.data_pagamento)}</td>
                                    <td>{formatCurrency(p.valor)}</td>
                                    <td>{p.metodo || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>Nenhum pagamento encontrado.</p>
                )}
            </div>

            {showConfirmModal && (
                <div style={confirmModalStyle}>
                    <div style={confirmContentStyle}>
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza de que deseja excluir este estudante?</p>
                        <div style={confirmButtonsStyle}>
                            <button onClick={confirmDelete} style={confirmYesButtonStyle}>
                                Sim, Excluir
                            </button>
                            <button onClick={() => setShowConfirmModal(false)} style={confirmCancelButtonStyle}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDetails;

// Estilos (inalterados, exceto a inclusão do bonsaiLogo)
const containerStyle = {
    padding: '20px', maxWidth: '800px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif',
    border: '2px solid #FFD700', borderRadius: '15px', boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white'
};
const loadingStyle = { color: '#FFD700', textAlign: 'center', fontSize: '1.5em', marginTop: '50px' };
const errorStyle = { color: '#dc3545', textAlign: 'center', fontSize: '1.5em', marginTop: '50px' };
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700' };
const subtitleStyle = { color: 'white' };
const formContainerStyle = {
    marginTop: '20px', textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'
};
const formGroupStyle = { gridColumn: '1 / -1' };
const labelStyle = { color: '#FFD700', marginBottom: '5px' };
const inputStyle = {
    padding: '10px', borderRadius: '8px', border: '1px solid #FFD700',
    backgroundColor: '#333', color: '#FFD700', boxShadow: '0 0 5px #FFD700', boxSizing: 'border-box',
    width: '100%'
};
const readOnlyInputStyle = {
    ...inputStyle, backgroundColor: '#555', cursor: 'not-allowed', color: '#aaa'
};
const checklistStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px',
    gridColumn: '1 / -1'
};
const checkboxItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
};
const buttonContainerStyle = {
    marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap'
};
const backButtonContainerStyle = {
    width: '100%', textAlign: 'left', marginBottom: '20px'
};
const backButtonStyle = {
    backgroundColor: '#333', color: '#FFD700', border: '1px solid #FFD700', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
};
const saveButtonStyle = {
    padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
};
const cancelButtonStyle = {
    padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
};
const editButtonStyle = {
    padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
};
const deleteButtonStyle = {
    padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
};
const payButtonStyle = {
    width: '100%',
    padding: '20px',
    fontSize: '1.2em',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '15px',
    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
};
const historyContainerStyle = {
    marginTop: '30px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px #FFD700'
};
const sectionTitleStyle = { color: '#FFD700', marginBottom: '15px', textShadow: '0 0 5px #FFD700' };
const tableStyle = {
    width: '100%', borderCollapse: 'collapse', marginTop: '15px', color: 'white'
};
const tableHeaderStyle = {
    backgroundColor: '#FFD700', color: '#333', padding: '12px', textAlign: 'left', borderBottom: '2px solid #333'
};
const tableCellStyle = {
    padding: '10px', borderBottom: '1px solid #555'
};
const tableRowHoverStyle = {
    backgroundColor: 'rgba(255, 215, 0, 0.1)'
};
const filterContainerStyle = {
    display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px'
};
const filterButtonStyle = {
    padding: '8px 15px',
    border: '1px solid #FFD700',
    borderRadius: '5px',
    cursor: 'pointer',
    color: 'white'
};
const dateRangeContainerStyle = {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px'
};
const dateInputStyle = {
    padding: '8px', borderRadius: '5px', border: '1px solid #FFD700', backgroundColor: '#333', color: '#FFD700'
};
const printButtonStyle = {
    padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '10px auto'
};
const confirmModalStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const confirmContentStyle = {
    backgroundColor: '#333', padding: '30px', borderRadius: '10px', textAlign: 'center', border: '2px solid #FFD700', maxWidth: '400px', boxShadow: '0 0 15px #FFD700'
};
const confirmButtonsStyle = {
    marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px'
};
const confirmYesButtonStyle = {
    padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
};
const confirmCancelButtonStyle = {
    padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
};
const totalCountStyle = {
    fontSize: '1.2em',
    color: '#FFD700',
    marginTop: '10px',
    marginBottom: '10px',
    fontWeight: 'bold',
    textShadow: '0 0 5px rgba(255, 215, 0, 0.5)'
};
