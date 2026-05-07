// autenticacao.js (Merged Version)

// Cria os elementos HTML para a modal de senha
function createPasswordModal() {
    if (document.getElementById('password-modal')) {
        return;
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'password-modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'none';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    const modal = document.createElement('div');
    modal.id = 'password-modal';
    modal.style.backgroundColor = 'white';
    modal.style.padding = '20px';
    modal.style.borderRadius = '5px';
    modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    modal.style.width = '300px';
    modal.style.maxWidth = '90%';

    const title = document.createElement('h3');
    title.textContent = 'Autenticação Necessária';
    title.style.marginTop = '0';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.textContent = 'Digite a senha para continuar:';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'password-input';
    passwordInput.style.width = '100%';
    passwordInput.style.padding = '8px';
    passwordInput.style.marginBottom = '15px';
    passwordInput.style.boxSizing = 'border-box';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.id = 'password-cancel';
    cancelButton.style.marginRight = '10px';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = '#f2f2f2';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirmar';
    confirmButton.id = 'password-confirm';
    confirmButton.style.padding = '8px 16px';
    confirmButton.style.backgroundColor = '#4CAF50';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '4px';
    confirmButton.style.cursor = 'pointer';

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);

    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(passwordInput);
    modal.appendChild(buttonContainer);
    modalOverlay.appendChild(modal);

    document.body.appendChild(modalOverlay);

    passwordInput.addEventListener('keyup', function (event) {
        if (event.key === 'Enter') {
            document.getElementById('password-confirm').click();
        }
    });
}

// Função para mostrar a modal e retornar uma Promise
function showPasswordModal() {
    return new Promise((resolve, reject) => {
        createPasswordModal();

        const modalOverlay = document.getElementById('password-modal-overlay');
        const passwordInput = document.getElementById('password-input');
        const confirmButton = document.getElementById('password-confirm');
        const cancelButton = document.getElementById('password-cancel');

        passwordInput.value = '';
        modalOverlay.style.display = 'flex';
        setTimeout(() => passwordInput.focus(), 100);

        // Limpa event listeners antigos para evitar duplicação
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        const newCancelButton = cancelButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);

        const handleConfirm = () => {
            const password = passwordInput.value;
            modalOverlay.style.display = 'none';
            resolve(password);
        };

        const handleCancel = () => {
            modalOverlay.style.display = 'none';
            reject(new Error('Operação cancelada pelo usuário'));
        };

        newConfirmButton.addEventListener('click', handleConfirm);
        newCancelButton.addEventListener('click', handleCancel);
    });
}

// --- Interceptação Atualizada ---

// Padrões de rotas GET que exigem autenticação no cliente
const protectedGetRoutesClientPatterns = [
    /^\/senhas\/[^/]+\/reveal$/ // Regex para /senhas/:id/reveal
    // Adicione outros padrões GET protegidos aqui se necessário
];

// Intercepta requisições fetch
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
    const method = options.method || 'GET';
    let needsAuth = false;
    let urlPath = ''; // Variável para armazenar o path

    try {
        // Tenta extrair o path da URL. Pode falhar se a URL for relativa e sem base.
        // Usamos window.location.origin como base para URLs relativas.
        urlPath = new URL(url, window.location.origin).pathname;
    } catch (e) {
        console.warn("Não foi possível parsear a URL no interceptor fetch:", url, e);
        urlPath = url; // Usa a URL original como fallback (pode não ser ideal)
    }

    // Verifica se precisa de autenticação
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        needsAuth = true;
    } else if (method === 'GET') {
        // Testa o path contra os padrões definidos
        if (protectedGetRoutesClientPatterns.some(pattern => pattern.test(urlPath))) {
            needsAuth = true;
        }
    }

    console.log(`[Auth Fetch] Intercepting: ${method} ${urlPath} - Needs Auth: ${needsAuth}`); // Log

    if (needsAuth) {
        try {
            const password = await showPasswordModal();
            console.log("[Auth Fetch] Password obtained.");

            // Configura o header Authorization
            if (!options.headers) {
                options.headers = {};
            }
            // Garante que options.headers seja um objeto simples ou um objeto Headers
            if (options.headers instanceof Headers) {
                options.headers.set('Authorization', 'Basic ' + btoa(':' + password));
            } else {
                options.headers['Authorization'] = 'Basic ' + btoa(':' + password);
            }
            console.log("[Auth Fetch] Authorization header set.");

        } catch (error) {
            console.error("[Auth Fetch] Cancelled or error in modal:", error.message);
            // Re-lança o erro para que a função chamadora (ex: copyPassword) possa tratá-lo
            throw error;
        }
    }

    // Continua com a requisição original
    return originalFetch(url, options);
};

// Intercepta XMLHttpRequest (lógica similar)
const originalXhrOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    this._method = method;  // Armazena o método
    this._url = url;      // Armazena a URL
    originalXhrOpen.apply(this, arguments);
};

const originalXhrSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = async function (body) {
    const xhr = this;
    let needsAuth = false;
    let urlPath = '';

    try {
        // Tenta extrair o path da URL.
        urlPath = new URL(xhr._url, window.location.origin).pathname;
    } catch (e) {
        console.warn("Não foi possível parsear a URL no interceptor XHR:", xhr._url, e);
        urlPath = xhr._url;
    }

    // Verifica se precisa de autenticação
    if (['POST', 'PUT', 'DELETE'].includes(xhr._method)) {
        needsAuth = true;
    } else if (xhr._method === 'GET') {
        if (protectedGetRoutesClientPatterns.some(pattern => pattern.test(urlPath))) {
            needsAuth = true;
        }
    }

    console.log(`[Auth XHR] Intercepting: ${xhr._method} ${urlPath} - Needs Auth: ${needsAuth}`); // Log

    if (needsAuth) {
        try {
            const password = await showPasswordModal();
            console.log("[Auth XHR] Password obtained.");
            // Adiciona o cabeçalho de senha
            xhr.setRequestHeader('Authorization', 'Basic ' + btoa(':' + password));
            console.log("[Auth XHR] Authorization header set.");
            // Chama o método original *depois* de obter a senha e definir o header
            originalXhrSend.apply(xhr, arguments);
        } catch (error) {
            console.error("[Auth XHR] Cancelled or error in modal:", error.message);
            // Em XHR, não podemos simplesmente lançar o erro como no fetch.
            // Podemos disparar um evento de erro ou abortar. Abortar é mais simples.
            console.error("Abortando requisição XHR devido a erro/cancelamento na autenticação.");
            xhr.abort(); // Aborta a requisição XHR
            // Poderia também disparar um evento de erro:
            // xhr.dispatchEvent(new ProgressEvent('error', { detail: error }));
            return; // Interrompe a execução aqui
        }
    } else {
        // Chama o método original se não precisar de autenticação
        originalXhrSend.apply(xhr, arguments);
    }
};

document.addEventListener('DOMContentLoaded', createPasswordModal);