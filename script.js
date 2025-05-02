
const appState = {
  currentPost: null,
  likeData: {},
  currentPage: 1,
  postsPerPage: 10
};

// Cache de elementos DOM
const elements = {
  modal: document.getElementById('video-modal'),
  modalIframe: document.getElementById('video-iframe'),
  modalCurtidas: document.getElementById('modal-curtidas'),
  modalCompartilhar: document.getElementById('modal-compartilhar'),
  closeButton: document.querySelector('#video-modal .close'),
  posts: document.querySelectorAll('.post')
};

// Mapa para armazenar instâncias do YouTube Player
const players = new Map();

// Função para obter ID do vídeo da URL
function getVideoIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('video');
}

// Inicializa players do YouTube quando a API estiver pronta
function onYouTubeIframeAPIReady() {
  initYouTubePlayers();
}

// Função auxiliar para pausar todos os vídeos
function pauseAllVideos(exceptIframe = null) {
  console.log('Pausando todos os vídeos, exceto:', exceptIframe); // Debug
  players.forEach((player, iframe) => {
    if (iframe !== exceptIframe) {
      try {
        player.pauseVideo();
        console.log('Vídeo pausado:', iframe.src); // Debug
      } catch (error) {
        console.error('Erro ao pausar vídeo:', iframe.src, error);
      }
    }
  });
}

// Função auxiliar para lidar com o fim do vídeo
function handlePlayerStateChange(event, iframe) {
  if (event.data === YT.PlayerState.ENDED) {
    console.log('Vídeo terminou, reiniciando para a capa:', iframe); // Debug
    const player = players.get(iframe);
    if (player) {
      player.seekTo(0); // Volta ao início
      player.pauseVideo(); // Pausa para mostrar a capa ou frame inicial
    }
  }
}

// Função auxiliar para lidar com cliques no botão de play/pause
function handlePlayPauseClick(player) {
  if (!player) return;

  const playerState = player.getPlayerState();
  if (playerState === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}
// Inicializa todos os players do YouTube, excluindo o iframe do modal
function initYouTubePlayers() {
  document.querySelectorAll('.video-container iframe:not(#video-iframe)').forEach(iframe => {
    if (!players.has(iframe) && iframe.src && iframe.src !== 'about:blank') {
      console.log('Inicializando player para iframe:', iframe.src); // Debug
      const player = new YT.Player(iframe, {
        events: {
          'onReady': (event) => onPlayerReady(event, iframe),
          'onStateChange': (event) => handlePlayerStateChange(event, iframe)
        }
      });
      players.set(iframe, player);
    }
  });
}

// Callback quando o player está pronto
function onPlayerReady(event, iframe) {
  console.log('Player pronto para iframe:', iframe.src); // Debug
  const post = iframe.closest('.post');
  if (post && !iframe.closest('#video-modal')) {
    // Adiciona botão "Tela cheia" apenas para posts, não para o modal
    addFullscreenButton(post);
  } else {
    console.warn('Ignorando adição de botão Tela cheia: iframe não está em um post ou está no modal', iframe); // Debug
  }
}

// Inicializa a aplicação
function initApp() {
  loadPosts();
  const urlParams = new URLSearchParams(window.location.search);
  const sharedPostId = urlParams.get('post');
  
  if (sharedPostId) {
    setTimeout(() => {
      const sharedPost = document.querySelector(`[data-id="${sharedPostId}"]`);
      if (sharedPost) {
        openModal(sharedPost);
      }
    }, 1000);
  }

  ensurePostIdentifiers();
  initPostsInteractions();
  initStorageData();
  initModalInteractions();
}

// Verifica URL para post compartilhado
function checkUrlForSharedPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedPostId = urlParams.get('post');

  if (sharedPostId) {
    const targetPost = Array.from(elements.posts).find(post => 
      post.getAttribute('data-id') === sharedPostId
    );

    if (targetPost) {
      setTimeout(() => {
        openModal(targetPost);
        const emojiMenu = elements.modal.querySelector('.emoji-menu');
        if (emojiMenu) {
          emojiMenu.style.display = 'flex';
          emojiMenu.style.visibility = 'visible';
          emojiMenu.style.opacity = '1';
          
          const emojis = emojiMenu.querySelectorAll('.emoji');
          emojis.forEach(emoji => {
            emoji.style.display = 'flex';
            emoji.style.visibility = 'visible';
            emoji.style.opacity = '1';
          });
        }

        const actionsContainer = elements.modal.querySelector('.actions');
        if (actionsContainer) {
          actionsContainer.style.display = 'flex';
          actionsContainer.style.visibility = 'visible';
          actionsContainer.style.opacity = '1';
        }

        const videoSrc = elements.modalIframe.src;
        if (videoSrc) {
          const updatedSrc = videoSrc.includes('?') ? 
            `${videoSrc}&autoplay=1` : `${videoSrc}?autoplay=1`;
          elements.modalIframe.src = updatedSrc;
          
          const modalOverlay = elements.modal.querySelector('.video-overlay');
          if (modalOverlay) modalOverlay.style.display = 'none';
          
          const modalVideoContainer = elements.modal.querySelector('.video-container');
          if (modalVideoContainer) {
            modalVideoContainer.style.setProperty('--play-icon-display', 'none');
          }
        }
      }, 100);
    }
  }
}

// Garante identificadores únicos para posts
function ensurePostIdentifiers() {
  elements.posts.forEach((post, index) => {
    const postId = post.getAttribute('data-id');
    if (!postId || postId.includes('VIDEO_ID')) {
      post.setAttribute('data-id', `post-${index + 1}`);
      const shareButton = post.querySelector('.compartilhar-whatsapp');
      if (shareButton) {
        shareButton.setAttribute('data-id', `post-${index + 1}`);
      }
    }
  });
}

// Inicializa dados de armazenamento
function initStorageData() {
  try {
    const savedData = localStorage.getItem('blogLikeData');
    if (savedData) {
      appState.likeData = JSON.parse(savedData);
      updateAllLikeCounts();
    }
  } catch (error) {
    console.error('Erro ao carregar dados salvos:', error);
  }
}

// Atualiza contagem de curtidas
function updateAllLikeCounts() {
  elements.posts.forEach(post => {
    const postId = post.getAttribute('data-id');
    if (postId && appState.likeData[postId]) {
      const countElement = post.querySelector('.count');
      if (countElement) {
        countElement.textContent = appState.likeData[postId];
      }
    }
  });
}

// Salva dados de curtidas
function saveLikeData() {
  try {
    localStorage.setItem('blogLikeData', JSON.stringify(appState.likeData));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

// Inicializa interações dos posts
function initPostsInteractions() {
  elements.posts.forEach(post => {
    addFullscreenButton(post);
    
    const emojis = post.querySelectorAll('.emoji');
    emojis.forEach(emoji => {
      const newEmoji = emoji.cloneNode(true);
      emoji.parentNode.replaceChild(newEmoji, emoji);
      newEmoji.addEventListener('click', event => {
        event.stopPropagation();
        incrementLikeCount(post);
      }, { once: true });
    });

    const videoContainer = post.querySelector('.video-container');
    if (videoContainer) {
      const handler = () => playVideoInline(post);
      videoContainer.removeEventListener('click', handler);
      videoContainer.addEventListener('click', handler);
    }
  });
}

// Incrementa contagem de curtidas
function incrementLikeCount(post) {
  if (!post) return;

  const postId = post.getAttribute('data-id');
  if (postId) {
    const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
    const currentCount = likeData[postId] || 0;
    const newCount = currentCount + 1;

    updateCountElements(postId, newCount);
    likeData[postId] = newCount;
    localStorage.setItem('blogLikeData', JSON.stringify(likeData));
    appState.likeData[postId] = newCount;
  }
}

// Manipula clique em tela cheia
function handleFullscreenClick(e, post) {
  e.stopPropagation();
  const iframe = post.querySelector('iframe');
  let player = players.get(iframe);

  console.log('Player encontrado:', player); // Debug

  if (!player && iframe.src && iframe.src !== 'about:blank') {
    // Inicializa o player se não estiver inicializado
    player = new YT.Player(iframe, {
      events: {
        'onReady': (event) => {
          players.set(iframe, event.target);
          console.log('Player inicializado:', event.target); // Debug
          // Pausa o vídeo após inicialização
          try {
            event.target.pauseVideo();
            console.log('Vídeo pausado via API após inicialização'); // Debug
            event.target.getCurrentTime().then(currentTime => {
              openModal(post, Math.floor(currentTime));
            }).catch(error => {
              console.error('Erro ao obter tempo do vídeo:', error);
              openModal(post, 0);
            });
          } catch (error) {
            console.error('Erro ao pausar vídeo após inicialização:', error);
            openModal(post, 0);
          }
        },
        'onStateChange': (event) => handlePlayerStateChange(event, iframe)
      }
    });
  } else if (player) {
    // Player já inicializado, tenta pausar
    try {
      player.pauseVideo();
      console.log('Vídeo pausado via API'); // Debug
      player.getCurrentTime().then(currentTime => {
        openModal(post, Math.floor(currentTime));
      }).catch(error => {
        console.error('Erro ao obter tempo do vídeo:', error);
        openModal(post, 0);
      });
    } catch (error) {
      console.error('Erro ao pausar vídeo:', error);
      openModal(post, 0);
    }
  } else {
    console.log('Player não inicializado e iframe sem src, abrindo modal'); // Debug
    openModal(post, 0);
  }
}

// Reproduz vídeo inline
function playVideoInline(post) {
  if (!post) return;

  const postId = post.getAttribute('data-id');
  const isShort = post.getAttribute('data-type') === 'short';
  const iframe = post.querySelector('iframe');
  const player = players.get(iframe);

 if (player) {
    const playerState = player.getPlayerState();
    if (playerState !== YT.PlayerState.PLAYING) { // Pausar todos apenas se o player atual não estiver tocando
      pauseAllVideos(iframe);
    }
    handlePlayPauseClick(player);
  } else {
    const embedUrl = isShort
      ? `https://www.youtube.com/embed/${postId}?enablejsapi=1&rel=0&loop=1&playlist=${postId}&autoplay=1&mute=0`
      : `https://www.youtube.com/embed/${postId}?enablejsapi=1&autoplay=1&mute=0`;
    iframe.src = embedUrl;
    console.log('Definindo src do iframe e inicializando player:', embedUrl); // Debug
    // Re-inicializa o player após definir o src
    setTimeout(() => {
      if (!players.has(iframe)) {
        const player = new YT.Player(iframe, {
          events: {
            'onReady': (event) => {
              console.log('Player inicializado em playVideoInline:', iframe.src); // Debug
              pauseAllVideos(iframe); // Pausar todos os outros vídeos antes de iniciar o novo
 handlePlayPauseClick(event.target);
            },
            'onStateChange': (event) => handlePlayerStateChange(event, iframe)
          }
        });
        players.set(iframe, player);
      }
    }, 1000);
  }

  const overlay = post.querySelector('.video-overlay');
  if (overlay) overlay.style.opacity = '0.7';
}

// Inicializa interações do modal
function initModalInteractions() {
  if (elements.closeButton) {
    elements.closeButton.addEventListener('click', closeModal);
  }

  window.addEventListener('click', event => {
    if (event.target === elements.modal) {
      closeModal();
    }
  });

  const modalEmojis = document.querySelectorAll('#video-modal .emoji');
  modalEmojis.forEach(emoji => {
    emoji.addEventListener('click', () => {
      if (appState.currentPost) {
        incrementLikeCount(appState.currentPost);
        closeModal();
      }
    });
  });

  const modalVideoContainer = elements.modal.querySelector('.video-container');
  if (modalVideoContainer) {
    modalVideoContainer.addEventListener('click', (event) => {
      // Evita que o clique no vídeo feche o modal acidentalmente se houver outros listeners no modal
      event.stopPropagation();

      const videoSrc = elements.modalIframe.src;
      const modalPlayer = players.get(elements.modalIframe);

      if (modalPlayer) {
        handlePlayPauseClick(modalPlayer);
        showModalActions();

        if (appState.currentPost) {
          const postId = appState.currentPost.getAttribute('data-id');
          const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
          updateCountElements(postId, likeData[postId] || 0);
        }
      }
    });
  }

  const shareButton = document.getElementById('modal-compartilhar');
  shareButton.addEventListener('click', () => {
    if (appState.currentPost) {
      const postId = appState.currentPost.getAttribute('data-id');
      shareOnWhatsApp(postId);
    }
  });
}

// Abre o modal
function openModal(post, currentTime = 0) {
  if (!post) return;

  appState.currentPost = post;
  const postId = post.getAttribute('data-id');
  const isShort = post.getAttribute('data-type') === 'short';

  if (postId) {
    const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
    const currentCount = likeData[postId] || 0;
    const modalCounter = document.getElementById('modal-curtidas');
    if (modalCounter) modalCounter.textContent = currentCount;

    const modalContainer = elements.modal.querySelector('.video-container');
    if (modalContainer) {
      modalContainer.className = `video-container ${isShort ? 'shorts' : 'regular'}`;
    }

    // Pausar todos os vídeos na página antes de abrir o modal (excluindo o iframe do modal)
    pauseAllVideos(elements.modalIframe);

    const embedUrl = isShort 
      ? `https://www.youtube.com/embed/${postId}?enablejsapi=1&rel=0&loop=1&playlist=${postId}&autoplay=1&mute=1&start=${Math.floor(currentTime)}`
      : `https://www.youtube.com/embed/${postId}?enablejsapi=1&autoplay=1&mute=0&start=${Math.floor(currentTime)}`;

    if (elements.modalIframe) {
      elements.modalIframe.src = embedUrl;
      // Inicializa o player para o modal
      setTimeout(() => {
        if (!players.has(elements.modalIframe)) {
          const player = new YT.Player(elements.modalIframe, {
            events: {
              'onReady': (event) => {
                players.set(elements.modalIframe, event.target);
                console.log('Player do modal inicializado e reproduzindo:', event.target); // Debug
                event.target.playVideo(); // Garante que o vídeo comece
              },
              'onStateChange': (event) => handlePlayerStateChange(event, elements.modalIframe)
            }
          });
        }
      }, 1000);
    }

    elements.modal.style.display = 'flex';
    showModalActions();
  }
}

// Fecha o modal
function closeModal() {
  if (!elements.modal) return;
  
  const currentPost = appState.currentPost;
  
  // Pausar o vídeo do modal antes de fechar
  const modalPlayer = players.get(elements.modalIframe);
  if (modalPlayer) {
    try {
      modalPlayer.pauseVideo();
      console.log('Vídeo do modal pausado ao fechar'); // Debug
    } catch (error) {
      console.error('Erro ao pausar vídeo do modal:', error);
    }
  }

  if (elements.modalIframe) {
    elements.modalIframe.src = '';
    players.delete(elements.modalIframe); // Remove o player do modal
  }
  elements.modal.style.display = 'none';
  
  if (currentPost) {
    const iframe = currentPost.querySelector('iframe');
    const postId = currentPost.getAttribute('data-id');
    const isShort = post.getAttribute(('data-type') === 'short');
    
    // Garante que o iframe tenha uma URL válida para mostrar a capa
    const embedUrl = isShort 
      ? `https://www.youtube.com/embed/${postId}?enablejsapi=1&rel=0&loop=1&playlist=${postId}&start=0`
      : `https://www.youtube.com/embed/${postId}?enablejsapi=1&start=0`;
      
    if (iframe && iframe.src !== embedUrl) {
      console.log('Restaurando src do iframe da página:', embedUrl); // Debug
      iframe.src = embedUrl;
      // Re-inicializa o player se necessário
      setTimeout(() => {
        if (!players.has(iframe)) {
          const player = new YT.Player(iframe, {
            events: {
              'onReady': (event) => {
                console.log('Player reinicializado em closeModal:', iframe.src); // Debug
                onPlayerReady(event, iframe);
              },
              'onStateChange': (event) => handlePlayerStateChange(event, iframe)
            }
          });
          players.set(iframe, player);
        }
      }, 1000);
    }
  }
  
  appState.currentPost = null;
  
  const url = new URL(window.location.href);
  url.searchParams.delete('post');
  window.history.replaceState({}, '', url);
}

// Compartilha post
function sharePostModal(postId) {
  if (!postId) return;

  try {
    const post = document.querySelector(`[data-id="${postId}"]`);
    const videoTitle = post?.querySelector('iframe')?.getAttribute('title') || "";
    const formattedTitle = `*${videoTitle}*`;
    
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('post', postId);
    const cleanUrl = currentUrl.toString().split('#')[0];
    const message = `${videoTitle}\n\nConfira este vídeo e concorra a prêmios: ${cleanUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    
    
  
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    alert('Não foi possível compartilhar o post. Por favor, tente novamente.');
  }
}

// Carrega posts
function loadPosts() {
  const postsGrid = document.querySelector('.posts-grid');
  const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
  const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');

  posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const startIndex = 0;
  const endIndex = appState.currentPage * appState.postsPerPage;
  const hasMorePosts = posts.length > endIndex;
  const visiblePosts = posts.slice(startIndex, endIndex);

  let postsHTML = '';
  for (let i = 0; i < visiblePosts.length; i++) {
    const post = visiblePosts[i];
    const containerClass = post.isShort ? 'video-container shorts' : 'video-container regular';
    const embedUrl = post.isShort 
      ? `https://www.youtube.com/embed/${post.id}?enablejsapi=1&rel=0&loop=1&playlist=${post.id}`
      : `https://www.youtube.com/embed/${post.id}?enablejsapi=1`;

    postsHTML += `
      <div class="post" data-id="${post.id}" data-type="${post.isShort ? 'short' : 'regular'}">
          <div class="${containerClass}">
              <iframe 
                  loading="lazy"
                  src="about:blank"
                  data-src="${embedUrl}"
                  title="${post.title}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen>
              </iframe>
              <div class="video-overlay">${post.title}</div>
          </div>
          <div class="actions">
              <div class="emoji-menu">
                  <button class="emoji" data-emoji="❤️" title="Amei">❤️</button>
              </div>
              <span class="curtidas">
                  <span class="count">${likeData[post.id] || 0}</span>
              </span>
              <button class="compartilhar-whatsapp" onclick="shareOnWhatsApp('${post.id}')" data-id="${post.id}">
                  <i class="fab fa-whatsapp"></i>
              </button>
          </div>
      </div>
    `;

    if ((i + 1) % 10 === 0 && hasMorePosts) {
      postsHTML += `
        <div class="pagination-controls">
          <div class="buttons-container">
            ${hasMorePosts ? `<button class="load-more-btn">VEJA + 10 VÍDEOS</button>` : ''}
          </div>
        </div>
      `;
    }
  }

  postsGrid.innerHTML = postsHTML;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        const src = iframe.getAttribute('data-src');
        if (src && iframe.src === 'about:blank') {
          console.log('Carregando iframe via IntersectionObserver:', src); // Debug
          iframe.src = src;
          // Inicializa o player após carregar o src
          setTimeout(() => {
            if (!players.has(iframe)) {
              const player = new YT.Player(iframe, {
                events: {
                  'onReady': (event) => {
                    console.log('Player inicializado via IntersectionObserver:', iframe.src); // Debug
                    onPlayerReady(event, iframe);
                  },
                  'onStateChange': (event) => handlePlayerStateChange(event, iframe)
                }
              });
              players.set(iframe, player);
            }
          }, 1000);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });

  document.querySelectorAll('.video-container iframe:not(#video-iframe)').forEach(iframe => {
    observer.observe(iframe);
  });

  document.querySelectorAll('.load-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.currentPage++;
      loadPosts();
    });
  });

  elements.posts = document.querySelectorAll('.post');
  // Garante que todos os posts tenham botões "Tela cheia" após carregar
  elements.posts.forEach(post => {
    addFullscreenButton(post);
  });
  initPostsInteractions();

  const urlParams = new URLSearchParams(window.location.search);
  const sharedPostId = urlParams.get('post');
  if (sharedPostId) {
    const targetPost = document.querySelector(`[data-id="${sharedPostId}"]`);
    if (targetPost) {
      setTimeout(() => openModal(targetPost), 500);
    }
  }
}

// Mostra ações do modal
function showModalActions() {
  const emojiMenu = elements.modal.querySelector('.emoji-menu');
  const actionsContainer = elements.modal.querySelector('.actions');

  if (emojiMenu) {
    emojiMenu.style.display = 'flex';
    emojiMenu.style.visibility = 'visible';
    emojiMenu.style.opacity = '1';

    const emojis = emojiMenu.querySelectorAll('.emoji');
    emojis.forEach(emoji => {
      emoji.style.display = 'flex';
      emoji.style.visibility = 'visible';
      emoji.style.opacity = '1';
    });
  }

  if (actionsContainer) {
    actionsContainer.style.display = 'flex';
    actionsContainer.style.visibility = 'visible';
    actionsContainer.style.opacity = '1';
  }
}

// Atualiza elementos de contagem
function updateCountElements(postId, count) {
  const postCountElements = document.querySelectorAll(`[data-id="${postId}"] .count`);
  postCountElements.forEach(element => {
    element.textContent = count;
  });

  if (elements.modal.style.display === 'flex') {
    const modalCounter = document.getElementById('modal-curtidas');
    if (modalCounter) modalCounter.textContent = count;
  }

  const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
  likeData[postId] = count;
  localStorage.setItem('blogLikeData', JSON.stringify(likeData));
}

// Compartilha via WhatsApp
function shareOnWhatsApp(postId) {
  if (!postId) return;

    try {
    const post = document.querySelector(`[data-id="${postId}"]`);
    const videoTitle = post.querySelector('iframe').getAttribute('title') || "";
   
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?post=${postId}`;
    const message = `${videoTitle}\n\nConfira este vídeo e concorra a prêmios: ${shareUrl}`;
   
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    alert('Não foi possível compartilhar o vídeo. Por favor, tente novamente.');
  }
}

// Adiciona botão de tela cheia
function addFullscreenButton(post) {
  if (!post || post.closest('#video-modal')) {
    console.log('Ignorando adição de botão Tela cheia para modal ou post inválido:', post?.getAttribute('data-id')); // Debug
    return;
  }
  // Remove botão existente para evitar duplicatas
  const existingBtn = post.querySelector('.open-modal-btn');
  if (existingBtn) {
    existingBtn.remove();
    console.log('Botão Tela cheia existente removido para post:', post.getAttribute('data-id')); // Debug
  }
  const modalBtn = document.createElement('button');
  modalBtn.className = 'open-modal-btn';
  modalBtn.innerHTML = '[ ] Tela cheia';
  modalBtn.addEventListener('click', (e) => handleFullscreenClick(e, post));
  const videoContainer = post.querySelector('.video-container');
  if (videoContainer) {
    videoContainer.appendChild(modalBtn);
    console.log('Botão Tela cheia adicionado para post:', post.getAttribute('data-id')); // Debug
  } else {
    console.warn('Video container não encontrado para post:', post.getAttribute('data-id')); // Debug
  }
}

// Listeners de eventos
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  const sharedVideoId = getVideoIdFromUrl();
  if (sharedVideoId) {
    const sharedPost = document.querySelector(`.post[data-id="${sharedVideoId}"]`);
    if (sharedPost) {
      setTimeout(() => openModal(sharedPost), 500);
    }
  }
});

window.addEventListener('popstate', function(event) {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('post');
  
  if (postId) {
    const post = document.querySelector(`[data-id="${postId}"]`);
    if (post) {
      setTimeout(() => openModal(post), 100);
    }
  } else {
    closeModal();
  }
});