import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import bonsaiLogo from '../assets/bonsai_logo.png';

const ListaAlunos = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const { filtro, valor } = useParams();

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                let studentsQuery = query(collection(db, 'alunos'), orderBy('nome'));

                if (filtro === 'faixa') {
                    studentsQuery = query(collection(db, 'alunos'), where('faixa', '==', valor), orderBy('nome'));
                } else if (filtro === 'modalidade') {
                    studentsQuery = query(collection(db, 'alunos'), where('modalidade', 'array-contains', valor), orderBy('nome'));
                } else if (filtro === 'status' && valor === 'atrasado') {
                    const now = Timestamp.fromDate(new Date());
                    studentsQuery = query(collection(db, 'alunos'), where('data_vencimento', '<', now), orderBy('nome'));
                }

                const querySnapshot = await getDocs(studentsQuery);
                const studentsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStudents(studentsList);
            } catch (error) {
                console.error("Erro ao buscar estudantes:", error);
                alert("Erro ao carregar a lista de alunos. Por favor, tente novamente.");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [filtro, valor]);

    useEffect(() => {
        const currentStudents = students.filter(student =>
            student.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStudents(currentStudents);
    }, [searchTerm, students]);

    const getStatusColor = (alunoStatus) => {
        switch (alunoStatus) {
            case 'ativo':
                return '#28a745';
            case 'inativo':
                return '#6c757d';
            case 'atrasado':
                return '#dc3545';
            default:
                return 'white';
        }
    };

    const getListItemBackground = (alunoStatus) => {
        switch (alunoStatus) {
            case 'ativo':
                return 'rgba(40, 167, 69, 0.1)';
            case 'inativo':
                return 'rgba(108, 117, 125, 0.1)';
            case 'atrasado':
                return 'rgba(220, 53, 69, 0.1)';
            default:
                return '#333';
        }
    };

    const getTitle = () => {
        if (filtro === 'faixa') return ` - Faixa ${valor.charAt(0).toUpperCase() + valor.slice(1)}`;
        if (filtro === 'modalidade') return ` - ${valor.replace(/-/g, ' ').toUpperCase()}`;
        if (filtro === 'status' && valor === 'atrasado') return ` - Pagamentos Atrasados`;
        return '';
    };

    if (loading) {
        return <div style={loadingStyle}>Carregando...</div>;
    }

    return (
        <div style={containerStyle}>
            <button onClick={() => navigate('/controle-academia')} style={backButtonStyle}>Voltar</button>
            <img src={bonsaiLogo} alt="Logo Bonsai Jiu Jitsu" style={logoStyle} />
            <h1 style={titleStyle}>
                Controle de Alunos
                {getTitle()}
            </h1>

            <div style={controlsContainerStyle}>
                <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInputStyle}
                />
            </div>

            <ul style={listStyle}>
                {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                        <li
                            key={student.id}
                            style={{
                                ...listItemStyle,
                                backgroundColor: getListItemBackground(student.status)
                            }}
                        >
                            <div style={listTextContainerStyle}>
                                <div style={listNameStyle}>{student.nome}</div>
                                <div style={listStatusStyle}>
                                    Status: <span style={{ color: getStatusColor(student.status), fontWeight: 'bold' }}>{student.status || 'N/A'}</span>
                                </div>
                            </div>
                            <div
                                style={detailsButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // CORREÇÃO: A rota estava como '/estudante', alterado para '/student-details' para corresponder ao App.jsx
                                    navigate(`/student-details/${student.id}`);
                                }}
                            >
                                Ver Detalhes
                            </div>
                        </li>
                    ))
                ) : (
                    <p style={noStudentsStyle}>Nenhum aluno encontrado.</p>
                )}
            </ul>
        </div>
    );
};



// Estilos (sem alterações)
const containerStyle = {
    padding: '20px', maxWidth: '800px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif',
    backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', position: 'relative'
};
const logoStyle = { width: '150px', marginBottom: '20px' };
const backButtonStyle = {
    position: 'absolute', top: '20px', left: '20px', padding: '10px 15px',
    backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px',
    cursor: 'pointer', zIndex: 10
};
const loadingStyle = { color: '#FFD700', textAlign: 'center', fontSize: '1.5em', marginTop: '50px' };
const titleStyle = { color: '#FFD700', textShadow: '0 0 10px #FFD700' };
const controlsContainerStyle = {
    marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px'
};
const searchInputStyle = {
    padding: '10px', borderRadius: '5px', border: '1px solid #FFD700', backgroundColor: '#333', color: 'white', fontSize: '1em'
};
const listStyle = {
    listStyleType: 'none', padding: 0
};
const listItemStyle = {
    padding: '15px', marginBottom: '10px', borderRadius: '8px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderLeft: '5px solid #FFD700', transition: 'background-color 0.3s'
};
const listTextContainerStyle = {
    textAlign: 'left'
};
const listNameStyle = {
    fontWeight: 'bold', fontSize: '1.2em', color: 'white'
};
const listStatusStyle = {
    fontSize: '0.9em', color: '#aaa', marginTop: '5px'
};
const detailsButton = {
    backgroundColor: '#FFD700', color: '#333', padding: '8px 12px', borderRadius: '5px',
    fontSize: '0.9em', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s'
};
const noStudentsStyle = {
    color: '#aaa', textAlign: 'center', marginTop: '50px'
};

export default ListaAlunos;