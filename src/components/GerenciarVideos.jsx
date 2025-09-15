import React, { useState, useEffect } from 'react';
import { db } from "../firebaseConfig";
// No topo do seu arquivo GerenciarVideos.jsx
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, orderBy, query } from 'firebase/firestore';
import './GerenciarVideos.css';

function GerenciarVideos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Estados do formulário
    const [titulo, setTitulo] = useState('');
    const [url, setUrl] = useState('');
    const [modalidade, setModalidade] = useState('jiu-jitsu');
    const [subcategoria, setSubcategoria] = useState('');
    const [accessLevel, setAccessLevel] = useState('publico'); // Novo estado para o nível de acesso

    const fetchVideos = async () => {
        setLoading(true);
        const videosCollection = collection(db, 'videoaulas');
        const q = query(videosCollection, orderBy('dataUpload', 'desc'));
        const videosSnapshot = await getDocs(q);
        setVideos(videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleAddVideo = async (e) => {
        e.preventDefault();
        setIsAdding(true);

        const videoData = {
            titulo,
            url,
            modalidade,
            subcategoria: modalidade === 'jiu-jitsu' ? subcategoria : '',
            dataUpload: serverTimestamp(),
            is_vip: false,
            is_promo: false,
            promo_expires_at: null,
        };

        // Lógica para definir o status do vídeo
        if (accessLevel === 'vip') {
            videoData.is_vip = true;
        } else if (accessLevel === 'promo') {
            videoData.is_vip = true; // Um vídeo promocional também é VIP por natureza
            videoData.is_promo = true;
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 24);
            videoData.promo_expires_at = Timestamp.fromDate(expiryDate);
        }

        try {
            await addDoc(collection(db, 'videoaulas'), videoData);
            // Limpar formulário e recarregar
            setTitulo('');
            setUrl('');
            setSubcategoria('');
            setAccessLevel('publico');
            fetchVideos();
        } catch (error) {
            console.error("Erro ao adicionar vídeo: ", error);
            alert("Ocorreu um erro ao adicionar o vídeo.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteVideo = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este vídeo?")) {
            try {
                await deleteDoc(doc(db, 'videoaulas', id));
                fetchVideos();
            } catch (error) {
                console.error("Erro ao excluir vídeo: ", error);
                alert("Ocorreu um erro ao excluir o vídeo.");
            }
        }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Gerenciar Vídeo Aulas</h1>
                <p>Adicione, edite ou remova os vídeos disponíveis para os alunos.</p>
            </header>

            <div className="content-section">
                <h2>Adicionar Novo Vídeo</h2>
                <form onSubmit={handleAddVideo} className="video-form">
                    <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título do Vídeo" required />
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL do Vídeo (YouTube)" required />
                    <select value={modalidade} onChange={e => setModalidade(e.target.value)}>
                        <option value="jiu-jitsu">Jiu-Jitsu</option>
                        <option value="capoeira">Capoeira</option>
                        <option value="taekwondo">Taekwondo</option>
                        <option value="fitness">Fitness</option>
                    </select>
                    {modalidade === 'jiu-jitsu' && (
                        <input type="text" value={subcategoria} onChange={e => setSubcategoria(e.target.value)} placeholder="Subcategoria (ex: Quedas, Passagens)" />
                    )}

                    {/* === NOVAS OPÇÕES DE ACESSO === */}
                    <div className="access-level-group">
                        <label>Nível de Acesso:</label>
                        <div>
                            <input type="radio" id="publico" name="accessLevel" value="publico" checked={accessLevel === 'publico'} onChange={e => setAccessLevel(e.target.value)} />
                            <label htmlFor="publico">Público</label>
                        </div>
                        <div>
                            <input type="radio" id="vip" name="accessLevel" value="vip" checked={accessLevel === 'vip'} onChange={e => setAccessLevel(e.target.value)} />
                            <label htmlFor="vip">VIP</label>
                        </div>
                        <div>
                            <input type="radio" id="promo" name="accessLevel" value="promo" checked={accessLevel === 'promo'} onChange={e => setAccessLevel(e.target.value)} />
                            <label htmlFor="promo">VIP (Promo 24h)</label>
                        </div>
                    </div>

                    <button type="submit" disabled={isAdding}>{isAdding ? "Adicionando..." : "Adicionar Vídeo"}</button>
                </form>
            </div>

            <div className="content-section">
                <h2>Vídeos Cadastrados</h2>
                {loading ? <p>Carregando vídeos...</p> : (
                    <ul className="item-list">
                        {videos.map(video => (
                            <li key={video.id} className="list-item">
                                <span>{video.titulo}</span>
                                <button onClick={() => handleDeleteVideo(video.id)} className="delete-btn">Excluir</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default GerenciarVideos;