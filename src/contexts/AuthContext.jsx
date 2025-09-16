import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                let userDocSnap = await getDoc(userDocRef);

                // Lógica de espera: se o documento não existir, aguarde e tente novamente
                let retries = 0;
                while (!userDocSnap.exists() && retries < 5) {
                    console.log(`Perfil não encontrado para o usuário: ${user.uid}. Tentativa ${retries + 1}/5. Aguardando...`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo
                    userDocSnap = await getDoc(userDocRef);
                    retries++;
                }

                if (userDocSnap.exists()) {
                    setUserRole(userDocSnap.data().role);
                } else {
                    // Se ainda assim o perfil não for encontrado, defina um erro
                    console.error(`Perfil não encontrado para o usuário: ${user.uid}. Verifique o Firestore.`);
                    setUserRole('unrecognized');
                }
            } else {
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        loading,
        // Adicione outras funções de autenticação aqui, como logout
        logout: () => auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}