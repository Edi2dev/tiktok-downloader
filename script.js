document.addEventListener('DOMContentLoaded', () => {
  // Set current year
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Elements
  const urlInput = document.getElementById('tiktok-url');
  const downloadBtn = document.getElementById('download-btn');
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const resultEl = document.getElementById('result');
  const videoEl = document.getElementById('video-preview');
  const noWmBtn = document.getElementById('download-nowm');
  const originalBtn = document.getElementById('download-original');
  
  // Event Listeners
  downloadBtn.addEventListener('click', downloadVideo);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') downloadVideo();
  });
  
  // Auto-paste detection for mobile
  urlInput.addEventListener('paste', () => {
    setTimeout(() => {
      if (isValidTikTokUrl(urlInput.value)) {
        downloadVideo();
      }
    }, 100);
  });

  // Main Download Function
  async function downloadVideo() {
    const url = urlInput.value.trim();
    
    // Reset UI
    errorEl.style.display = 'none';
    resultEl.style.display = 'none';
    loadingEl.style.display = 'none';
    downloadBtn.disabled = true;
    
    // Validate URL
    if (!url) {
      showError('Masukkan link TikTok terlebih dahulu');
      downloadBtn.disabled = false;
      return;
    }
    
    if (!isValidTikTokUrl(url)) {
      showError('Link tidak valid. Contoh link yang benar:');
      showError('https://vm.tiktok.com/xxxxx/ atau https://www.tiktok.com/@user/video/123456');
      downloadBtn.disabled = false;
      return;
    }
    
    // Show loading
    loadingEl.style.display = 'block';
    
    try {
      // Fetch video data
      const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
      const response = await fetchWithTimeout(apiUrl, {}, 15000);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data?.video?.noWatermark) {
        throw new Error(data.message || 'Video tidak ditemukan');
      }
      
      // Set video source
      videoEl.src = data.video.noWatermark;
      videoEl.load();
      
      // Set download links
      noWmBtn.href = data.video.noWatermark;
      noWmBtn.download = `tiktok-no-watermark-${Date.now()}.mp4`;
      
      originalBtn.href = data.video.withWatermark || data.video.noWatermark;
      originalBtn.download = `tiktok-original-${Date.now()}.mp4`;
      
      // Show result
      resultEl.style.display = 'block';
      
    } catch (err) {
      console.error('Download error:', err);
      showError(`Gagal mengunduh video: ${err.message || 'Server sibuk, coba lagi nanti'}`);
    } finally {
      loadingEl.style.display = 'none';
      downloadBtn.disabled = false;
    }
  }
  
  // Helper Functions
  function isValidTikTokUrl(url) {
    const patterns = [
      /https?:\/\/(www\.)?tiktok\.com\/.+/i,
      /https?:\/\/vm\.tiktok\.com\/.+/i,
      /https?:\/\/vt\.tiktok\.com\/.+/i
    ];
    return patterns.some(pattern => pattern.test(url));
  }
  
  function showError(message) {
    errorEl.innerHTML = message;
    errorEl.style.display = 'block';
  }
  
  async function fetchWithTimeout(resource, options = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    
    clearTimeout(id);
    return response;
  }
});