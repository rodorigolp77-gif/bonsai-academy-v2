import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Importação corrigida
import { collection, getDocs } from 'firebase/firestore';

const GerenciarFitness = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Exemplo: buscar dados de um banco de dados
        const fetchData = async () => {
            try {
                // Lógica de busca de dados de fitness do Firebase
                const querySnapshot = await getDocs(collection(db, "fitness-data"));
                const fetchedData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setData(fetchedData);
            } catch (e) {
                console.error("Erro ao buscar dados de fitness:", e);
                setError("Não foi possível carregar os dados.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-4">Gerenciar Fitness</h1>
            <p className="text-gray-600">Esta é a página para gerenciar exercícios, treinos, etc.</p>
            
            {/* Aqui você pode adicionar o seu código para exibir os dados */}
            {data.length > 0 ? (
                <ul>
                    {data.map(item => (
                        <li key={item.id}>{item.nome}</li> // Exemplo de exibição
                    ))}
                </ul>
            ) : (
                <p>Nenhum dado de fitness encontrado.</p>
            )}
        </div>
    );
};

export default GerenciarFitness;