import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: #1a1a1a; /* Cor de fundo escura */
    color: white; /* Cor do texto padrão */
    font-family: Arial, sans-serif;
  }
`;

export default GlobalStyle;