document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("video-modal");
  const iframe = document.getElementById("video-iframe");
  const closeModal = document.querySelector(".modal .close");
  const modalCurtidas = document.getElementById("modal-curtidas");
  const modalCurtirButton = document.getElementById("modal-curtir");
  const modalFecharButton = document.getElementById("modal-fechar");

  // Função para abrir o modal
  function openModal(videoId) {
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    modal.style.display = "flex";
    modalCurtidas.textContent = "0"; // Reseta as curtidas

    // Remove eventos duplicados antes de adicionar novamente
    modalCurtirButton.replaceWith(modalCurtirButton.cloneNode(true));
    const newModalCurtirButton = document.getElementById("modal-curtir");

    // Adiciona evento ao botão "Curtir" no modal
    newModalCurtirButton.addEventListener("click", () => {
      let curtidas = parseInt(modalCurtidas.textContent, 10) || 0;
      curtidas++;
      modalCurtidas.textContent = curtidas;
    });
  }

  // Função para fechar o modal
  function closeModalFunction() {
    modal.style.display = "none";
    iframe.src = ""; // Limpa o iframe
  }

  // Evento para fechar o modal ao clicar no botão "Fechar" no canto superior
  closeModal.addEventListener("click", closeModalFunction);

  // Evento para fechar o modal ao clicar no botão "Fechar" dentro do modal
  modalFecharButton.addEventListener("click", closeModalFunction);

  // Adiciona evento ao botão "Curtir" no modal
  modalCurtirButton.addEventListener("click", () => {
    let curtidas = parseInt(modalCurtidas.textContent, 10) || 0; // Garante que o valor inicial seja 0
    curtidas++; // Incrementa o contador
    modalCurtidas.textContent = curtidas; // Atualiza o texto do contador
  });

  // Adiciona evento aos botões de curtir na página principal
  document.querySelectorAll(".curtir").forEach(button => {
    button.addEventListener("click", event => {
      const countSpan = button.nextElementSibling.querySelector(".count"); // Seleciona o contador de curtidas
      let curtidas = parseInt(countSpan.textContent, 10);
      curtidas++;
      countSpan.textContent = curtidas; // Atualiza o contador de curtidas
    });
  });

  // Adiciona evento aos botões de compartilhar na página principal
  document.querySelectorAll(".compartilhar").forEach(button => {
    button.addEventListener("click", event => {
      const videoId = event.target.dataset.id; // Obtém o ID do vídeo do botão
      const currentUrl = window.location.href.split("?")[0];
      const shareUrl = `${currentUrl}?video=${videoId}`;

      // Copia o link para a área de transferência
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("O link do vídeo foi copiado para a área de transferência!");
      }).catch(err => {
        console.error("Erro ao copiar o link: ", err);
      });
    });
  });

  // Adiciona evento aos botões de compartilhar para WhatsApp
  const shareButtons = document.querySelectorAll(".compartilhar");

  shareButtons.forEach(button => {
    button.addEventListener("click", event => {
      const videoId = event.target.dataset.id; // Obtém o ID do vídeo do botão
      const currentUrl = window.location.href.split("?")[0]; // URL base da página
      const shareUrl = `${currentUrl}?video=${videoId}`; // Gera o link do vídeo

      // Texto para compartilhar no WhatsApp
      const message = `Confira este vídeo incrível: ${shareUrl}`;
      const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

      // Abre o link no WhatsApp
      window.open(whatsappLink, "_blank");
    });
  });

  // Verifica se há um parâmetro de vídeo na URL ao carregar a página
  const urlParams = new URLSearchParams(window.location.search);
  const videoIdFromUrl = urlParams.get("video");
  if (videoIdFromUrl) {
    openModal(videoIdFromUrl); // Abre o modal automaticamente com o vídeo correspondente
  }
});



