// Arquivo: src/js/instrucoes.js

const API_URL = `/instrucoes`;

async function loadInstrucoes() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const instrucoesData = await response.json();

        const container = document.getElementById("scripts-container");
        container.innerHTML = "";

        instrucoesData.forEach((instrucao, index) => {
            const div = document.createElement("div");
            div.className = "script";

            div.innerHTML = `
                <h2>${instrucao.title}</h2>
                <p class="info">${instrucao.info}</p>
                <div class="button-group">
                    <button class="edit-button" onclick="toggleEditForm(${index})">Editar</button>
                    <button class="copy-button" onclick="copyInstrucao(${index})">Copiar</button>
                </div>

                <div class="edit-form" id="editForm-${index}" style="display: none;">
                    <form onsubmit="submitEditForm(event, ${index})">
                        <input type="text" id="editTitle-${index}" value="${instrucao.title}" required>
                        <textarea id="editInfo-${index}" required>${instrucao.info}</textarea>
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
        console.error("Erro ao carregar instruções:", error);
        const container = document.getElementById("scripts-container");
        container.innerHTML = `<p class='error'>${error.message || "Erro ao carregar instruções. Verifique se o servidor está rodando."}</p>`;
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

async function addInstrucao(event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const info = document.getElementById("info").value;

    const newInstrucao = {
        title,
        info
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newInstrucao)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadInstrucoes();
        document.getElementById("addScriptForm").reset();
        hideAddForm(); // Esconde o formulário após adicionar com sucesso
    } catch (error) {
        console.error("Erro ao adicionar instrução:", error);
        alert(error.message || "Erro ao adicionar instrução. Verifique se o servidor está rodando.");
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

    const newTitle = document.getElementById(`editTitle-${index}`).value;
    const newInfo = document.getElementById(`editInfo-${index}`).value;

    const updatedInstrucao = {
        title: newTitle,
        info: newInfo
    };

    try {
        const response = await fetch(`${API_URL}/${index}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedInstrucao)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        await loadInstrucoes();

    } catch (error) {
        console.error("Erro ao atualizar instrução:", error);
        alert(error.message || "Erro ao atualizar instrução. Verifique se o servidor está rodando.");
    }
}

async function copyInstrucao(index) {
    try {
        const response = await fetch(API_URL);
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const instrucoesData = await response.json();
        if (index < 0 || index >= instrucoesData.length) return;

        const instrucao = instrucoesData[index];
        const textToCopy = instrucao.info;

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(textToCopy);
            alert("Instrução copiada com sucesso!");

        } else {
            // Alternativa para navegadores sem Clipboard API
            const textarea = document.createElement("textarea");
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            alert("Instrução copiada com sucesso!");
        }
    } catch (error) {
        console.error("Erro ao copiar instrução:", error);
        alert(error.message || "Erro ao copiar instrução.");
    }
}

function searchInstrucoes() {
    const query = document.getElementById("search").value.toLowerCase();
    const scripts = document.querySelectorAll(".script");

    scripts.forEach(script => {
        const title = script.querySelector("h2").textContent.toLowerCase();
        const info = script.querySelector(".info")?.textContent.toLowerCase() || "";

        script.style.display = (title.includes(query) || info.includes(query)) ? "block" : "none";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadInstrucoes();
    const form = document.getElementById("addScriptForm");
    if (form) {
        form.addEventListener("submit", addInstrucao);
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

    // Adiciona o evento de busca
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", searchInstrucoes);
    }
});