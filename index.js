const VITE_SUPABASE_URL = 'https://ugikcueacvxshchdwzgy.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnaWtjdWVhY3Z4c2hjaGR3emd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDMwMDYsImV4cCI6MjA5MTkxOTAwNn0.y2E_GWhVTBtShcbMXYUFX1pcNE0xDYiX2nHMEZ8J5Fg';

// Initialize Supabase client
// The CDN script exposes the global 'supabase' object with createClient
// We must name our instance something else (e.g. supabaseClient) so we don't clobber it.
let supabaseClient = null;

if (typeof supabase !== 'undefined' && supabase.createClient) {
  supabaseClient = supabase.createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
  console.log('✅ Supabase client initialized');
} else {
  console.error('❌ Supabase library failed to load from CDN');
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Authentication Guard & Initialization
    window.addEventListener('load', async () => {
        // Check local storage for the SupabaseClient token
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        // if (!session) {
        //     // If no token exists, kick them back to the login page immediately
        //     window.location.href = '/pages/formAccount.html';
        //     return;
        // }

        // Save the user data globally for our views to use
        currentUser = session.user;

        // Start the internal router
        appRouter();
    });

    // 2. Internal Page Router
    // Explanation: Because we are already on index.html, we don't want to load a new 
    // physical file every time the user clicks "Profile" or "Premium". 
    // Instead, we use the URL hash (e.g., index.html#profile) to hide/show sections dynamically.
    function appRouter() {
        let hash = window.location.hash.substring(1) || 'home';

        // // Premium Content Protection
        // if (hash === 'premium' && !currentUser.user_metadata.is_premium) {
        //     alert("Access Denied: Standard users cannot view the premium area.");
        //     window.location.hash = 'profile'; // Force them back to profile
        //     return;
        // }

        // Hide all views
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        // Show the view that matches the URL hash
        const activeView = document.getElementById(`view-${hash}`);
        if (activeView) {
            activeView.classList.add('active');
            
            // Populate specific data depending on which view is open
            if (hash === 'home') loadHome();
            if (hash === 'profile') loadProfile();
        }
    }

    // Listen for clicks on the navbar links
    window.addEventListener('hashchange', appRouter);

    // 3. Data Population Functions
    function loadHome() {
        const welcome = document.getElementById('welcome-message');
        welcome.innerHTML = `Welcome back, <strong>${currentUser.user_metadata.username}</strong>!`;
    }

    function loadProfile() {
        document.getElementById('prof-user').textContent = currentUser.user_metadata.username;
        document.getElementById('prof-email').textContent = currentUser.email;
    }

    // 4. Logout Logic
    document.getElementById('btn_signOut').addEventListener('click', async () => {
        // This clears the token from localStorage via SupabaseClient
        console.log("Signing out...")
        await supabaseClient.auth.signOut();
    });
    document.getElementById('btn_GetStarted').addEventListener('click', async () => {
        window.location.href = '/pages/sim/sandbox.html';
    });
});

// 






function toggleMobileMenu() {
  const nav = document.getElementById('main-nav');
  const btnBar = document.getElementById('main-btn-bar');
  const isActive = document.body.classList.contains('menu-active');
  
  if (isActive) {
    document.body.classList.remove('menu-active');
    nav.classList.remove('open');
    btnBar.classList.remove('open');
  } else {
    document.body.classList.add('menu-active');
    nav.classList.add('open');
    btnBar.classList.add('open');
  }
}

// Close menu when clicking a link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 800) toggleMobileMenu();
  });
});































// Page Navigation System
class PageNavigator {
    constructor() {
        this.currentPage = 'home';
        this.pages = document.querySelectorAll('.page');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.init();
    }

    init() {
        // Navigation link clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const pageId = e.target.dataset.page;
                this.navigateTo(pageId);
            });
        });

        // Handle data-navigate buttons throughout the site
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-navigate]');
            if (target) {
                const pageId = target.dataset.navigate;
                this.navigateTo(pageId);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateTo(e.state.page, false);
            }
        });

        // Set initial state
        history.replaceState({ page: this.currentPage }, '', `#${this.currentPage}`);
    }

    navigateTo(pageId, updateHistory = true) {
        // Validate page exists
        const targetPage = document.getElementById(pageId);
        if (!targetPage) {
            console.warn(`Page "${pageId}" not found`);
            return;
        }

        // Don't navigate if already on this page
        if (pageId === this.currentPage) return;

        // Get current and target pages
        const currentPageEl = document.getElementById(this.currentPage);

        // Add fade-out animation to current page
        currentPageEl.classList.add('fade-out');

        // Wait for fade-out, then switch pages
        setTimeout(() => {
            // Hide all pages
            this.pages.forEach(page => {
                page.classList.remove('active', 'fade-out', 'fade-in');
            });

            // Show target page with fade-in
            targetPage.classList.add('active', 'fade-in');

            // Update navigation active state
            this.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.page === pageId) {
                    link.classList.add('active');
                }
            });

            // Update current page
            this.currentPage = pageId;

            // Update browser history
            if (updateHistory) {
                history.pushState({ page: pageId }, '', `#${pageId}`);
            }

            // Scroll to top of new page
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Remove fade-in class after animation
            setTimeout(() => {
                targetPage.classList.remove('fade-in');
            }, 300);
        }, 200);
    }
}

// Interactive Elements Handler
class InteractionHandler {
    constructor() {
        this.init();
    }

    init() {
        // Initialize all interactive elements
        this.setupAccordions();
        this.setupExpandables();
        this.setupHoverEffects();
    }

    setupAccordions() {
        // Add accordion functionality for expandable sections
        const accordionHeaders = document.querySelectorAll('[data-accordion]');
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('expanded');
                const content = header.nextElementSibling;
                if (content) {
                    content.classList.toggle('visible');
                }
            });
        });
    }

    setupExpandables() {
        // Setup expandable content sections
        const expandButtons = document.querySelectorAll('[data-expand]');
        expandButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.expand;
                const target = document.getElementById(targetId);
                if (target) {
                    target.classList.toggle('expanded');
                    button.textContent = target.classList.contains('expanded') 
                        ? 'Show Less' 
                        : 'Show More';
                }
            });
        });
    }

    setupHoverEffects() {
        // Add interactive hover effects for cards
        const cards = document.querySelectorAll('.feature-card, .mode-card, .exercise-card, .project-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }
}

// Learning Progress Tracker
class ProgressTracker {
    constructor() {
        this.progress = this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem('forgetech_progress');
        return saved ? JSON.parse(saved) : {
            exercisesCompleted: 0,
            quizzesTaken: 0,
            projectsFinished: 0,
            simulatorHours: 0,
            averageScore: 0,
            completedPaths: []
        };
    }

    saveProgress() {
        localStorage.setItem('forgetech_progress', JSON.stringify(this.progress));
    }

    updateStat(stat, value) {
        this.progress[stat] = value;
        this.saveProgress();
        this.updateDisplay();
    }

    updateDisplay() {
        // Update all progress displays on the page
        const statElements = document.querySelectorAll('[data-stat]');
        statElements.forEach(el => {
            const stat = el.dataset.stat;
            if (this.progress[stat] !== undefined) {
                el.textContent = this.progress[stat];
            }
        });
    }
}

// Notification System
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.createNotificationContainer();
    }

    createNotificationContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

// Search Functionality
class SearchHandler {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        if (this.searchInput) {
            this.init();
        }
    }

    init() {
        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
    }

    performSearch(query) {
        if (query.length < 2) return;

        // Implementation for search functionality
        // This would search through learning materials, tutorials, etc.
        console.log('Searching for:', query);
    }
}

// Simulator Launch Handler
class SimulatorLauncher {
    constructor() {
        this.setupLaunchButtons();
    }

    setupLaunchButtons() {
        // Handle simulator launch buttons
        const launchButtons = document.querySelectorAll('[onclick*="Launch"]');
        launchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const mode = button.textContent;
                this.launch(mode);
            });
        });
    }

    launch(mode) {
        // Placeholder for actual simulator launch
        notifications.show(`Launching simulator in ${mode}...`, 'info');
        
        // In a real implementation, this would:
        // 1. Load the 3D simulator environment
        // 2. Initialize with the selected mode
        // 3. Set up user controls and guidance
        console.log('Simulator would launch here:', mode);
    }
}

// Form Validation Handler
class FormValidator {
    constructor() {
        this.setupValidation();
    }

    setupValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validate(form)) {
                    e.preventDefault();
                }
            });
        });
    }

    validate(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showError(input, 'This field is required');
                isValid = false;
            } else {
                this.clearError(input);
            }
        });

        return isValid;
    }

    showError(input, message) {
        input.classList.add('error');
        let errorEl = input.nextElementSibling;
        if (!errorEl || !errorEl.classList.contains('error-message')) {
            errorEl = document.createElement('span');
            errorEl.className = 'error-message';
            input.parentNode.insertBefore(errorEl, input.nextSibling);
        }
        errorEl.textContent = message;
    }

    clearError(input) {
        input.classList.remove('error');
        const errorEl = input.nextElementSibling;
        if (errorEl && errorEl.classList.contains('error-message')) {
            errorEl.remove();
        }
    }
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('forgetech_theme') || 'auto';
        this.applyTheme();
        this.setupThemeToggle();
    }

    applyTheme() {
        if (this.currentTheme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('dark-theme', prefersDark);
        } else {
            document.body.classList.toggle('dark-theme', this.currentTheme === 'dark');
        }
    }

    setupThemeToggle() {
        const themeSelect = document.querySelector('select[name="theme"]');
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
            themeSelect.addEventListener('change', (e) => {
                this.currentTheme = e.target.value;
                localStorage.setItem('forgetech_theme', this.currentTheme);
                this.applyTheme();
            });
        }
    }
}

// Smooth Scroll Handler
class SmoothScroller {
    constructor() {
        this.setupSmoothScroll();
    }

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href.startsWith('#page-')) return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Analytics Tracker (Placeholder)
class AnalyticsTracker {
    constructor() {
        this.setupTracking();
    }

    setupTracking() {
        // Track page views
        this.trackPageView(window.location.hash.slice(1) || 'home');
    }

    trackPageView(page) {
        // Placeholder for analytics tracking
        console.log('Page view:', page);
        
        // In production, this would send to analytics service
        // Example: gtag('event', 'page_view', { page_path: page });
    }

    trackEvent(category, action, label) {
        console.log('Event:', category, action, label);
        
        // In production, this would send to analytics service
        // Example: gtag('event', action, { category, label });
    }
}

// Initialize all systems when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Core navigation
    window.navigator = new PageNavigator();
    
    // Interactive elements
    window.interactions = new InteractionHandler();
    
    // Progress tracking
    window.progressTracker = new ProgressTracker();
    
    // Notifications
    window.notifications = new NotificationSystem();
    
    // Search functionality
    window.searchHandler = new SearchHandler();
    
    // Simulator launcher
    window.simulatorLauncher = new SimulatorLauncher();
    
    // Form validation
    window.formValidator = new FormValidator();
    
    // Theme management
    window.themeManager = new ThemeManager();
    
    // Smooth scrolling
    window.smoothScroller = new SmoothScroller();
    
    // Analytics
    window.analytics = new AnalyticsTracker();

    // Check for hash in URL and navigate if present
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash)) {
        window.navigator.navigateTo(hash, false);
    }

    // Console welcome message
    console.log('%cForgeTech Simulator', 'font-size: 20px; font-weight: bold; color: #0066cc;');
    console.log('%cInteractive Hardware Learning Platform', 'font-size: 12px; color: #666;');
    console.log('Version: 1.0.0 | Built with vanilla JavaScript');
});

// Utility Functions
const utils = {
    // Format numbers with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    // Format duration in minutes to readable format
    formatDuration(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    },

    // Debounce function for search and other inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Copy text to clipboard
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            window.notifications.show('Copied to clipboard!', 'success', 2000);
        }).catch(() => {
            window.notifications.show('Failed to copy', 'error', 2000);
        });
    }
};

// Export utils for global access
window.utils = utils;

// Add to your main JS file
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .roadmap-card, .mode-card, .future-sim-card, .exercise-card, .project-card').forEach(card => {
  observer.observe(card);
});

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  const root = document.documentElement;

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem('forgetech-theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);
  updateIcons(savedTheme);

  function updateIcons(theme) {
    if (theme === 'light') {
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
    } else {
      iconSun.style.display = 'block';
      iconMoon.style.display = 'none';
    }
  }

  themeToggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('forgetech-theme', next);
    updateIcons(next);
  });
});


function toggleMobileMenu() {
  const nav = document.querySelector('.nav-bar');
  const icon = document.querySelector('.menu-icon');
  nav.classList.toggle('responsive');
  icon.classList.toggle('active');
}

// Optional: Auto-close menu when clicking a link
document.querySelectorAll('.nav-bar a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 800) toggleMobileMenu();
  });
});