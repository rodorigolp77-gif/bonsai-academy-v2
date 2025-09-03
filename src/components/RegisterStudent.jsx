// src/components/RegisterStudent.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig'; // ADICIONADO: import 'auth'
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // ADICIONADO: import para criar usuário
import { useNavigate } from 'react-router-dom';
import bonsaiLogo from '../assets/bonsai_logo.png';

// Função para gerar e verificar se um ID de 4 dígitos é único no Firestore
const generateUniqueAttendanceId = async () => {
    let newId = '';
    let isUnique = false;
    const alunosRef = collection(db, 'alunos');

    while (!isUnique) {
        newId = Math.floor(1000 + Math.random() * 9000); // Gera um número de 4 dígitos
        const q = query(alunosRef, where('aluno_id', '==', newId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            isUnique = true;
        }
    }
    return newId;
};

function RegisterStudent() {
    const navigate = useNavigate();

    // Estados para os campos do formulário
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
    const [belt, setBelt] = useState('');
    const [degree, setDegree] = useState(0);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    // ESTADO ATUALIZADO: Armazena os dados do aluno para impressão
    const [registeredStudentData, setRegisteredStudentData] = useState(null);
    const [generatedPassword, setGeneratedPassword] = useState(''); // NOVO: Para exibir a senha gerada

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
    
    // FUNÇÃO ATUALIZADA: Agora inclui os dados do aluno na impressão
    const handlePrint = () => {
        if (!registeredStudentData) {
            setMessage('Dados do aluno não encontrados para impressão.');
            setMessageType('error');
            return;
        }

        const data = registeredStudentData;
        
        // Mapeia as modalidades selecionadas para seus nomes em japonês
        const modalitiesInJapanese = data.modalidade
            .map(m => modalityOptions.find(opt => opt.value === m)?.japanese || m)
            .join(', ');

        const printContent = `
            <div style="font-family: sans-serif; text-align: center; padding: 40px;">
                <img src="${bonsaiLogo}" alt="Logo Bonsai Jiu Jitsu" style="width: 200px; margin-bottom: 20px;" />
                <h1 style="font-size: 24px;">生徒の登録が完了しました (Seito no tōroku ga kanryō shimashita)</h1>
                <p style="font-size: 18px; margin-top: 20px;">
                    520-3234<br/>
                    日本 滋賀県 湖南市 中央 1丁目 44-1 2階
                </p>
                <hr style="border: 1px solid #ccc; width: 80%; margin: 30px auto;" />
                <div style="text-align: left; width: 80%; margin: auto;">
                    <p><strong>登録ID (Tōroku ID) / ID de Cadastro:</strong> ${data.aluno_id}</p>
                    <p><strong>氏名 (Shimei) / Nome:</strong> ${data.nome}</p>
                    <p><strong>Eメール (E-mēru) / E-mail de Login:</strong> ${data.email}</p>
                    <p><strong>パスワード (Pasuwādo) / Senha Inicial:</strong> ${generatedPassword}</p> <!-- NOVO: Senha inicial -->
                    <p><strong>先生 (Sensei) / Professor:</strong> ${data.is_professor ? 'はい (Hai - Sim)' : 'いいえ (Iie - Não)'}</p>
                    <p><strong>ステータス (Sutētasu) / Status:</strong> ${data.status === 'ativo' ? 'アクティブ (Akutibu)' : data.status === 'inativo' ? '非アクティブ (Hiakutibu)' : '期限切れ (Kigengire)'}</p>
                    <p><strong>登録日 (Tōroku-bi) / Data de Registro:</strong> ${new Date(data.data_registro.seconds * 1000).toLocaleDateString('ja-JP')}</p>
                    <p><strong>入会日 (Nyūkai-bi) / Data de Início:</strong> ${data.data_inicio ? new Date(data.data_inicio.seconds * 1000).toLocaleDateString('ja-JP') : '未登録 (Mitoroku)'}</p>
                    <p><strong>誕生日 (Tanjō-bi) / Data de Nascimento:</strong> ${data.data_nascimento ? new Date(data.data_nascimento.seconds * 1000).toLocaleDateString('ja-JP') : '未登録 (Mitoroku)'}</p>
                    <p><strong>年齢 (Nenrei) / Idade:</strong> ${data.idade !== '' ? `${data.idade}歳 (${data.idade} sai)` : '未登録 (Mitoroku)'}</p>
                    <p><strong>電話番号 (Denwa bangō) / Telefone:</strong> ${data.telefone_1} ${data.telefone_2 ? ', ' + data.telefone_2 : ''}</p>
                    <p><strong>WhatsApp受信 (WhatsApp jushin) / Receber WhatsApp:</strong> ${data.recebe_whatsapp ? 'はい (Hai - Sim)' : 'いいえ (Iie - Não)'}</p>
                    <p><strong>LINE受信 (LINE jushin) / Receber LINE:</strong> ${data.recebe_line ? 'はい (Hai - Sim)' : 'いいえ (Iie - Não)'}</p>
                    <p><strong>受講クラス (Jukō kurasu) / Modalidade:</strong> ${modalitiesInJapanese} ${data.outros_modalidade_texto ? `(${data.outros_modalidade_texto})` : ''}</p>
                    <p><strong>帯 (Obi) / Faixa:</strong> ${data.faixa}</p>
                    <p><strong>月謝日 (Gessha-bi) / Dia da Mensalidade:</strong> ${new Date(data.data_vencimento.seconds * 1000).getDate()}</p>
                    <p><strong>月謝額 (Gessha-gaku) / Valor da Mensalidade:</strong> ¥${data.mensalidade.toFixed(2)}</p>
                    <p><strong>備考 (Bikō) / Observações:</strong> ${data.observacoes || 'なし (Nashi)'}</p>
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
        setBelt(''); setDegree(0);
        setGeneratedPassword(''); // NOVO: Limpa a senha gerada
        
        const newId = await generateUniqueAttendanceId();
        setAttendanceId(newId);

        setShowOptions(false);
        setMessage('');
        setMessageType('');
        setRegisteredStudentData(null); 
    };

    const handleGoBack = () => {
        navigate('/dashboard');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setMessageType('');
        setShowOptions(false);
        setGeneratedPassword(''); // Limpa a senha anterior ao tentar novo registro

        // Validações
        if (!name || !email || modality.length === 0 || !monthlyFee || !belt || !dueDay) {
            setMessage("Por favor, preencha todos os campos obrigatórios (Nome, E-mail, Modalidade, Mensalidade, Faixa, Dia de Vencimento).");
            setMessageType('error');
            setLoading(false);
            return;
        }

        if (modality.includes('outros') && !otherModalityText.trim()) {
            setMessage("Por favor, especifique a modalidade 'Outros'.");
            setMessageType('error');
            setLoading(false);
            return;
        }

        try {
            // 1. Criar usuário no Firebase Authentication
            const password = `bonsai${attendanceId}`; // Gerando a senha
            setGeneratedPassword(password); // Armazena para exibição

            let userCredential;
            try {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (authError) {
                // Tratar erros específicos do Firebase Auth
                if (authError.code === 'auth/email-already-in-use') {
                    setMessage(`Erro de autenticação: O e-mail ${email} já está em uso por outra conta.`);
                } else {
                    setMessage(`Erro ao criar conta de login: ${authError.message}`);
                }
                setMessageType('error');
                setLoading(false);
                return; // Impede que o registro no Firestore continue
            }

            const uid = userCredential.user.uid; // O UID do usuário recém-criado

            const birthDateTimestamp = birthDate ? Timestamp.fromDate(new Date(birthDate)) : null;
            const startDateTimestamp = startDate ? Timestamp.fromDate(new Date(startDate)) : null;
            
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const dataVencimentoCompleta = new Date(year, month, parseInt(dueDay));
            const dataVencimentoTimestamp = Timestamp.fromDate(dataVencimentoCompleta);

            // Objeto com os dados do aluno a serem salvos
            const studentData = {
                uid: uid, // NOVO: Adiciona o UID do Firebase Authentication
                aluno_id: attendanceId,
                nome: name,
                email,
                is_professor: isProfessor, 
                status,
                foto_url: photoUrl,
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
                mensalidade: parseFloat(monthlyFee),
                observacoes: observations,
                faixa: belt,
                grau: parseInt(degree),
                criado_em: new Date(),
            };

            // 2. Salvar dados do aluno no Firestore
            await addDoc(collection(db, 'alunos'), studentData);
            
            setMessage(`生徒の登録が完了しました (Seito no tōroku ga kanryō shimashita) - Login criado com sucesso! E-mail: ${email}, Senha: ${password}`);
            setMessageType('success');
            
            setRegisteredStudentData(studentData); 
            setShowOptions(true);

        } catch (error) {
            console.error("Erro geral ao cadastrar aluno:", error);
            // Captura erros que não foram tratados pelo authError.code
            if (!message) { // Evita sobrescrever mensagens de erro de autenticação
                setMessage(`Erro ao cadastrar aluno: ${error.message}`);
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={{ width: '150px', marginBottom: '10px' }} />
            <h2 style={{ color: '#FFD700', textShadow: '0 0 10px #FFD700', margin: '0 0 20px' }}>
                BONSAI JIU JITSU ACADEMY<br />
                ボンサイ柔術アカデミー
            </h2>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>Cadastrar Novo Aluno</h3>

            <form onSubmit={handleSubmit} style={formStyle}>
                
                <label style={labelStyle}>ID Presença (Automático)</label>
                <input
                    type="number"
                    value={attendanceId}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: '#444', cursor: 'not-allowed' }}
                />

                <label style={labelStyle}>Nome Completo *</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={inputStyle}
                />
                
                <label style={labelStyle}>E-mail (Será o login do aluno) *</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                />

                <label style={labelStyle}>URL da Foto de Perfil</label>
                <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    style={inputStyle}
                />

                <label style={labelStyle}>É Professor?</label>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', color: '#FFD700' }}>
                    <label style={{ fontWeight: 'normal', color: 'white' }}>
                        <input type="checkbox" checked={isProfessor} onChange={(e) => setIsProfessor(e.target.checked)} /> Sim
                    </label>
                </div>
                
                <label style={labelStyle}>Data de Cadastro (Atual)</label>
                <input
                    type="date"
                    value={registrationDate}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: '#444', cursor: 'not-allowed' }}
                />
                
                <label style={labelStyle}>Data de Início</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={inputStyle}
                />
                
                <label style={labelStyle}>Data de Nascimento</label>
                <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    style={inputStyle}
                />

                <label style={labelStyle}>Idade (Automático)</label>
                <input
                    type="text"
                    value={age !== '' ? `${age} anos` : ''}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: '#444', cursor: 'not-allowed' }}
                />
                
                <label style={labelStyle}>Telefone 1</label>
                <input
                    type="tel"
                    value={phone1}
                    onChange={(e) => setPhone1(e.target.value)}
                    style={inputStyle}
                />
                
                <label style={labelStyle}>Telefone 2</label>
                <input
                    type="tel"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    style={inputStyle}
                />

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', color: '#FFD700' }}>
                    <label style={{ fontWeight: 'normal', color: 'white' }}>
                        <input type="checkbox" checked={receiveWhatsapp} onChange={(e) => setReceiveWhatsapp(e.target.checked)} /> WhatsApp
                    </label>
                    <label style={{ fontWeight: 'normal', color: 'white' }}>
                        <input type="checkbox" checked={receiveLine} onChange={(e) => setReceiveLine(e.target.checked)} /> LINE
                    </label>
                </div>

                <label style={labelStyle}>Instagram</label>
                <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    style={inputStyle}
                />
                
                <label style={labelStyle}>Modalidade *</label>
                <div style={checklistStyle}>
                    {modalityOptions.map(option => (
                        <div key={option.value} style={checkboxItemStyle}>
                            <input
                                type="checkbox"
                                id={option.value}
                                value={option.value}
                                checked={modality.includes(option.value)}
                                onChange={handleModalityChange}
                            />
                            <label htmlFor={option.value}>{option.label}</label>
                        </div>
                    ))}
                </div>
                {modality.includes('outros') && (
                    <input
                        type="text"
                        value={otherModalityText}
                        onChange={(e) => setOtherModalityText(e.target.value)}
                        placeholder="Especifique a modalidade (Outros)"
                        style={{...inputStyle, marginTop: '5px'}}
                        required={modality.includes('outros')} 
                    />
                )}

                <label style={labelStyle}>Faixa *</label>
                <select value={belt} onChange={(e) => setBelt(e.target.value)} required style={selectStyle}>
                    <option value="">Selecione a Faixa</option>
                    {beltOptions.map(option => (
                        <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
                    ))}
                </select>
                
                <label style={labelStyle}>Grau (0-4)</label>
                <input
                    type="number"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    min="0" max="4"
                    style={inputStyle}
                />
                
                <label style={labelStyle}>Status *</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} required style={selectStyle}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="atrasado">Atrasado</option>
                </select>

                <label style={labelStyle}>Dia de Vencimento *</label>
                <select value={dueDay} onChange={(e) => setDueDay(e.target.value)} required style={selectStyle}>
                    <option value="">Selecione o Dia</option>
                    {dueDayOptions.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
                
                <label style={labelStyle}>Valor da Mensalidade (Ienes) *</label>
                <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    required
                    min="0"
                    style={inputStyle}
                />

                <label style={labelStyle}>Observações</label>
                <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows="4"
                    style={{ ...inputStyle, height: 'auto', minHeight: '100px' }}
                />

                <button type="submit" disabled={loading} style={buttonStyle}>
                    {loading ? 'Registrando...' : 'Registrar'}
                </button>
            </form>

            {message && (
                <p style={{ color: messageType === 'success' ? '#28a745' : '#dc3545', marginTop: '15px' }}>
                    {message}
                </p>
            )}
            {generatedPassword && messageType === 'success' && (
                <p style={{ color: 'white', marginTop: '10px', fontSize: '1.1em' }}>
                    **Atenção: Senha inicial do aluno: <span style={{color: '#FFD700', fontWeight: 'bold'}}>{generatedPassword}</span>**
                </p>
            )}

            {showOptions && (
                <div style={optionsContainerStyle}>
                    <button onClick={handlePrint} style={{ ...buttonStyle, backgroundColor: '#17a2b8', boxShadow: '0 0 15px #17a2b8' }}>
                        印刷する (Imprimir)
                    </button>
                    <button onClick={handleNewRegistration} style={{ ...buttonStyle, backgroundColor: '#ffc107', boxShadow: '0 0 15px #ffc107' }}>
                        新規登録 (Novo Cadastro)
                    </button>
                    <button onClick={handleGoBack} style={{ ...buttonStyle, backgroundColor: '#6c757d', boxShadow: '0 0 15px #6c757d' }}>
                        中央パネルに戻る (Voltar para o Painel Central)
                    </button>
                </div>
            )}
        </div>
    );
}

// ESTILOS (inalterados)
const containerStyle = {
    padding: '20px',
    maxWidth: '500px',
    margin: 'auto',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    boxShadow: '0 0 20px #FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white'
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'flex-start',
    width: '100%'
};

const baseStyle = {
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
    marginBottom: '10px',
    backgroundColor: '#333',
    color: 'white',
    border: '1px solid #FFD700',
    borderRadius: '4px',
    boxShadow: '0 0 5px #FFD700',
};

const inputStyle = {
    ...baseStyle,
    color: '#FFD700',
};

const checklistStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    border: '1px solid #FFD700',
};

const checkboxItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '5px',
};

const selectStyle = {
    ...baseStyle,
    color: '#FFD700',
};

const labelStyle = {
    width: '100%',
    textAlign: 'left',
    color: '#FFD700',
    marginBottom: '-5px',
    fontSize: '0.9em',
};

const buttonStyle = {
    width: '100%',
    padding: '15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.2em',
    marginTop: '20px',
    boxShadow: '0 0 15px #28a745',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
};

const optionsContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '20px',
    width: '100%',
    textAlign: 'center',
};

export default RegisterStudent;
