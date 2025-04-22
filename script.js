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
  // Garante que todos os posts tenham um identificador único
  ensurePostIdentifiers();
  initPostsInteractions();
  initModalInteractions();
  initStorageData();
  checkUrlForSharedPost();
}

/**
 * Verifica a URL por parâmetros de postagem compartilhada e abre o modal apropriado
 */
function checkUrlForSharedPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedPostId = urlParams.get('post');
  
  if (sharedPostId) {
    // Encontra o post com o ID correspondente
    const targetPost = Array.from(elements.posts).find(post => 
      post.getAttribute('data-id') === sharedPostId
    );
    
    if (targetPost) {
      // Pequeno atraso para garantir que a página carregue completamente
      setTimeout(() => {
        openModal(targetPost);
      }, 300);
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
}

/**
 * Incrementa a contagem de curtidas em um post
 * @param {HTMLElement} post - O elemento do post
 */
function incrementLikeCount(post) {
  if (!post) return;
  
  const postId = post.getAttribute('data-id');
  const countElement = post.querySelector('.count');
  
  if (postId && countElement) {
    const currentCount = parseInt(countElement.textContent) || 0;
    const newCount = currentCount + 1;
    
    // Atualiza o elemento visual
    countElement.textContent = newCount;
    
    // Armazena o novo valor
    appState.likeData[postId] = newCount;
    saveLikeData();
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
  
  if (postId) {
    // Decide qual URL de vídeo usar
    let videoSrc;
    if (postId === 'rIVP8pndzMo') {
      // Usa o ID real do YouTube para o primeiro post
      videoSrc = `https://www.youtube.com/embed/${postId}`;
    } else if (postId.startsWith('post-')) {
      // Para os outros posts (com IDs gerados), usa um vídeo placeholder ou padrão
      videoSrc = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Vídeo padrão como exemplo
    } else {
      // Caso o post tenha um ID de vídeo específico
      videoSrc = `https://www.youtube.com/embed/${postId}`;
    }
    
    // Define o iframe para o vídeo correto
    elements.modalIframe.src = videoSrc;
    
    // Copia a contagem de curtidas do post para o modal
    const countValue = appState.likeData[postId] || 0;
    elements.modalCurtidas.textContent = countValue;
    
    // Captura o texto do overlay do post e o exibe no modal
    const overlayText = post.querySelector('.video-overlay').textContent;
    const modalOverlay = document.createElement('p'); // Cria um novo elemento para o texto do overlay
    modalOverlay.className = 'video-overlay'; // Adiciona a classe para estilização
    modalOverlay.textContent = overlayText; // Define o texto do overlay
    elements.modal.appendChild(modalOverlay); // Adiciona o texto ao modal

    // Atualiza o botão de compartilhar do modal
    elements.modalCompartilhar.setAttribute('data-id', postId);
    
    // Mostra o modal
    elements.modal.style.display = 'flex';
  }
}

/**
 * Fecha o modal
 */
function closeModal() {
  console.log('Fechando modal...'); // Debug
  
  if (!elements.modal) {
    console.error('Modal element not found');
    return;
  }

  // Limpa o iframe
  if (elements.modalIframe) {
    elements.modalIframe.src = '';
  }
  
  // Remove overlay
  const modalOverlay = elements.modal.querySelector('.video-overlay');
  if (modalOverlay) {
    modalOverlay.remove();
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

// Inicializa o aplicativo quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', initApp);