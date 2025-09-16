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
    if (!data || !data.aluno || !data.pagamento) {
        return null;
    }

    const { aluno, pagamento } = data;

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
                    <span style={valueStyle}>{aluno.nome}</span>
                </div>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>ID:</span>
                    <span style={valueStyle}>{aluno.aluno_id}</span>
                </div>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>コース:</span>
                    <span style={valueStyle}>{aluno.modalidade || '指定なし'}</span>
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={sectionTitleStyle}>お支払い詳細</h4>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>参照月:</span>
                    <span style={valueStyle}>{pagamento.mes_referencia}</span>
                </div>
                <div style={infoLineStyle}>
                    <span style={labelStyle}>お支払い日時:</span>
                    <span style={valueStyle}>{formatDateTime(pagamento.data_pagamento)}</span>
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={sectionTitleStyle}>明細</h4>
                <table style={itemsTableStyle}>
                    <thead>
                        <tr>
                            <th>商品</th>
                            <th>数量</th>
                            <th>単価</th>
                            <th>小計</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagamento.itens.map((item, index) => (
                            <tr key={index}>
                                <td>{item.nome}</td>
                                <td style={{textAlign: 'center'}}>{item.quantidade}</td>
                                <td style={{textAlign: 'right'}}>{`¥ ${item.preco_unitario.toLocaleString('ja-JP')}`}</td>
                                <td style={{textAlign: 'right'}}>{`¥ ${(item.quantidade * item.preco_unitario).toLocaleString('ja-JP')}`}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" style={totalLabelStyle}>合計:</td>
                            <td style={totalValueStyle}>{`¥ ${pagamento.valor_total.toLocaleString('ja-JP')}`}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {aluno.is_vip && (
                <div style={sectionStyle}>
                    <h4 style={sectionTitleStyle}>VIP ステータス</h4>
                    <p style={vipStatusStyle}>
                        VIPステータス有効期限: {aluno.vip_expires_at?.toLocaleDateString('ja-JP') || '指定なし'}
                    </p>
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

const itemsTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
};

const totalLabelStyle = {
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: '10px',
    borderTop: '2px solid #333',
    paddingTop: '5px',
};

const totalValueStyle = {
    fontWeight: 'bold',
    textAlign: 'right',
    borderTop: '2px solid #333',
    paddingTop: '5px',
};

const vipStatusStyle = {
    backgroundColor: '#fff3cd',
    padding: '10px',
    borderRadius: '5px',
    textAlign: 'center',
    fontWeight: 'bold',
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
    width: '75.6px',
    height: '75.6px',
    border: '2px solid #333',
    margin: '10px auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const stampTextStyle = {
    fontSize: '0.8em',
    color: '#888',
    textAlign: 'center',
    userSelect: 'none',
};

export default Receipt;