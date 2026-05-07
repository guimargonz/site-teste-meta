const API_URL = `/senhas`;

// Função para carregar as senhas (sem a senha real)
async function loadSenhas() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const senhasData = await response.json(); // Dados sem o campo 'password'

        const container = document.getElementById("senhas-container");
        container.innerHTML = ""; // Limpa o container

        if (senhasData.length === 0) {
            container.innerHTML = `<p class="no-data">Nenhuma senha cadastrada.</p>`;
            return;
        }

        senhasData.forEach((senha) => { // Não precisamos do index aqui
            const div = document.createElement("div");
            div.className = "senha-entry"; // Classe CSS para estilização
            div.setAttribute('data-id', senha.id); // Guarda o ID

            div.innerHTML = `
                <div class="senha-details">
                    <h3>${senha.title}</h3>
                    ${senha.username ? `<p><strong>Usuário:</strong> ${senha.username}</p>` : ''}
                    <p><strong>Senha:</strong> <span class="password-hidden">••••••••</span></p>
                </div>
                <div class="button-group">
                    <button class="btn copy-button" onclick="copyPassword('${senha.id}')">Copiar Senha</button>
                    <button class="btn edit-button" onclick="toggleEditForm('${senha.id}')">Editar</button>
                    <button class="btn delete-button" onclick="deleteSenha('${senha.id}')">Excluir</button>
                </div>

                <div class="edit-form" id="editForm-${senha.id}" style="display: none;">
                    <form onsubmit="submitEditForm(event, '${senha.id}')">
                         <div class="form-group">
                            <label for="editTitle-${senha.id}">Título/Serviço:</label>
                            <input type="text" id="editTitle-${senha.id}" value="${senha.title}" required>
                        </div>
                         <div class="form-group">
                            <label for="editUsername-${senha.id}">Usuário (opcional):</label>
                            <input type="text" id="editUsername-${senha.id}" value="${senha.username || ''}">
                        </div>
                        <div class="form-group">
                            <label for="editPassword-${senha.id}">Nova Senha:</label>
                            <input type="password" id="editPassword-${senha.id}" placeholder="Deixe em branco para não alterar" >
                        </div>
                        <div class="edit-buttons">
                            <button type="submit" class="save-button">Salvar</button>
                            <button type="button" class="cancel-button" onclick="toggleEditForm('${senha.id}')">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao carregar senhas:", error);
        const container = document.getElementById("senhas-container");
        container.innerHTML = `<p class='error'>${error.message || "Erro ao carregar senhas. Verifique o console e se o servidor está rodando."}</p>`;
    }
}

// Função para copiar a senha (requer autenticação)
async function copyPassword(id) {
    try {
        // Faz a requisição AUTENTICADA para obter a senha real
        const response = await fetch(`${API_URL}/${id}/reveal`); // Rota específica

        if (!response.ok) {
            // Se for 401, o autenticacao.js já deve ter mostrado a modal ou falhado
            if (response.status === 401) {
                // A modal de autenticação falhou ou foi cancelada, o erro já foi tratado no autenticacao.js
                // Podemos opcionalmente mostrar uma mensagem aqui, mas o erro principal já foi lançado.
                console.log("Falha na autenticação ou cancelado.");
                alert("Autenticação falhou ou foi cancelada."); // Opcional
                return; // Interrompe a execução aqui
            }
            // Outros erros do servidor
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const { password } = await response.json(); // Extrai a senha da resposta

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(password);
            alert("Senha copiada para a área de transferência!");
        } else {
            // Fallback para navegadores antigos
            const textarea = document.createElement("textarea");
            textarea.value = password;
            textarea.style.position = "absolute";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            alert("Senha copiada para a área de transferência!");
        }

    } catch (error) {
        // Trata erros lançados pela falha na autenticação ou outros erros de fetch/servidor
        console.error("Erro ao copiar senha:", error);
        if (error.message !== 'Operação cancelada: senha não fornecida' && error.message !== 'Operação cancelada pelo usuário') {
            // Mostra alerta apenas se não for erro de cancelamento (que já é tratado no autenticacao.js)
            alert(error.message || "Não foi possível copiar a senha. Verifique o console.");
        }
    }
}


// Função para mostrar o formulário de adição
function showAddForm() {
    document.getElementById('showAddFormBtn').style.display = 'none';
    document.getElementById('addFormContainer').style.display = 'block';
    document.getElementById('addSenhaForm').reset(); // Limpa o form
    // Garante que o campo de senha esteja como tipo password
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('togglePasswordVisibility');
    if (passwordInput) passwordInput.type = 'password';
    if (toggleButton) toggleButton.textContent = 'Mostrar';
}

// Função para esconder o formulário de adição
function hideAddForm() {
    document.getElementById('showAddFormBtn').style.display = 'block';
    document.getElementById('addFormContainer').style.display = 'none';
    document.getElementById('addSenhaForm').reset();
}

// Função para adicionar uma nova senha
async function addSenha(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value; // Não faz trim na senha

    if (!title || !password) {
        alert("Título e Senha são obrigatórios.");
        return;
    }

    const newSenha = {
        id: Date.now().toString(), // Gera ID no cliente
        title,
        username: username || undefined, // Envia undefined se vazio
        password
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSenha)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadSenhas();
        hideAddForm();
        alert("Senha adicionada com sucesso!");

    } catch (error) {
        console.error("Erro ao adicionar senha:", error);
        alert(error.message || "Não foi possível adicionar a senha. Verifique o console.");
    }
}

// Função para mostrar/esconder formulário de edição
function toggleEditForm(id) {
    const editForm = document.getElementById(`editForm-${id}`);
    const senhaEntry = document.querySelector(`.senha-entry[data-id='${id}']`);
    const detailsDiv = senhaEntry?.querySelector('.senha-details');
    const buttonGroup = senhaEntry?.querySelector('.button-group');

    if (editForm.style.display === "none") {
        // Esconde todos os outros forms
        document.querySelectorAll('.edit-form').forEach(form => form.style.display = 'none');
        document.querySelectorAll('.senha-details').forEach(div => div.style.display = 'block');
        document.querySelectorAll('.button-group').forEach(bg => bg.style.display = 'flex'); // ou o display original

        // Mostra o form atual e esconde detalhes/botões normais
        editForm.style.display = "block";
        if (detailsDiv) detailsDiv.style.display = 'none';
        if (buttonGroup) buttonGroup.style.display = 'none';
        // Limpa o campo de senha de edição
        const editPasswordInput = document.getElementById(`editPassword-${id}`);
        if (editPasswordInput) editPasswordInput.value = '';

    } else {
        // Esconde o form atual e mostra detalhes/botões
        editForm.style.display = "none";
        if (detailsDiv) detailsDiv.style.display = 'block';
        if (buttonGroup) buttonGroup.style.display = 'flex';
    }
}


// Função para submeter a edição
async function submitEditForm(event, id) {
    event.preventDefault();

    const title = document.getElementById(`editTitle-${id}`).value.trim();
    const username = document.getElementById(`editUsername-${id}`).value.trim();
    const password = document.getElementById(`editPassword-${id}`).value; // Pega a nova senha

    if (!title) {
        alert("Título é obrigatório.");
        return;
    }

    // Monta o corpo da requisição apenas com os campos a serem atualizados
    // Precisamos pegar o objeto original para manter campos não editados (como o ID)
    // e decidir se a senha deve ser atualizada.
    try {
        // Fetch os dados atuais para obter a senha original se não for alterada
        // NOTA: Isso faz uma requisição GET extra, o que não é ideal.
        // Uma abordagem melhor seria buscar todos os dados em loadSenhas e guardá-los
        // em uma variável global ou passar os dados completos para toggleEditForm.
        // Para simplificar aqui, vamos assumir que a rota PUT no backend lida
        // com a atualização parcial ou que sempre enviamos todos os campos.
        // A rota PUT já está configurada para manter o ID original.

        const updatedSenhaData = {
            title,
            username: username || undefined
            // A senha só será incluída se o campo não estiver vazio
        };

        if (password) { // Só inclui a senha se uma nova foi digitada
            updatedSenhaData.password = password;
        } else {
            // Se a senha ficou em branco, NÃO a enviamos,
            // assim o backend NÃO a atualizará.
            // O backend precisaria ser inteligente para ignorar `password` se não presente.
            // OU, buscar a senha antiga aqui e reenviá-la se o campo estiver vazio.
            // Vamos assumir que o backend ignora se não for enviado.
            console.warn("Campo de senha de edição vazio. A senha não será alterada.");
        }


        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedSenhaData) // Envia apenas os dados atualizados
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadSenhas();
        // toggleEditForm(id); // Esconde o form após salvar com sucesso
        alert("Senha atualizada com sucesso!");

    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        alert(error.message || "Não foi possível atualizar a senha. Verifique o console.");
    }
}


// Função para excluir uma senha
async function deleteSenha(id) {
    if (confirm("Tem certeza que deseja excluir esta entrada de senha?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
            }

            await loadSenhas();
            alert("Senha excluída com sucesso!");

        } catch (error) {
            console.error("Erro ao excluir senha:", error);
            alert(error.message || "Não foi possível excluir a senha. Verifique o console.");
        }
    }
}

// Função de busca
function searchSenhas() {
    const query = document.getElementById("search").value.toLowerCase().trim();
    const senhaEntries = document.querySelectorAll(".senha-entry");

    senhaEntries.forEach(entry => {
        const title = entry.querySelector("h3").textContent.toLowerCase();
        const usernameElement = entry.querySelector("p > strong"); // Busca pelo strong dentro do p
        let username = '';
        if (usernameElement && usernameElement.textContent.includes('Usuário:')) {
            // Pega o texto do nó irmão seguinte ao strong (que é o valor do username)
            username = usernameElement.nextSibling ? usernameElement.nextSibling.textContent.trim().toLowerCase() : '';
        }


        const matches = title.includes(query) || username.includes(query);
        entry.style.display = matches ? "block" : "none";
    });
}

// Função para alternar visibilidade da senha no formulário de ADIÇÃO
function toggleAddPasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('togglePasswordVisibility');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = 'Ocultar';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = 'Mostrar';
    }
}


// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    loadSenhas();

    const addForm = document.getElementById("addSenhaForm");
    if (addForm) {
        addForm.addEventListener("submit", addSenha);
    }

    const showFormBtn = document.getElementById('showAddFormBtn');
    if (showFormBtn) {
        showFormBtn.addEventListener('click', showAddForm);
    }

    const cancelBtn = document.getElementById('cancelAddBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAddForm);
    }

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", searchSenhas);
    }

    // Listener para o botão de mostrar/ocultar senha no form de adição
    const toggleButton = document.getElementById('togglePasswordVisibility');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleAddPasswordVisibility);
    }
});