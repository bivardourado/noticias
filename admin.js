function extractYouTubeId(url) {
    // Trim whitespace
    url = url.trim();
    
    // YouTube ID direta
    if (url.length === 11) {
        return url;
    }
    
    // Padrão específico para shorts com parâmetros adicionais
    const shortsPattern = /youtube\.com\/shorts\/([^?&]{11})/i;
    const shortsMatch = url.match(shortsPattern);
    if (shortsMatch && shortsMatch[1]) {
        return shortsMatch[1];
    }
    
    // Handle various YouTube URL formats
    const patterns = [
        // Standard watch URLs
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]{11})/i,
        // Short youtu.be links
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]{11})/i,
        // Embed URLs
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]{11})/i,
        // Mobile app sharing
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]{11})/i
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    // Try the old regex as fallback
    const fallbackRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]{11}).*/;
    const fallbackMatch = url.match(fallbackRegExp);
    
    return (fallbackMatch && fallbackMatch[2]) ? fallbackMatch[2] : null;
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('postForm');
    const postsPreview = document.getElementById('postsPreview');

    // Carregar posts existentes
    function loadPosts() {
        const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
        postsPreview.innerHTML = posts.map(post => `
            <div class="post-item">
                <span>${post.title}</span>
                <div>
                    <button onclick="deletePost('${post.id}')" class="delete-btn">
                        Deletar
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Adicionar novo post
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const videoUrl = document.getElementById('videoId').value;
        const title = document.getElementById('title').value;
        
        // Extrai o ID do vídeo da URL
        const videoId = extractYouTubeId(videoUrl);
        
        if (!videoId) {
            alert('URL do YouTube inválida');
            return;
        }
        
        const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
        
        posts.push({
            id: videoId,
            title: title,
            views: 0
        });
        
        localStorage.setItem('blogPosts', JSON.stringify(posts));
        
        // Resetar formulário e atualizar preview
        form.reset();
        loadPosts();
        alert('Post adicionado com sucesso!');
    });

    // Deletar post
    window.deletePost = function(postId) {
        if (confirm('Tem certeza que deseja deletar este post?')) {
            let posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
            posts = posts.filter(post => post.id !== postId);
            localStorage.setItem('blogPosts', JSON.stringify(posts));
            loadPosts();
        }
    }

    // Carregar posts ao iniciar
    loadPosts();
});