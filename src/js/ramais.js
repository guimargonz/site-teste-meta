const API_URL = `/ramais`;

async function loadRamais() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const ramaisData = await response.json();

        const container = document.getElementById("ramais-container");
        container.innerHTML = "";

        if (ramaisData.length === 0) {
            container.innerHTML = "<p class='no-data'>Nenhum ramal cadastrado.</p>";
            return;
        }

        ramaisData.forEach((ramal, index) => {
           // ... (restante do código de criação dos elementos HTML) ...
           const div = document.createElement("div");
            div.className = "ramal";

            div.innerHTML = `
                <h2>${ramal.nome}</h2>
                <p><strong>Ramal/Telefone:</strong> ${ramal.numero}</p>
                <p><strong>Departamento:</strong> ${ramal.departamento}</p>
                <p><strong>Informações:</strong> ${ramal.info || "Nenhuma informação adicional"}</p>
                <div class="button-group">
                    <button class="edit-button" onclick="toggleEditForm(${index})">Editar</button>
                    <button class="copy-button" onclick="copyRamal(${index})">Copiar</button>
                    <button class="delete-button" onclick="deleteRamal(${index})">Excluir</button>
                </div>

                <div class="edit-form" id="editForm-${index}" style="display: none;">
                    <form onsubmit="submitEditForm(event, ${index})">
                        <input type="text" id="editNome-${index}" value="${ramal.nome}" placeholder="Nome" required>
                        <input type="text" id="editNumero-${index}" value="${ramal.numero}" placeholder="Número do Ramal" required>
                        <input type="text" id="editDepartamento-${index}" value="${ramal.departamento}" placeholder="Departamento" required>
                        <textarea id="editInfo-${index}" placeholder="Informações adicionais">${ramal.info || ""}</textarea>
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
        console.error("Erro ao carregar ramais:", error);
        document.getElementById("ramais-container").innerHTML =
            `<p class='error'>${error.message || "Erro ao carregar ramais. Verifique se o servidor está rodando."}</p>`; // Usa error.message
    }
}

// ... (outras funções) ...

//Função ShowAddForm e hideAddForm (mantidas iguais)
function showAddForm() {
    document.getElementById('showAddFormBtn').style.display = 'none';
    document.getElementById('addFormContainer').style.display = 'block';
}
function hideAddForm() {
    document.getElementById('showAddFormBtn').style.display = 'block';
    document.getElementById('addFormContainer').style.display = 'none';
    document.getElementById('addRamalForm').reset();
}

async function addRamal(event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const numero = document.getElementById("numero").value;
    const departamento = document.getElementById("departamento").value;
    const info = document.getElementById("info").value;

    const newRamal = {
        nome,
        numero,
        departamento,
        info
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRamal)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadRamais();  // Usa await
        document.getElementById("addRamalForm").reset();
        alert("Ramal adicionado com sucesso!");
        hideAddForm();
    } catch (error) {
        console.error("Erro ao adicionar ramal:", error);
        alert(error.message || "Erro ao adicionar ramal. Verifique se o servidor está rodando."); // Usa error.message
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

    const newNome = document.getElementById(`editNome-${index}`).value;
    const newNumero = document.getElementById(`editNumero-${index}`).value;
    const newDepartamento = document.getElementById(`editDepartamento-${index}`).value;
    const newInfo = document.getElementById(`editInfo-${index}`).value;

    const updatedRamal = {
        nome: newNome,
        numero: newNumero,
        departamento: newDepartamento,
        info: newInfo
    };

    try {
        const response = await fetch(`${API_URL}/${index}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRamal)
        });
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadRamais(); // Usa await aqui
        alert("Ramal atualizado com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar ramal:", error);
        alert(error.message || "Erro ao atualizar ramal. Verifique se o servidor está rodando."); // Usa error.message
    }
}

async function deleteRamal(index) {
    if (!confirm("Tem certeza que deseja excluir este ramal?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${index}`, {
            method: "DELETE"
        });
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadRamais(); // Usa await
        alert("Ramal excluído com sucesso!");
    } catch (error) {
        console.error("Erro ao excluir ramal:", error);
        alert(error.message || "Erro ao excluir ramal. Verifique se o servidor está rodando."); // Usa error.message
    }
}

async function copyRamal(index) {
    try {
        const response = await fetch(API_URL);
         if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const ramaisData = await response.json();
        if (index < 0 || index >= ramaisData.length) return;

        const ramal = ramaisData[index];
        const textToCopy = `Nome: ${ramal.nome}\nRamal: ${ramal.numero}\nDepartamento: ${ramal.departamento}${ramal.info ? '\nInformações: ' + ramal.info : ''}`;

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(textToCopy);
            alert("Informações do ramal copiadas com sucesso!");
         } else {
            // Alternativa
            const textarea = document.createElement("textarea");
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            alert("Informações do ramal copiadas com sucesso!");
        }
    } catch (error) {
        console.error("Erro ao copiar ramal:", error);
        alert(error.message || "Erro ao copiar informações do ramal."); // Usa error.message
    }
}

function searchRamais() {
    const query = document.getElementById("search").value.toLowerCase();
    const ramais = document.querySelectorAll(".ramal");

    ramais.forEach(ramal => {
        const nome = ramal.querySelector("h2").textContent.toLowerCase();
        const departamento = ramal.querySelectorAll("p")[1].textContent.toLowerCase();
        const numero = ramal.querySelectorAll("p")[0].textContent.toLowerCase();

        if (nome.includes(query) || departamento.includes(query) || numero.includes(query)) {
            ramal.style.display = "block";
        } else {
            ramal.style.display = "none";
        }
    });
}
//Mantido, pois não tem fetch
document.addEventListener("DOMContentLoaded", () => {
    loadRamais();
    const form = document.getElementById("addRamalForm");
    if (form) {
        form.addEventListener("submit", addRamal);
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
        searchInput.addEventListener("input", searchRamais);
    }
});