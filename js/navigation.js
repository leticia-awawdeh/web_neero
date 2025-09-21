// Sistema de navegação entre páginas
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuIcon = document.getElementById('menuIcon');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    menuIcon.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuIcon = document.getElementById('menuIcon');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    menuIcon.classList.remove('active');
}

// Definir página ativa no menu
function setActivePage(pageName) {
    document.addEventListener('DOMContentLoaded', function() {
        // Remover classe active de todos os itens
        const menuItems = document.querySelectorAll('.sidebar-menu a');
        menuItems.forEach(item => item.classList.remove('active'));
        
        // Adicionar classe active ao item atual
        const activeItem = document.getElementById(`menu-${pageName}`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    });
}

// Event listeners globais
document.addEventListener('DOMContentLoaded', function() {
    // Fechar sidebar ao clicar fora
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuIcon = document.getElementById('menuIcon');
        
        if (sidebar && menuIcon && !sidebar.contains(e.target) && !menuIcon.contains(e.target)) {
            if (sidebar.classList.contains('active')) {
                closeSidebar();
            }
        }
    });
    
    // Fechar sidebar ao redimensionar
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
});