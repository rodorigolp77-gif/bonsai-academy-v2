import React from 'react';
import './DigitalKeypadVault.css'; // O novo CSS para este componente

const DigitalKeypadVault = ({ alunoId, setAlunoId, onCheckin, onAdminAccess }) => {
  const handleNumberClick = (number) => {
    if (alunoId.length < 4) { // ID deve ter 4 dígitos
      setAlunoId(alunoId + number);
    }
  };

  const handleDelete = () => {
    setAlunoId(alunoId.slice(0, -1));
  };

  const handleClear = () => {
    setAlunoId('');
  };

  const handleConfirm = () => {
    onCheckin(); // Chama a função de check-in do componente pai
  };

  // Matriz de botões para o layout do cofre
  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['X', '0', '+'], // X para limpar, + para check-in
  ];

  return (
    <>
      <div className="vault-screen-frame">
        <div className="vault-screen-top-light"></div>
        <div className="vault-screen-content">
          {/* O display do ID ficará aqui */}
          <input
            type="password"
            value={alunoId}
            readOnly
            placeholder="ID"
            className="vault-screen-input"
          />
        </div>
      </div>

      <div className="vault-keypad-grid">
        {buttons.map((row, rowIndex) => (
          <div className="keypad-row" key={rowIndex}>
            {row.map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'X') handleClear();
                  else if (btn === '+') handleConfirm();
                  else handleNumberClick(btn);
                }}
                className={`keypad-button ${!isNaN(btn) ? 'num' : 'fn'} 
                            ${btn === 'X' ? 'red' : ''} 
                            ${btn === '+' ? 'green' : ''}`}
              >
                {btn}
              </button>
            ))}
          </div>
        ))}
        {/* Adicionei o botão de DELETE e um de ADMIN separadamente para o layout */}
        <div className="keypad-row full-width">
          <button onClick={handleDelete} className="keypad-button enter">APAGAR</button> {/* Alterado para APAGAR */}
          <button onClick={onAdminAccess} className="keypad-button clear">ADMIN</button> {/* Novo botão ADMIN */}
        </div>
      </div>
    </>
  );
};

export default DigitalKeypadVault;