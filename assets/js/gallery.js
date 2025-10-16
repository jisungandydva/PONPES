/**
 * Gallery Page JavaScript
 * Handles mobile menu and image modal functionality
 */

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
 * @param {Event} event - Click event (optional)
 */
function closeMobileMenu(event) {
  // If event exists and it's not clicking on the overlay itself, return
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
// Image Modal Functions
// ========================================

/**
 * Open image modal with details
 * @param {string} imageSrc - Image source URL
 * @param {string} title - Image title
 * @param {string} category - Image category
 */
function openImageModal(imageSrc, title, category) {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  
  if (modal && modalImage && modalTitle && modalCategory) {
    modalImage.src = imageSrc;
    modalTitle.textContent = title;
    modalCategory.textContent = category;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close image modal
 */
function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// ========================================
// Event Listeners
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  
  // Close mobile menu when clicking on menu links
  const menuLinks = document.querySelectorAll('.mobile-menu-items a');
  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Don't close if it's a dropdown header
      if (!this.classList.contains('mobile-dropdown-header')) {
        closeMobileMenu();
      }
    });
  });
  
  // Close menus on ESC key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeMobileMenu();
      closeImageModal();
    }
  });
  
  // Prevent body scroll when modal is open
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeImageModal();
      }
    });
  }
  
});

// ========================================
// Scroll Top Button (if needed)
// ========================================

window.addEventListener('load', function() {
  const scrollTop = document.querySelector('.scroll-top');
  
  if (scrollTop) {
    function toggleScrollTop() {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
    
    scrollTop.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    window.addEventListener('scroll', toggleScrollTop);
    toggleScrollTop();
  }
});