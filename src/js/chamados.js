// URL da API para os scripts de chamados
const API_URL = `/chamados`;

// Função para carregar os scripts de chamados
async function loadScripts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const chamados = await response.json();

        const container = document.getElementById("scripts-container");
        container.innerHTML = "";

        if (chamados.length === 0) {
            container.innerHTML = `<p class="no-scripts">Nenhum script de chamado cadastrado ainda.</p>`;
            return;
        }

        chamados.forEach((chamado, index) => {
            const div = document.createElement("div");
            div.className = "script-card";

            div.innerHTML = `
                <div class="script-header">
                    <h3>${chamado.title}</h3>
                    <div class="button-group">
                        <button class="edit-button" onclick="toggleEditForm(${index})">Editar</button>
                        <button class="copy-button" onclick="copyScript(${index})">Copiar</button>
                        <button class="delete-button" onclick="deleteScript(${index})">Excluir</button>
                    </div>
                </div>
                <div class="script-content">
                    <pre>${chamado.content}</pre>
                </div>

                <div class="edit-form" id="editForm-${index}" style="display: none;">
                    <form onsubmit="submitEditForm(event, ${index})">
                        <div class="form-group">
                            <label for="editTitle-${index}">Título:</label>
                            <input type="text" id="editTitle-${index}" value="${chamado.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="editContent-${index}">Conteúdo do Script:</label>
                            <textarea id="editContent-${index}" rows="5" required>${chamado.content}</textarea>
                        </div>
                        <div class="edit-buttons">
                            <button type="submit" class="save-button">Salvar</button>
                            <button type="button" class="cancel-button" onclick="toggleEditForm(${index})">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;

            container.appendChild(div);
        });
    } catch (error) {
        console.error("Erro ao carregar scripts de chamados:", error);
        const container = document.getElementById("scripts-container");
        container.innerHTML = `<p class="error-message">${error.message || "Erro ao carregar scripts. Verifique se o servidor está rodando."}</p>`;
    }
}

// Função para mostrar o formulário de adição
function showAddForm() {
    document.getElementById('showAddFormBtn').style.display = 'none';
    document.getElementById('addFormContainer').style.display = 'block';
}

// Função para esconder o formulário de adição
function hideAddForm() {
    document.getElementById('showAddFormBtn').style.display = 'block';
    document.getElementById('addFormContainer').style.display = 'none';
    document.getElementById('addScriptForm').reset();
}

// Função para adicionar um novo script de chamado
async function addScript(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("scriptContent").value.trim();

    if (!title || !content) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const newScript = {
        title,
        content
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newScript)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadScripts();
        document.getElementById("addScriptForm").reset();
        alert("Script adicionado com sucesso!");
        hideAddForm(); // Esconde o formulário após adicionar com sucesso
    } catch (error) {
        console.error("Erro ao adicionar script:", error);
        alert(error.message || "Não foi possível adicionar o script. Verifique se o servidor está rodando.");
    }
}
// Função para mostrar/esconder o formulário de edição
function toggleEditForm(index) {
    const editForm = document.getElementById(`editForm-${index}`);
    if (editForm.style.display === "none") {
        // Esconde todos os outros formulários de edição primeiro
        document.querySelectorAll('.edit-form').forEach(form => {
            form.style.display = "none";
        });
        // Mostra o formulário atual
        editForm.style.display = "block";
    } else {
        editForm.style.display = "none";
    }
}

// Função para processar o formulário de edição
async function submitEditForm(event, index) {
    event.preventDefault();

    const newTitle = document.getElementById(`editTitle-${index}`).value.trim();
    const newContent = document.getElementById(`editContent-${index}`).value.trim();

    if (!newTitle || !newContent) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const updatedScript = {
        title: newTitle,
        content: newContent
    };

    try {
        const response = await fetch(`${API_URL}/${index}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedScript)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadScripts();
        toggleEditForm(index); // Esconde o formulário após salvar
        alert("Script atualizado com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar script:", error);
        alert(error.message || "Não foi possível atualizar o script. Verifique se o servidor está rodando.");
    }
}

// Função para excluir um script
async function deleteScript(index) {
    if (!confirm("Tem certeza que deseja excluir este script?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${index}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        await loadScripts();
        alert("Script excluído com sucesso!");
    } catch (error) {
        console.error("Erro ao excluir script:", error);
        alert(error.message || "Não foi possível excluir o script. Verifique se o servidor está rodando.");
    }
}

// Função para copiar o conteúdo do script
async function copyScript(index) {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const chamados = await response.json();

        if (index < 0 || index >= chamados.length) {
            throw new Error("Índice inválido");
        }

        const script = chamados[index];
        const textToCopy = script.content;

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(textToCopy);
            alert("Script copiado com sucesso!");
        } else {
            // Alternativa para navegadores sem Clipboard API
            const textarea = document.createElement("textarea");
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            alert("Script copiado com sucesso!");
        }
    } catch (error) {
        console.error("Erro ao copiar script:", error);
        alert(error.message || "Não foi possível copiar o script.");
    }
}


// Função de busca de scripts
function searchScripts() {
    const query = document.getElementById("search").value.toLowerCase().trim();
    const scriptCards = document.querySelectorAll(".script-card");

    if (scriptCards.length === 0) return;

    scriptCards.forEach(card => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        const content = card.querySelector("pre").textContent.toLowerCase();

        // Busca em título e conteúdo
        const matches = title.includes(query) || content.includes(query);
        card.style.display = matches ? "block" : "none";
    });
}

// Inicializa a página
document.addEventListener("DOMContentLoaded", () => {
    loadScripts();

    // Configura o formulário de adição
    const form = document.getElementById("addScriptForm");
    if (form) {
        form.addEventListener("submit", addScript);
    }

    // Adicionar listener para o botão de mostrar formulário
    const showFormBtn = document.getElementById('showAddFormBtn');
    if (showFormBtn) {
        showFormBtn.addEventListener('click', showAddForm);
    }

    // Adicionar listener para o botão de cancelar
    const cancelBtn = document.getElementById('cancelAddBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAddForm);
    }

    // Configura a busca
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", searchScripts);
    }
});