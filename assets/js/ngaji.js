// ========== GLOBAL VARIABLES ==========
let videos = [];
let allVideos = [];
let autoRefreshInterval = null;
let currentFilter = 'all';

const API_KEY = 'AIzaSyBPDs_M_H03YruqbUJlvxlpd-JA_gBwsRk';
const MAX_RESULTS = 50;

// ========== MENU FUNCTIONS ==========
function openMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu(event) {
    const overlay = document.getElementById('mobileMenuOverlay');
    if (event && event.target !== overlay) return;
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ========== VIDEO LOADING ==========
async function loadVideos() {
    const loadBtn = document.getElementById('loadBtn');
    const loadBtnText = document.getElementById('loadBtnText');
    const loadBtnSpinner = document.getElementById('loadBtnSpinner');

    try {
        loadBtn.disabled = true;
        loadBtnText.classList.add('hidden');
        loadBtnSpinner.classList.remove('hidden');
        showStatus('loading', 'Mencari video Ustadz Mbois...');

        const baseUrl = 'https://www.googleapis.com/youtube/v3/search';
        const params = new URLSearchParams({
            key: API_KEY,
            q: 'ustadz mbois',
            part: 'snippet',
            type: 'video',
            order: 'date',
            maxResults: MAX_RESULTS,
            relevanceLanguage: 'id',
            regionCode: 'ID'
        });

        console.log('Fetching videos from YouTube API...');
        const response = await fetch(`${baseUrl}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('YouTube API Response:', data);

        if (data.error) {
            console.error('YouTube API Error:', data.error);
            throw new Error(`YouTube API Error: ${data.error.message}`);
        }
        
        if (!data.items || data.items.length === 0) {
            throw new Error('Tidak ada video ditemukan');
        }

        const relevantVideos = data.items.filter(item => {
            const text = `${item.snippet.title} ${item.snippet.channelTitle} ${item.snippet.description}`.toLowerCase();
            return text.includes('mbois') || text.includes('ustadz');
        });

        if (relevantVideos.length === 0) {
            throw new Error('Tidak ada video Ustadz Mbois yang relevan');
        }

        const videoIds = relevantVideos.map(item => item.id.videoId).join(',');
        const detailUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds}&part=contentDetails,statistics`;
        
        console.log('Fetching video details...');
        const detailResponse = await fetch(detailUrl);
        
        if (!detailResponse.ok) {
            throw new Error(`HTTP error! status: ${detailResponse.status}`);
        }
        
        const detailData = await detailResponse.json();
        console.log('Video Details Response:', detailData);

        allVideos = relevantVideos.map(item => {
            const detail = detailData.items?.find(d => d.id === item.id.videoId);
            return {
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description || '',
                thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || '',
                publishedAt: item.snippet.publishedAt,
                channelTitle: item.snippet.channelTitle,
                duration: detail ? formatDuration(detail.contentDetails.duration) : 'N/A',
                viewCount: detail?.statistics ? parseInt(detail.statistics.viewCount) || 0 : 0
            };
        });

        allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        videos = [...allVideos];

        console.log(`Successfully loaded ${videos.length} videos`);
        displayVideos();
        showStatus('success', `✅ Berhasil memuat ${videos.length} video!`);

    } catch (error) {
        console.error('Error loading videos:', error);
        showStatus('error', `❌ Gagal memuat video: ${error.message}`);
        
        // Tampilkan pesan error yang lebih detail
        const videoGrid = document.getElementById('videoGrid');
        videoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p style="color: #ef4444; font-weight: 600;">Gagal memuat video</p>
                <p style="color: #aaa; font-size: 14px; margin-top: 10px;">${error.message}</p>
                <p style="color: #666; font-size: 12px; margin-top: 10px;">Cek console browser untuk detail error</p>
            </div>`;
    } finally {
        loadBtn.disabled = false;
        loadBtnText.classList.remove('hidden');
        loadBtnSpinner.classList.add('hidden');
    }
}

// ========== FILTER FUNCTIONS ==========
function filterVideos(period, buttonElement) {
    currentFilter = period;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');
    
    const currentTime = new Date();
    let filterDate;
    
    switch(period) {
        case 'today':
            filterDate = new Date(currentTime.setHours(0,0,0,0));
            break;
        case 'week':
            filterDate = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            filterDate = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            videos = [...allVideos];
            displayVideos();
            showStatus('success', `Menampilkan semua ${videos.length} video`);
            return;
    }
    
    videos = allVideos.filter(video => new Date(video.publishedAt) >= filterDate);
    displayVideos();
    showStatus('success', `Menampilkan ${videos.length} video`);
}

// ========== DISPLAY FUNCTIONS ==========
function displayVideos() {
    const videoGrid = document.getElementById('videoGrid');
    
    if (!videos || videos.length === 0) {
        videoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">😕</div>
                <p>Tidak ada video ditemukan</p>
            </div>`;
        return;
    }

    const currentTime = new Date();
    const sixHoursAgo = new Date(currentTime.getTime() - 6 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(currentTime.getTime() - 3 * 24 * 60 * 60 * 1000);

    videoGrid.innerHTML = videos.map(video => {
        const publishDate = new Date(video.publishedAt);
        let badgeHtml = '';
        let cssClass = '';
        
        if (publishDate >= sixHoursAgo) {
            badgeHtml = '<div class="very-new-badge">LIVE</div>';
            cssClass = 'very-new';
        } else if (publishDate >= threeDaysAgo) {
            badgeHtml = '<div class="new-badge">NEW</div>';
            cssClass = 'new';
        }
        
        const safeTitle = video.title.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        const safeDescription = video.description.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        
        return `
            <div class="video-item ${cssClass}" onclick="openVideo('${video.id}')">
                <div class="video-thumbnail-container">
                    ${badgeHtml}
                    <img src="${video.thumbnail}" alt="${safeTitle}" class="video-thumbnail" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzEyMTIxMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjYWFhIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='" />
                    <div class="video-duration">${video.duration}</div>
                </div>
                
                <div class="video-content">
                    <div class="video-title">${video.title}</div>
                    <div class="video-channel">${video.channelTitle}</div>
                    <div class="video-meta">
                        <span>${formatViews(video.viewCount)} views</span>
                        <span>•</span>
                        <span>${getTimeAgo(publishDate)}</span>
                    </div>
                    <div class="video-description">${video.description}</div>
                </div>
            </div>
        `;
    }).join('');

    updateStats();
}

function updateStats() {
    const currentTime = new Date();
    const threeDaysAgo = new Date(currentTime.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const newVideos = allVideos.filter(v => new Date(v.publishedAt) >= threeDaysAgo).length;
    const weekVideos = allVideos.filter(v => new Date(v.publishedAt) >= oneWeekAgo).length;
    
    document.getElementById('totalVideos').textContent = videos.length;
    document.getElementById('newVideos').textContent = newVideos;
    document.getElementById('weekVideos').textContent = weekVideos;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});
}

// ========== UTILITY FUNCTIONS ==========
function formatViews(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
}

function getTimeAgo(date) {
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return 'baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffWeeks < 4) return `${diffWeeks} minggu lalu`;
    if (diffMonths < 12) return `${diffMonths} bulan lalu`;
    return `${diffYears} tahun lalu`;
}

function formatDuration(duration) {
    if (!duration) return 'N/A';
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 'N/A';
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) {
        return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
}

function openVideo(videoId) {
    if (videoId) {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }
}

function showStatus(type, message) {
    const statusDiv = document.getElementById('statusMessage');
    if (statusDiv) {
        statusDiv.className = `status ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        // Auto hide success/error messages after 5 seconds
        if (type !== 'loading') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// ========== AUTO REFRESH ==========
function toggleAutoRefresh() {
    const btn = document.getElementById('autoRefreshBtn');
    
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        btn.textContent = '⏰ Auto Refresh (2 menit)';
        showStatus('success', 'Auto refresh dinonaktifkan');
    } else {
        autoRefreshInterval = setInterval(loadVideos, 2 * 60 * 1000);
        btn.textContent = '⏸️ Stop Auto Refresh';
        showStatus('success', 'Auto refresh aktif (setiap 2 menit)');
        loadVideos();
    }
}

// ========== SEARCH ==========
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const videoItems = document.querySelectorAll('.video-item');
            
            let visibleCount = 0;
            videoItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                const isVisible = text.includes(searchTerm) || searchTerm === '';
                item.style.display = isVisible ? 'block' : 'none';
                if (isVisible) visibleCount++;
            });
            
            if (searchTerm && visibleCount === 0) {
                const videoGrid = document.getElementById('videoGrid');
                videoGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <p>Tidak ada video yang cocok dengan pencarian "${searchTerm}"</p>
                    </div>`;
            }
        });
    }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Initialize search
    initializeSearch();
    
    // Load videos after 1 second
    setTimeout(loadVideos, 1000);
    
    // Setup mobile menu
    const menuLinks = document.querySelectorAll('.mobile-menu-items a');
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Escape key closes mobile menu
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') closeMobileMenu();
    });
    
    console.log('Initialization complete');
});