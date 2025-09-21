// Header HTML que será inserido em todas as páginas
const headerHTML = `
    <div class="header">
        <div class="menu-icon" onclick="toggleSidebar()" id="menuIcon">
            <div class="menu-line"></div>
            <div class="menu-line"></div>
            <div class="menu-line"></div>
        </div>
        <div class="logo">
            <h1>NEERO</h1>
            <p>Automação Inteligente</p>
        </div>
        <div class="logo">
        <img src="assets/logo branco 2.png" alt="Profile Icon">
        </div>
    </div>

    <div class="overlay" id="overlay" onclick="closeSidebar()"></div>
    
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <h2>NEERO</h2>
            <p>Sistema de Automação</p>
        </div>
        <ul class="sidebar-menu">
            <li><a href="index.html" id="menu-home">
                <span class="icon">🏠</span>Início
            </a></li>
            <li><a href="home-automation.html" id="menu-automation">
                <span class="icon">🎛️</span>Casa Automática
            </a></li>
        </ul>
    </div>
`;

// Inserir o header quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('header-container').innerHTML = headerHTML;
});

/*<li><a href="projects.html" id="menu-projects">
                <span class="icon">📋</span>Projetos
            </a></li>*/ 