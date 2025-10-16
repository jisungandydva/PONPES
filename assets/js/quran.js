/**
 * Al-Quran Online JavaScript
 * Handles Quran API integration and UI functionality
 */

// Global Variables
let surahList = [];
let filteredSurahs = [];
let currentPage = 1;
let currentView = 'list';
const ayahsPerPage = 10;

// ========================================
// Initialization
// ========================================

// Load when page is ready
window.addEventListener('load', function() {
  // Only load if we're on the quran page
  if (document.querySelector('.quran-page')) {
    loadSurahList();
  }
});

// ========================================
// Mobile Menu Functions
// ========================================

/**
 * Open mobile menu overlay
 */
function openMobileMenu() {
  const overlay = document.getElementById('mobileMenuOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close mobile menu overlay
 * @param {Event} event - Click event
 */
function closeMobileMenu(event) {
  if (event && event.target !== document.getElementById('mobileMenuOverlay')) {
    return;
  }
  
  const overlay = document.getElementById('mobileMenuOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// ========================================
// Quran API Functions
// ========================================

/**
 * Load list of all surahs from API
 */
async function loadSurahList() {
  try {
    showLoading();
    
    const response = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      surahList = data.data.map(surah => ({
        number: surah.number,
        name_id: surah.englishName,
        name_ar: surah.name,
        translation: surah.englishNameTranslation,
        ayah_count: surah.numberOfAyahs,
        type: surah.revelationType
      }));
      
      filteredSurahs = [...surahList];
      displaySurahList();
    } else {
      throw new Error('Gagal memuat daftar surah');
    }
    
  } catch (error) {
    console.error('Error loading surah list:', error);
    showError(`Gagal memuat daftar surah: ${error.message}`);
  }
}

/**
 * Display list of surahs
 */
function displaySurahList() {
  currentView = 'list';
  const quickAccess = document.getElementById('quickAccess');
  if (quickAccess) {
    quickAccess.classList.remove('hidden');
  }
  
  const searchInput = document.getElementById('searchInput');
  const searchResults = searchInput && searchInput.value ? 
    `<div class="search-results">Ditemukan ${filteredSurahs.length} surah</div>` : '';
  
  const surahCards = filteredSurahs.map(surah => `
    <div class="surah-card" onclick="showSurah(${surah.number})">
      <div class="surah-header">
        <div class="surah-number">${surah.number}</div>
        <div class="surah-arabic">${surah.name_ar}</div>
      </div>
      <div class="surah-info">
        <h3>${surah.name_id}</h3>
        <div class="surah-meta">
          <span>📍 ${surah.translation}</span>
          <span>• ${surah.ayah_count} ayat</span>
          <span>• ${surah.type}</span>
        </div>
      </div>
    </div>
  `).join('');

  const contentElement = document.getElementById('content');
  if (contentElement) {
    contentElement.innerHTML = searchResults + `<div class="surah-grid">${surahCards}</div>`;
  }
}

/**
 * Show specific surah with all ayahs
 * @param {number} surahNumber - Surah number (1-114)
 */
async function showSurah(surahNumber) {
  try {
    showLoading();
    currentView = 'surah';
    const quickAccess = document.getElementById('quickAccess');
    if (quickAccess) {
      quickAccess.classList.add('hidden');
    }
    
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      displaySurah(data.data);
    } else {
      throw new Error('Data surah tidak ditemukan');
    }
    
  } catch (error) {
    console.error('Error loading surah:', error);
    showError(`Gagal memuat surah: ${error.message}`);
  }
}

/**
 * Show Ayat Kursi (Al-Baqarah 255)
 */
function showAyahKursi() {
  showSpecificAyah(2, 255);
}

/**
 * Show specific ayah
 * @param {number} surahNumber - Surah number
 * @param {number} ayahNumber - Ayah number
 */
async function showSpecificAyah(surahNumber, ayahNumber) {
  try {
    showLoading();
    currentView = 'ayah';
    const quickAccess = document.getElementById('quickAccess');
    if (quickAccess) {
      quickAccess.classList.add('hidden');
    }
    
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}`);
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      displaySpecificAyah(data.data);
    } else {
      throw new Error('Ayat tidak ditemukan');
    }
    
  } catch (error) {
    console.error('Error loading ayah:', error);
    showError(`Gagal memuat ayat: ${error.message}`);
  }
}

/**
 * Display surah with pagination
 * @param {Object} surah - Surah data
 */
function displaySurah(surah) {
  currentPage = 1;
  const paginatedAyahs = paginateAyahs(surah.ayahs);
  const ayahsHtml = paginatedAyahs.map(ayah => `
    <div class="ayah-item">
      <div class="ayah-number-badge">${ayah.numberInSurah}</div>
      <div class="ayah-arabic">${ayah.text}</div>
      <div class="ayah-translation">Ayat ${ayah.numberInSurah} dari Surah ${surah.englishName}</div>
    </div>
  `).join('');
  
  const pagination = createPagination(surah.ayahs.length, surah);

  const contentElement = document.getElementById('content');
  if (contentElement) {
    contentElement.innerHTML = `
      <button class="back-btn" onclick="goBack()">
        ← Kembali ke Daftar Surah
      </button>
      <div class="ayah-viewer">
        <div class="ayah-header">
          <h2>${surah.englishName} (${surah.name})</h2>
          <p>${surah.englishNameTranslation} • ${surah.numberOfAyahs} ayat • ${surah.revelationType}</p>
        </div>
        ${ayahsHtml}
      </div>
      ${pagination}
    `;
  }
}

/**
 * Display specific ayah
 * @param {Object} ayah - Ayah data
 */
function displaySpecificAyah(ayah) {
  const surahInfo = surahList.find(s => s.number == ayah.surah.number);
  
  const contentElement = document.getElementById('content');
  if (contentElement) {
    contentElement.innerHTML = `
      <button class="back-btn" onclick="goBack()">
        ← Kembali ke Daftar Surah
      </button>
      <div class="ayah-viewer">
        <div class="ayah-header">
          <h2>${surahInfo?.name_id} - Ayat ${ayah.numberInSurah}</h2>
          <p>${ayah.surah.englishName} • ${ayah.surah.englishNameTranslation}</p>
        </div>
        <div class="ayah-item">
          <div class="ayah-number-badge">${ayah.numberInSurah}</div>
          <div class="ayah-arabic">${ayah.text}</div>
          <div class="ayah-translation">
            ${ayah.numberInSurah == 255 ? '"Allah - tidak ada Tuhan selain Dia Yang Hidup kekal lagi terus menerus mengurus (makhluk-Nya); tidak mengantuk dan tidak tidur..."' : 
            `Ayat ${ayah.numberInSurah} dari Surah ${ayah.surah.englishName}`}
          </div>
        </div>
      </div>
    `;
  }
}

// ========================================
// Search and Navigation Functions
// ========================================

/**
 * Search surahs by name or number
 */
function searchSurah() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const query = searchInput.value.toLowerCase();
  
  if (!query) {
    filteredSurahs = [...surahList];
  } else {
    filteredSurahs = surahList.filter(surah => 
      surah.name_id.toLowerCase().includes(query) ||
      surah.translation.toLowerCase().includes(query) ||
      surah.number.toString().includes(query)
    );
  }
  
  if (currentView === 'list') {
    displaySurahList();
  }
}

/**
 * Go back to surah list
 */
function goBack() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  filteredSurahs = [...surahList];
  displaySurahList();
}

/**
 * Paginate ayahs
 * @param {Array} ayahs - Array of ayahs
 * @returns {Array} - Paginated ayahs
 */
function paginateAyahs(ayahs) {
  const startIndex = (currentPage - 1) * ayahsPerPage;
  const endIndex = startIndex + ayahsPerPage;
  return ayahs.slice(startIndex, endIndex);
}

/**
 * Create pagination controls
 * @param {number} totalAyahs - Total number of ayahs
 * @param {Object} surah - Surah object for callback
 * @returns {string} - HTML string for pagination
 */
function createPagination(totalAyahs, surah) {
  const totalPages = Math.ceil(totalAyahs / ayahsPerPage);
  
  if (totalPages <= 1) return '';

  let paginationHtml = '<div class="pagination">';
  
  // Previous button
  if (currentPage > 1) {
    paginationHtml += `<button onclick="changePage(${currentPage - 1}, ${surah.number})">‹ Prev</button>`;
  }

  // Page numbers
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    const active = i === currentPage ? 'active' : '';
    paginationHtml += `<button class="${active}" onclick="changePage(${i}, ${surah.number})">${i}</button>`;
  }

  // Next button
  if (currentPage < totalPages) {
    paginationHtml += `<button onclick="changePage(${currentPage + 1}, ${surah.number})">Next ›</button>`;
  }

  paginationHtml += '</div>';
  return paginationHtml;
}

/**
 * Change page
 * @param {number} page - Page number
 * @param {number} surahNumber - Surah number
 */
function changePage(page, surahNumber) {
  currentPage = page;
  showSurah(surahNumber);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// UI Helper Functions
// ========================================

/**
 * Show loading spinner
 */
function showLoading() {
  const contentElement = document.getElementById('content');
  if (contentElement) {
    contentElement.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Memuat...</p>
      </div>
    `;
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const contentElement = document.getElementById('content');
  if (contentElement) {
    contentElement.innerHTML = `
      <div class="error">
        <h3>❌ Error</h3>
        <p>${message}</p>
        <button onclick="loadSurahList()" style="margin-top: 15px; background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Coba Lagi
        </button>
      </div>
    `;
  }
}

// ========================================
// Event Listeners
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  
  // Close mobile menu when clicking on menu links
  const menuLinks = document.querySelectorAll('.mobile-menu-items a:not(.mobile-dropdown-header)');
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      closeMobileMenu();
    });
  });
  
  // Close mobile menu when clicking on dropdown items
  const dropdownLinks = document.querySelectorAll('.mobile-dropdown-content a');
  dropdownLinks.forEach(link => {
    link.addEventListener('click', function() {
      closeMobileMenu();
    });
  });
  
  // Close menu on ESC key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeMobileMenu();
    }
  });
  
});