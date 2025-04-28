// Armazena o estado da aplicação
const appState = {
  currentPost: null,  // Post atualmente aberto no modal
  likeData: {}        // Armazena dados de curtidas por post (usando índice ou ID)
};

// Cache de elementos DOM frequentemente usados
const elements = {
  modal: document.getElementById('video-modal'),
  modalIframe: document.getElementById('video-iframe'),
  modalCurtidas: document.getElementById('modal-curtidas'),
  modalCompartilhar: document.getElementById('modal-compartilhar'),
  closeButton: document.querySelector('#video-modal .close'), // Atualizado seletor
  posts: document.querySelectorAll('.post')
};

/**
 * Inicializa a aplicação
 */
function initApp() {
  loadPosts(); // Adiciona carregamento dos posts
  ensurePostIdentifiers();
  initPostsInteractions();
  initModalInteractions();
  initStorageData();
  checkUrlForSharedPost();
}

/**
 * Verifica a URL por parâmetros de postagem compartilhada e abre o modal apropriado
 * com emojis e ações visíveis imediatamente
 */
function checkUrlForSharedPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedPostId = urlParams.get('post');
  
  if (sharedPostId) {
    const targetPost = Array.from(elements.posts).find(post => 
      post.getAttribute('data-id') === sharedPostId
    );
    
    if (targetPost) {
      // Aguarda o DOM estar totalmente carregado
      setTimeout(() => {
        // Primeiro abre o modal normalmente
        openModal(targetPost);
        
        // Forçar a exibição do menu de emojis e seus botões
        const emojiMenu = elements.modal.querySelector('.emoji-menu');
        if (emojiMenu) {
          emojiMenu.style.display = 'flex';
          emojiMenu.style.visibility = 'visible';
          emojiMenu.style.opacity = '1';
          
          // Garante que todos os botões de emoji estão visíveis
          const emojis = emojiMenu.querySelectorAll('.emoji');
          emojis.forEach(emoji => {
            emoji.style.display = 'flex';
            emoji.style.visibility = 'visible';
            emoji.style.opacity = '1';
          });
        }

        // Garante que as ações do modal estão visíveis
        const actionsContainer = elements.modal.querySelector('.actions');
        if (actionsContainer) {
          actionsContainer.style.display = 'flex';
          actionsContainer.style.visibility = 'visible';
          actionsContainer.style.opacity = '1';
        }
        
        // Força o autoplay do vídeo para simular um clique
        const videoSrc = elements.modalIframe.src;
        if (videoSrc) {
          const updatedSrc = videoSrc.includes('?') ? 
            `${videoSrc}&autoplay=1` : 
            `${videoSrc}?autoplay=1`;
          
          elements.modalIframe.src = updatedSrc;
          
          // Esconde o overlay e o ícone de play
          const modalOverlay = elements.modal.querySelector('.video-overlay');
          if (modalOverlay) {
            modalOverlay.style.display = 'none';
          }
          
          // Remove o ícone de play definido no ::after
          const modalVideoContainer = elements.modal.querySelector('.video-container');
          if (modalVideoContainer) {
            modalVideoContainer.style.setProperty('--play-icon-display', 'none');
          }
        }
      }, 0.1); // Aumentado o tempo de espera para garantir que tudo carregue
    }
  }
}

/**
 * Garante que todos os posts tenham um identificador único
 * Isso resolve o problema de posts sem data-id válido
 */
function ensurePostIdentifiers() {
  elements.posts.forEach((post, index) => {
    const postId = post.getAttribute('data-id');
    if (!postId || postId.includes('VIDEO_ID')) {
      // Se não tiver ID ou for um placeholder, atribui um ID baseado no índice
      post.setAttribute('data-id', `post-${index + 1}`);
      
      // Também atualiza o botão de compartilhar, se existir
      const shareButton = post.querySelector('.compartilhar-whatsapp');
      if (shareButton) {
        shareButton.setAttribute('data-id', `post-${index + 1}`);
      }
    }
  });
}

/**
 * Inicializa os dados de armazenamento
 */
function initStorageData() {
  try {
    // Verifica se há dados salvos no localStorage
    const savedData = localStorage.getItem('blogLikeData');
    if (savedData) {
      appState.likeData = JSON.parse(savedData);
      updateAllLikeCounts();
    }
  } catch (error) {
    console.error('Erro ao carregar dados salvos:', error);
  }
}

/**
 * Atualiza a contagem de curtidas em todos os posts baseado nos dados armazenados
 */
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

/**
 * Salva os dados de curtidas no localStorage
 */
function saveLikeData() {
  try {
    localStorage.setItem('blogLikeData', JSON.stringify(appState.likeData));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

/**
 * Inicializa as interações para posts
 */
function initPostsInteractions() {
  elements.posts.forEach(post => {
    // Adiciona evento para abrir o modal ao clicar no vídeo
    const videoContainer = post.querySelector('.video-container');
    if (videoContainer) {
      videoContainer.addEventListener('click', () => openModal(post));
    }
    
    // Adiciona eventos para os emojis nos posts
    const emojis = post.querySelectorAll('.emoji');
    emojis.forEach(emoji => {
      emoji.addEventListener('click', event => {
        event.stopPropagation(); // Previne que o evento de clique propague para o post
        incrementLikeCount(post);
      });
    });
    
    // Adiciona evento para o botão de compartilhar
    const shareButton = post.querySelector('.compartilhar-whatsapp');
    if (shareButton) {
      shareButton.addEventListener('click', event => {
        event.stopPropagation();
        const postId = post.getAttribute('data-id'); // Usar o ID do post
        if (postId) {
          // Compartilha o link para a página com o modal do post
          sharePostModal(postId);
        }
      });
    }
  });
}

/**
 * Inicializa as interações do modal
 */
function initModalInteractions() {
  console.log('Initializing modal interactions...'); // Debug
  
  // Evento do botão fechar
  if (elements.closeButton) {
    console.log('Close button found'); // Debug
    elements.closeButton.addEventListener('click', () => {
      console.log('Close button clicked'); // Debug
      closeModal();
    });
  } else {
    console.error('Close button not found');
  }
  
  // Fecha ao clicar fora
  window.addEventListener('click', event => {
    if (event.target === elements.modal) {
      closeModal();
    }
  });
  
  // Eventos dos emojis
  const modalEmojis = document.querySelectorAll('#video-modal .emoji');
  modalEmojis.forEach(emoji => {
    emoji.addEventListener('click', () => {
      if (appState.currentPost) {
        incrementLikeCount(appState.currentPost);
      }
      closeModal();
    });
  });

  // Atualiza o evento de clique no container de vídeo do modal
  const modalVideoContainer = elements.modal.querySelector('.video-container');
  if (modalVideoContainer) {
    modalVideoContainer.addEventListener('click', () => {
      const videoSrc = elements.modalIframe.src;
      if (videoSrc) {
        // Atualiza o src do iframe para forçar o play do vídeo
        const updatedSrc = videoSrc.includes('?') ? 
          `${videoSrc}&autoplay=1` : 
          `${videoSrc}?autoplay=1`;
        
        elements.modalIframe.src = updatedSrc;
        
        // Esconde o overlay
        const modalOverlay = elements.modal.querySelector('.video-overlay');
        if (modalOverlay) {
          modalOverlay.style.display = 'none';
        }
        
        // Mostra ações e sincroniza contadores
        showModalActions();
        
        // Sincroniza o contador de curtidas
        if (appState.currentPost) {
          const postId = appState.currentPost.getAttribute('data-id');
          const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
          const currentCount = likeData[postId] || 0;
          updateCountElements(postId, currentCount);
        }
      }
    });
  }

  // Atualiza o handler de clique dos emojis
  const emojiButtons = elements.modal.querySelectorAll('.emoji');
  emojiButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (appState.currentPost) {
        const postId = appState.currentPost.getAttribute('data-id');
        incrementLikeCount(appState.currentPost);
        
        // Atualiza os contadores em todos os lugares
        const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
        const newCount = likeData[postId] || 0;
        updateCountElements(postId, newCount);
        
        // Não fecha o modal após curtir
        // closeModal(); // Remove esta linha
      }
    });
  });

  // Initialize WhatsApp sharing
  const shareButton = document.getElementById('modal-compartilhar');
  shareButton.addEventListener('click', () => {
    const postId = appState.currentPost.getAttribute('data-id');
    const text = encodeURIComponent(`Confira este vídeo: ${window.location.origin}?video=${postId}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  });
}

/**
 * Incrementa a contagem de curtidas em um post
 * @param {HTMLElement} post - O elemento do post
 */
function incrementLikeCount(post) {
  if (!post) return;
  
  const postId = post.getAttribute('data-id');
  
  if (postId) {
    // Carrega dados existentes
    const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
    const currentCount = likeData[postId] || 0;
    const newCount = currentCount + 1;
    
    // Atualiza contadores em todos os lugares
    updateCountElements(postId, newCount);
    
    // Salva no localStorage
    likeData[postId] = newCount;
    localStorage.setItem('blogLikeData', JSON.stringify(likeData));
    
    // Atualiza appState
    appState.likeData[postId] = newCount;
  }
}

/**
 * Abre o modal com o post selecionado
 * @param {HTMLElement} post - O elemento do post
 */
function openModal(post) {
  if (!post) return;
  
  appState.currentPost = post;
  const postId = post.getAttribute('data-id');
  const isShort = post.getAttribute('data-type') === 'short';
  
  if (postId) {
    // Add appropriate class to modal for proper aspect ratio
    const modalContainer = elements.modal.querySelector('.video-container');
    if (modalContainer) {
      modalContainer.className = `video-container ${isShort ? 'shorts' : 'regular'}`;
    }
    
    // Different player parameters for Shorts
    const embedUrl = isShort 
      ? `https://www.youtube.com/embed/${postId}?enablejsapi=1&rel=0&loop=1&playlist=${postId}`
      : `https://www.youtube.com/embed/${postId}?enablejsapi=1`;
    
    // Update iframe src
    if (elements.modalIframe) {
      elements.modalIframe.src = embedUrl;
    }
    
    // Pega e atualiza o texto do overlay
    const overlayText = post.querySelector('.video-overlay').textContent;
    const modalOverlay = elements.modal.querySelector('.video-overlay');
    if (modalOverlay) {
      modalOverlay.textContent = overlayText;
    }
    
    // Update like count from localStorage
    const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
    const currentCount = likeData[postId] || 0;
    
    // Update modal count
    elements.modalCurtidas.textContent = currentCount;
    
    // Atualiza botão de compartilhar
    elements.modalCompartilhar.setAttribute('data-id', postId);
    
    // Mostra o modal
    elements.modal.style.display = 'flex';
  }
}

/**
 * Fecha o modal
 */
function closeModal() {
  if (!elements.modal) return;
  
  // Limpa o src do iframe para parar o vídeo
  const modalIframe = elements.modalIframe;
  if (modalIframe) {
    modalIframe.src = '';
  }
  
  // Remove o texto do overlay
  const modalOverlay = elements.modal.querySelector('.video-overlay');
  if (modalOverlay) {
    modalOverlay.textContent = '';
  }
  
  // Esconde o modal
  elements.modal.style.display = 'none';
  
  // Reset do estado
  appState.currentPost = null;
}

/**
 * Compartilha o link para a página atual com parâmetro para abrir o modal do post específico
 * @param {string} postId - ID do post a ser compartilhado
 */
function sharePostModal(postId) {
  if (!postId) return;
  
  try {
    // Cria URL para a página atual com o parâmetro post
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('post', postId);
    
    // Limpa âncoras (#) se houver
    const cleanUrl = currentUrl.toString().split('#')[0];
    
    // Compartilha via WhatsApp
    const message = "Curta este vídeo incrível e concorra a prêmios!";
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + cleanUrl)}`;
    window.open(whatsappUrl, '_blank');
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    alert('Não foi possível compartilhar o post. Por favor, tente novamente.');
  }
}

/**
 * Carrega os posts do localStorage e os exibe na página
 * Com suporte para vídeos regulares e Shorts do YouTube
 */
function loadPosts() {
  const postsGrid = document.querySelector('.posts-grid');
  const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
  const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
  
  console.log('Loading posts:', posts); // Debug

  postsGrid.innerHTML = posts.map(post => {
    // Add debug log
    console.log('Processing post:', post);
    
    // Determine video container class based on video type
    const containerClass = post.isShort ? 'video-container shorts' : 'video-container regular';
    
    // Add different player parameters for Shorts
    const embedUrl = post.isShort 
      ? `https://www.youtube.com/embed/${post.id}?enablejsapi=1&rel=0&loop=1&playlist=${post.id}`
      : `https://www.youtube.com/embed/${post.id}?enablejsapi=1`;

    return `
      <div class="post" data-id="${post.id}" data-type="${post.isShort ? 'short' : 'regular'}">
          <div class="${containerClass}">
              <iframe 
                  src="${embedUrl}"
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
              <button class="compartilhar-whatsapp" data-id="${post.id}">
                  <i class="fab fa-whatsapp"></i>
              </button>
          </div>
      </div>
    `;
  }).join('');

  // Atualiza os elementos do DOM após carregar os posts
  elements.posts = document.querySelectorAll('.post');
  
  // Initialize interactions for new posts
  initPostsInteractions();
}

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

function updateCountElements(postId, count) {
  // Update post in main page
  const postCountElement = document.querySelector(`.post[data-id="${postId}"] .count`);
  if (postCountElement) {
    postCountElement.textContent = count;
  }
  
  // Update modal count
  const modalCountElement = document.getElementById('modal-curtidas');
  if (modalCountElement) {
    modalCountElement.textContent = count;
  }
  
  // Força salvamento no localStorage
  const likeData = JSON.parse(localStorage.getItem('blogLikeData') || '{}');
  likeData[postId] = count;
  localStorage.setItem('blogLikeData', JSON.stringify(likeData));
}

// Inicializa o aplicativo quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', initApp);y