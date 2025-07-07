// Mobile menu and search toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchToggle = document.querySelector('.header__search-toggle');
    const searchForm = document.querySelector('.header__search');
    const searchInput = document.querySelector('.search-form__input');
    
    if (searchToggle && searchForm) {
        searchToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isSearchVisible = searchForm.classList.contains('visible');
            
            if (isSearchVisible) {
                searchForm.classList.remove('visible');
                document.body.style.overflow = '';
            } else {
                // Close mobile menu if open
                if (mobileMenu && mobileMenu.getAttribute('data-mobile-menu') === 'true') {
                    toggleMobileMenu(false);
                }
                
                searchForm.classList.add('visible');
                document.body.style.overflow = 'hidden';
                searchInput.focus();
            }
        });
        
        // Close search when clicking outside
        document.addEventListener('click', function(e) {
            if (searchForm.classList.contains('visible') && 
                !searchForm.contains(e.target) && 
                !searchToggle.contains(e.target)) {
                searchForm.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });
        
        // Close search on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchForm.classList.contains('visible')) {
                searchForm.classList.remove('visible');
                document.body.style.overflow = '';
                searchToggle.focus();
            }
        });
    }
    const mobileMenuToggle = document.querySelector('[data-mobile-menu-toggle]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    const body = document.body;
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);
    
    // Toggle mobile menu
    function toggleMobileMenu(show) {
        const isExpanded = show !== undefined ? show : mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.setAttribute('data-mobile-menu', !isExpanded);
        
        // Toggle body class and scroll
        if (!isExpanded) {
            body.classList.add('menu-open');
            overlay.classList.add('active');
        } else {
            body.classList.remove('menu-open');
            overlay.classList.remove('active');
        }
        
        // Ensure body scroll is reset when menu is closed
        if (isExpanded) {
            body.style.overflow = '';
        }
    }
    
    // Toggle menu on button click
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });
    }
    
    // Close menu when clicking overlay
    overlay.addEventListener('click', function() {
        toggleMobileMenu(false);
    });
    
    // Close menu when clicking a nav link
    const navLinks = document.querySelectorAll('.main-nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            toggleMobileMenu(false);
        });
    });
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close mobile menu if open
            if (mobileMenu && mobileMenu.getAttribute('data-mobile-menu') === 'true') {
                toggleMobileMenu(false);
            }
            // Close search if open
            if (searchForm && searchForm.classList.contains('visible')) {
                searchForm.classList.remove('visible');
                document.body.style.overflow = '';
                searchToggle.focus();
            }
        }
    });
    
    // Update current year in footer
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});
