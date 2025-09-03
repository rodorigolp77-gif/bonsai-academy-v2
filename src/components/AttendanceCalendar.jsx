// src/components/AttendanceCalendar.jsx

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Estilo padrão do calendário
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import bonsaiLogo from '../assets/bonsai_logo.png'; // Importa o logo

const AttendanceCalendar = ({ student }) => {
    const [attendanceDates, setAttendanceDates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!student || !student.aluno_id) {
                setIsLoading(false);
                return;
            }

            try {
                // Busca na coleção 'presencas' pelo ID do aluno
                const q = query(collection(db, 'presencas'), where('aluno_id', '==', student.aluno_id));
                const querySnapshot = await getDocs(q);
                
                const dates = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Converte o Timestamp do Firestore para um objeto Date do JavaScript
                    if (data.data_presenca instanceof Timestamp) {
                        return data.data_presenca.toDate();
                    }
                    return null;
                }).filter(date => date !== null); // Filtra qualquer entrada nula

                setAttendanceDates(dates);
            } catch (error) {
                console.error("Erro ao buscar presenças:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendance();
    }, [student]); // Executa sempre que os dados do 'student' mudarem

    // Função para adicionar uma classe CSS nos dias com presença
    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            // Verifica se a data do calendário está na lista de presenças
            const isAttended = attendanceDates.some(
                (attendanceDate) =>
                    date.getFullYear() === attendanceDate.getFullYear() &&
                    date.getMonth() === attendanceDate.getMonth() &&
                    date.getDate() === attendanceDate.getDate()
            );
            if (isAttended) {
                // ADICIONADO: 'has-bonsai-logo' para aplicar o logo via CSS
                return 'attended-day has-bonsai-logo'; 
            }
        }
        return null;
    };
    
    if (isLoading) {
        return <p>Carregando calendário de treinos...</p>;
    }

    return (
        <div className="calendar-container">
            <h3 style={{ color: '#FFD700', marginBottom: '15px' }}>Seus Treinos</h3>
            <Calendar
                tileClassName={tileClassName}
                locale="pt-BR" // Define o idioma para português
            />
            <style>
                {`
                    /* Estilização do container do calendário */
                    .calendar-container {
                        margin-top: 30px;
                        border-radius: 10px;
                        padding: 20px;
                        background-color: rgba(0, 0, 0, 0.3);
                    }
                    /* Estilização geral do calendário */
                    .react-calendar {
                        width: 100%;
                        border: 1px solid #FFD700;
                        background-color: #2c2c2c;
                        border-radius: 8px;
                        color: white;
                    }
                    /* ADICIONADO: `position: relative` para permitir posicionamento absoluto de pseudo-elementos */
                    .react-calendar__tile {
                        color: white;
                        position: relative; 
                    }
                    .react-calendar__tile:enabled:hover,
                    .react-calendar__tile:enabled:focus {
                        background-color: #444;
                    }
                    .react-calendar__navigation button {
                        color: #FFD700;
                        font-weight: bold;
                    }
                    .react-calendar__month-view__weekdays__weekday {
                        color: #FFD700;
                        text-decoration: none;
                        font-size: 0.8em;
                    }
                    .react-calendar__tile--now {
                        background: #4a4a4a; /* Cor para o dia de hoje */
                    }
                    /* ESTILO PARA O DIA COM PRESENÇA */
                    .attended-day {
                        background-color: #FFD700 !important;
                        color: black !important;
                        border-radius: 50%;
                        font-weight: bold;
                    }
                    /* NOVO ESTILO: Para adicionar o logo como pseudo-elemento */
                    .has-bonsai-logo::after {
                        content: ''; /* Necessário para pseudo-elementos */
                        display: block;
                        position: absolute;
                        bottom: 2px; /* Ajuste a posição vertical conforme necessário */
                        right: 2px; /* Ajuste a posição horizontal conforme necessário */
                        width: 18px; /* Tamanho do logo */
                        height: 18px; /* Tamanho do logo */
                        background-image: url(${bonsaiLogo}); /* Usa o logo importado */
                        background-size: contain; /* Redimensiona a imagem para caber */
                        background-repeat: no-repeat;
                        background-position: center;
                        opacity: 0.9; /* Torna o logo ligeiramente transparente */
                        z-index: 1; /* Garante que o logo esteja acima de outros elementos se houver */
                    }
                `}
            </style>
        </div>
    );
};

export default AttendanceCalendar;
