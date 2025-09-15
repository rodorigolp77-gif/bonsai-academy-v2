 import React, { useState, useEffect } from 'react';
import { collection, query, where, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from "../firebaseConfig";
import { FaSearch, FaDollarSign } from 'react-icons/fa';

function OverdueStudents({ navigate }) { 
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [overdueStudents, setOverdueStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = Timestamp.fromDate(new Date());
        const alunosRef = collection(db, 'alunos');
        const q = query(alunosRef, where('data_vencimento', '<', today));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const overdueList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (overdueList.length > 0) {
                setOverdueStudents(overdueList);
                setShowMessageBox(true);
            } else {
                setOverdueStudents([]);
                setShowMessageBox(false);
            }
            setLoading(false);
        }, (err) => {
            console.error("Erro no listener de alunos atrasados:", err);
            setLoading(false);
        });

        // Função de limpeza para desligar o listener ao sair da página
        return () => {
            unsubscribe();
        };
    }, []);

    if (loading || overdueStudents.length === 0 || !showMessageBox) {
        return null;
    }

    return (
        <div style={messageBoxContainerStyle}>
            <h3 style={titleStyle}>Lembrete de Pagamento</h3>
            <p style={messageStyle}>
                Os seguintes alunos estão com pagamentos atrasados:
            </p>
            <ul style={listStyle}>
                {overdueStudents.map(student => (
                    <li key={student.id} style={listItemStyle}>
                        <div style={studentInfoStyle}>
                            <span style={studentNameStyle}>{student.nome}</span>
                            <span style={studentIdStyle}>ID: {student.aluno_id}</span>
                        </div>
                        <div style={buttonGroupStyle}>
                            <button onClick={() => navigate(`/student-details/${student.id}`)} style={detailsButtonStyle} title="Ver Detalhes"><FaSearch /></button>
                            <button onClick={() => navigate(`/payments/${student.id}`)} style={paymentButtonStyle} title="Fazer Pagamento"><FaDollarSign /></button>
                        </div>
                    </li>
                ))}
            </ul>
            <button onClick={() => setShowMessageBox(false)} style={closeButtonStyle}>Fechar</button>
        </div>
    );
}

// Estilos
const messageBoxContainerStyle = { position: 'fixed', top: '20px', right: '20px', width: '90%', maxWidth: '350px', padding: '20px', backgroundColor: '#333', border: '2px solid #FFD700', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)', color: 'white', zIndex: 999, fontFamily: 'sans-serif' };
const titleStyle = { color: '#FFD700', fontSize: '1.2em', marginBottom: '10px', borderBottom: '1px solid #FFD700', paddingBottom: '5px' };
const messageStyle = { fontSize: '0.9em', marginBottom: '15px' };
const listStyle = { listStyleType: 'none', padding: '0', margin: '0', maxHeight: '150px', overflowY: 'auto' };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '10px', marginBottom: '8px', borderRadius: '5px', fontSize: '0.9em' };
const studentInfoStyle = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' };
const studentNameStyle = { fontWeight: 'bold' };
const studentIdStyle = { fontSize: '0.8em', color: '#ccc', marginTop: '2px' };
const buttonGroupStyle = { display: 'flex', gap: '10px' };
const detailsButtonStyle = { padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' };
const paymentButtonStyle = { padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' };
const closeButtonStyle = { marginTop: '15px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 'bold' };

export default OverdueStudents;