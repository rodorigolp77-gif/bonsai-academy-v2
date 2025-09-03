// src/components/Receipt.jsx
import React from 'react';
import bonsaiLogo from '../assets/logorecibo.png';

// Informações estáticas da academia em japonês
const ACADEMY_INFO = {
    name: "盆栽アカデミー",
    address: "〒520-3234 滋賀県湖南市中央1丁目44-1 2階",
    website: "https://bonsaijjshiga.com/"
};

const formatDateTime = (dateObj) => {
    if (!dateObj) return 'N/A';
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return dateObj.toLocaleDateString('ja-JP', options);
};

const Receipt = ({ data }) => {
    if (!data) return null;

    return (
        <div style={receiptContainerStyle}>
            <div style={headerStyle}>
                <img src={bonsaiLogo} alt="盆栽アカデミーロゴ" style={logoStyle} />
                <h2 style={{ margin: '0', color: '#333' }}>{ACADEMY_INFO.name}</h2>
                <p style={{ margin: '5px 0 0 0', color: '#555', fontSize: '0.9em' }}>{ACADEMY_INFO.address}</p>
            </div>
            
            <hr style={dividerStyle} />

            <div style={sectionStyle}>
                <h4 style={sectionTitleStyle}>お支払い領収書</h4>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>生徒名:</span>
                    <span style={valueStyle}>{data.nome}</span>
                </div>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>ID:</span>
                    <span style={valueStyle}>{data.aluno_id}</span>
                </div>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>コース:</span>
                    <span style={valueStyle}>{data.modalidade || '指定なし'}</span>
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={sectionTitleStyle}>お支払い詳細</h4>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>参照月:</span>
                    <span style={valueStyle}>{data.mes}</span>
                </div>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>お支払い日時:</span>
                    <span style={valueStyle}>{formatDateTime(data.data_pagamento)}</span>
                </div>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>お支払い金額:</span>
                    <span style={valueStyle}>{`¥ ${data.valor_pago.toFixed(2)}`}</span>
                </div>
            </div>

            {data.observacoes && (
                <div style={sectionStyle}>
                    <h4 style={sectionTitleStyle}>備考</h4>
                    <p style={observationsTextStyle}>{data.observacoes}</p>
                </div>
            )}
            
            <div style={footerStyle}>
                <div style={stampBoxStyle}>
                    <p style={stampTextStyle}>ここにスタンプ</p>
                </div>
                <p style={{ margin: '0' }}>{ACADEMY_INFO.website}</p>
                <p style={{ margin: '0', color: '#555' }}>ありがとうございました！</p>
            </div>
        </div>
    );
};

// Estilos do Recibo
const receiptContainerStyle = {
    fontFamily: 'sans-serif',
    border: '2px solid #ccc',
    borderRadius: '10px',
    padding: '20px',
    maxWidth: '400px',
    margin: '30px auto',
    backgroundColor: '#fff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    color: '#333',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '10px',
};

const logoStyle = {
    width: '100px',
    marginBottom: '10px',
};

const dividerStyle = {
    border: '0',
    borderTop: '1px dashed #ccc',
    margin: '15px 0',
};

const sectionStyle = {
    marginBottom: '20px',
};

const sectionTitleStyle = {
    borderBottom: '2px solid #333',
    paddingBottom: '5px',
    marginBottom: '10px',
    color: '#333',
};

const infoLineStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
};

const labelStyle = {
    fontWeight: 'bold',
};

const valueStyle = {
    textAlign: 'right',
};

const observationsTextStyle = {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'left',
    fontSize: '0.9em',
    border: '1px solid #eee',
    padding: '10px',
    borderRadius: '5px',
};

const footerStyle = {
    textAlign: 'center',
    marginTop: '20px',
    borderTop: '1px solid #eee',
    paddingTop: '10px',
    color: '#555',
    fontSize: '0.9em'
};

const stampBoxStyle = {
    width: '75.6px', // aproximadamente 2cm (96dpi)
    height: '75.6px', // aproximadamente 2cm (96dpi)
    border: '2px solid #333',
    margin: '10px auto', // Centraliza o quadrado
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const stampTextStyle = {
    fontSize: '0.8em',
    color: '#888',
    textAlign: 'center',
    userSelect: 'none', // Impede a seleção do texto
};

export default Receipt;