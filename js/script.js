document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let allPosts = [];
    const GAS_URL = window.APP_CONFIG.GAS_URL;

    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const iconMoon = document.getElementById('icon-moon');
    const iconSun = document.getElementById('icon-sun');
    
    const postGrid = document.getElementById('post-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    
    const modal = document.getElementById('post-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalArticle = document.getElementById('modal-article');
    const btnShareWa = document.getElementById('btn-share-wa');

    let currentPost = null;

    // --- Theme Toggle (Light/Dark Mode) ---
    // Check saved preference
    const savedTheme = localStorage.getItem('as-corner-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        iconMoon.style.display = 'none';
        iconSun.style.display = 'block';
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        if (isDark) {
            iconMoon.style.display = 'none';
            iconSun.style.display = 'block';
            localStorage.setItem('as-corner-theme', 'dark');
        } else {
            iconMoon.style.display = 'block';
            iconSun.style.display = 'none';
            localStorage.setItem('as-corner-theme', 'light');
        }
    });

    // --- Fetch Data ---
    async function fetchPosts() {
        try {
            // cache buster
            const url = `${GAS_URL}?type=all&v=${Date.now()}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            allPosts = data;
            
            populateFilters();
            renderPosts(allPosts);
            
        } catch (error) {
            console.error('Error fetching posts:', error);
            loadingIndicator.innerHTML = 'Gagal memuat konten. Silakan coba lagi nanti.';
        }
    }

    // --- Helper: Format Date ---
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // --- Render Posts ---
    function renderPosts(posts) {
        loadingIndicator.style.display = 'none';
        postGrid.innerHTML = '';
        
        if (posts.length === 0) {
            postGrid.innerHTML = '<p class="loading">Tidak ada postingan yang ditemukan.</p>';
            return;
        }

        posts.forEach(post => {
            // Excerpt extraction from HTML content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.isi;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const excerpt = textContent.substring(0, 150) + '...';

            const card = document.createElement('article');
            card.className = 'post-card';
            
            // Thumbnail logic
            const thumbnailHTML = post.foto ? 
                `<div class="card-img-wrapper"><img src="${post.foto}" alt="${post.judul}" class="card-img" loading="lazy"></div>` : 
                '';

            card.innerHTML = `
                ${thumbnailHTML}
                <div class="card-content">
                    <div class="card-meta">
                        <span>${post.tema || 'Umum'}</span>
                        <span>${formatDate(post.tanggal)}</span>
                    </div>
                    <h2 class="card-title">${post.judul}</h2>
                    <p class="card-excerpt">${excerpt}</p>
                    <div class="card-read-more">Baca Selengkapnya &rarr;</div>
                </div>
            `;
            
            card.addEventListener('click', () => openModal(post));
            postGrid.appendChild(card);
        });
    }

    // --- Populate Filters ---
    function populateFilters() {
        const themes = [...new Set(allPosts.map(p => p.tema).filter(t => t))];
        themes.sort();
        
        // Reset select, keeping "Semua Tema"
        filterSelect.innerHTML = '<option value="All">Semua Tema</option>';
        
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme;
            filterSelect.appendChild(option);
        });
    }

    // --- Search & Filter Logic ---
    function filterAndSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedTheme = filterSelect.value;
        
        const filteredPosts = allPosts.filter(post => {
            const matchTheme = selectedTheme === 'All' || post.tema === selectedTheme;
            const matchSearch = post.judul.toLowerCase().includes(searchTerm) || 
                                (post.isi && post.isi.toLowerCase().includes(searchTerm));
            
            return matchTheme && matchSearch;
        });
        
        renderPosts(filteredPosts);
    }

    searchInput.addEventListener('input', filterAndSearch);
    filterSelect.addEventListener('change', filterAndSearch);

    // --- Modal Logic ---
    function openModal(post) {
        currentPost = post;
        
        // Build modal content
        const thumbnailHTML = post.foto ? 
            `<img src="${post.foto}" alt="${post.judul}" class="modal-thumbnail">` : '';
            
        const videoHTML = post.video ? 
            `<iframe src="${post.video.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>` : '';
            
        const linkHTML = post.link_eksternal ? 
            `<p><strong>Link Eksternal:</strong> <a href="${post.link_eksternal}" target="_blank" rel="noopener noreferrer">${post.link_eksternal}</a></p>` : '';

        modalArticle.innerHTML = `
            <header class="modal-header">
                <div class="modal-meta">
                    <span>${post.tema || 'Umum'}</span> &bull; <span>${formatDate(post.tanggal)}</span>
                </div>
                <h1 class="modal-title">${post.judul}</h1>
            </header>
            ${thumbnailHTML}
            <div class="modal-body">
                ${post.isi}
                ${videoHTML}
                ${linkHTML}
            </div>
        `;
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
        
        // Show modal
        modal.classList.add('show');
        // Scroll modal to top
        modal.scrollTop = 0;
    }

    function closeModal() {
        modal.classList.remove('show');
        // Re-enable body scroll
        document.body.style.overflow = '';
        currentPost = null;
    }

    closeModalBtn.addEventListener('click', closeModal);
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // --- WhatsApp Share ---
    btnShareWa.addEventListener('click', () => {
        if (!currentPost) return;
        
        // Buat teks untuk dibagikan
        const siteUrl = window.location.href; // Idealnya menggunakan URL spesifik pos jika ada routing
        const text = `*${currentPost.judul}*\n\nBaca selengkapnya di A's Corner:\n${siteUrl}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        
        window.open(whatsappUrl, '_blank');
    });

    // --- Init ---
    fetchPosts();
});
