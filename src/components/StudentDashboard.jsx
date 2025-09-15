import React, { useState, useEffect } from 'react';
import { auth } from "../firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import './StudentDashboard.css'; // Verifique se este arquivo CSS existe nesta pasta

// Recebe 'user' como uma "prop" (propriedade) vinda do App.jsx
const StudentDashboard = ({ user }) => {
    // Estado para guardar dados da coleção 'alunos' (graduação, etc.)
    const [studentData, setStudentData] = useState(null); 
    
    // Estado para guardar dados da coleção 'users' (nome, etc.)
    const [userData, setUserData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
 
    useEffect(() => {
        const fetchAllData = async () => {
            // Usa a prop 'user' diretamente, sem precisar chamar auth.currentUser
            if (user) {
                try {
                    // Busca 1: Dados do perfil na coleção 'users'
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setUserData(userDocSnap.data());
                    }

                    // Busca 2: Dados específicos na coleção 'alunos'
                    const studentDocRef = doc(db, 'alunos', user.uid);
                    const studentDocSnap = await getDoc(studentDocRef);

                    if (studentDocSnap.exists()) {
                        setStudentData(studentDocSnap.data());
                    } else {
                        setError("Não foi possível encontrar seus dados de aluno. Verifique se o cadastro foi finalizado.");
                    }
                } catch (err) {
                    console.error("Erro ao buscar dados:", err);
                    setError("Ocorreu um erro ao carregar suas informações.");
                }
            }
            setLoading(false);
        };

        fetchAllData();
    }, [user]); // Adicionamos [user] para que o useEffect rode de novo se o usuário mudar

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    if (loading) {
        return <div className="loading-screen">Carregando seu painel...</div>;
    }

    if (error) {
        return <div className="error-screen">{error}</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                {userData ? (
                    <h1>Bem-vindo(a), {userData.nome}!</h1>
                ) : (
                    <h1>Painel do Aluno</h1>
                )}
                <button onClick={handleLogout} className="logout-button">Sair</button>
            </header>

            <main className="dashboard-content">
                {studentData ? (
                    <div>
                        <h2>Suas Informações</h2>
                        <p><strong>Graduação:</strong> {studentData.graduacao}</p>
                        <p><strong>Plano Ativo:</strong> {studentData.planoAtivo ? 'Sim' : 'Não'}</p>
                        {/* Adicione outras seções do dashboard aqui */}
                    </div>
                ) : (
                    <p>Não há dados de aluno para exibir.</p>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;