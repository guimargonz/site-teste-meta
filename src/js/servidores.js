const SERVER_API_URL = `/servidores`;

async function loadServidores() {
    try {
        const response = await fetch(SERVER_API_URL);
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const servidoresData = await response.json();

        const container = document.getElementById("scripts-container");
        container.innerHTML = "";

        servidoresData.forEach((processo, index) => {
           // ... (restante do código de criação dos elementos HTML) ...
           const div = document.createElement("div");
            div.className = "script";

            div.innerHTML = `
                <h2>${processo.title}</h2>
                <p class="info">${processo.info}</p>
                <div class="button-group">
                    <button class="edit-button" onclick="toggleEditForm(${index})">Editar</button>
                    <button class="copy-button" onclick="copyProcesso(${index})">Copiar</button>
                </div>

                <div class="edit-form" id="editForm-${index}" style="display: none;">
                    <form onsubmit="submitEditForm(event, ${index})">
                        <input type="text" id="editTitle-${index}" value="${processo.title}" required>
                        <textarea id="editInfo-${index}" required>${processo.info}</textarea>
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
        console.error("Erro ao carregar os processos:", error);
        const container = document.getElementById("scripts-container");
        container.innerHTML = `<p>${error.message || "Erro ao carregar os processos. Verifique se o servidor está rodando."}</p>`; // Usa error.message
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

async function addProcesso(event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const info = document.getElementById("info").value;

    const newProcesso = {
        title,
        info
    };

    try {
        const response = await fetch(SERVER_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProcesso)
        });

        if(!response.ok) {
             const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadServidores();
        document.getElementById("addScriptForm").reset();
        hideAddForm(); // Esconde o formulário após adicionar com sucesso
    } catch (error) {
        console.error("Erro ao adicionar processo:", error);
        alert(error.message || "Erro ao adicionar processo. Verifique se o servidor está rodando.");
    }
}

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

async function submitEditForm(event, index) {
    event.preventDefault();

    const newTitle = document.getElementById(`editTitle-${index}`).value;
    const newInfo = document.getElementById(`editInfo-${index}`).value;

    const updatedProcesso = {
        title: newTitle,
        info: newInfo
    };

    try {
        const response = await fetch(`${SERVER_API_URL}/${index}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedProcesso)
        });

        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        await loadServidores();
    } catch (error) {
        console.error("Erro ao atualizar processo:", error);
        alert(error.message || "Erro ao atualizar processo. Verifique se o servidor está rodando.");
    }
}

async function copyProcesso(index) {
    try {
        const response = await fetch(SERVER_API_URL);
        if(!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const servidoresData = await response.json();
        if (index < 0 || index >= servidoresData.length) return;

        const processo = servidoresData[index];
        const textToCopy = processo.info;

        if (navigator.clipboard) {
           await navigator.clipboard.writeText(textToCopy);
           alert("Instruções copiadas com sucesso!");
        } else {
            // Alternativa para navegadores sem Clipboard API
            const textarea = document.createElement("textarea");
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            alert("Instruções copiadas com sucesso!");
        }
    } catch (error) {
        console.error("Erro ao copiar processo:", error);
        alert(error.message || "Erro ao copiar instruções.");
    }
}

function searchScripts() {
    const query = document.getElementById("search").value.toLowerCase();
    const scripts = document.querySelectorAll(".script");

    scripts.forEach(script => {
        const title = script.querySelector("h2").textContent.toLowerCase();
        const info = script.querySelector(".info").textContent.toLowerCase();
        script.style.display = title.includes(query) || info.includes(query) ? "block" : "none";
    });
}
//Mantido, pois não tem fetch
document.addEventListener("DOMContentLoaded", () => {
    loadServidores();
    const form = document.getElementById("addScriptForm");
    if (form) {
        form.addEventListener("submit", addProcesso);
    }
    // Adiciona o evento de busca
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", searchScripts);
    }
});