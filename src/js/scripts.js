const API_URL = `http://${window.location.hostname}:3000/scripts`;

async function loadScripts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const scriptsData = await response.json();

        const container = document.getElementById("scripts-container");
        container.innerHTML = "";

        scriptsData.forEach((script, index) => {
          // ... (restante do código de criação dos elementos HTML) ...
          const div = document.createElement("div");
            div.className = "script";

            div.innerHTML = `
                <h2>${script.title}</h2>
                <p class="status s">S - ${script.status.S}</p>
                <p class="status d">D - ${script.status.D}</p>
                <p class="status a">A - ${script.status.A}</p>
                <div class="button-group">
                    <button class="edit-button" onclick="toggleEditForm(${index})">Editar</button>
                    <button class="copy-button" onclick="copyScript(${index})">Copiar</button>
                </div>

                <div class="edit-form" id="editForm-${index}" style="display: none;">
                    <form onsubmit="submitEditForm(event, ${index})">
                        <input type="text" id="editTitle-${index}" value="${script.title}" required>
                        <input type="text" id="editStatusS-${index}" value="${script.status.S}" required>
                        <input type="text" id="editStatusD-${index}" value="${script.status.D}" required>
                        <input type="text" id="editStatusA-${index}" value="${script.status.A}" required>
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
        console.error("Erro ao carregar scripts:", error);
        const container = document.getElementById("scripts-container");
        container.innerHTML = `<p class='error'>${error.message || "Erro ao carregar scripts. Verifique se o servidor está rodando."}</p>`;
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

//Funções desnecessárias
//   // Para adicionar um script
//   async function addScript(scriptData) {
//     const response = await fetch('/scripts', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(scriptData)
//     });

//     if (response) {
//       const result = await response.json();
//       return result;
//     }
//     return null;
//   }

//   // Para atualizar um script
//   async function updateScript(index, scriptData) {
//     const response = await fetch(`/scripts/${index}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(scriptData)
//     });

//     if (response) {
//       const result = await response.json();
//       return result;
//     }
//     return null;
//   }

async function addScript(event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const statusS = document.getElementById("statusS").value;
    const statusD = document.getElementById("statusD").value;
    const statusA = document.getElementById("statusA").value;

    const newScript = {
        title,
        status: { S: statusS, D: statusD, A: statusA }
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

        await loadScripts(); // Usa await aqui
        document.getElementById("addScriptForm").reset();
        hideAddForm(); // Esconde o formulário após adicionar com sucesso
    } catch (error) {
        console.error("Erro ao adicionar script:", error);
        alert(error.message || "Erro ao adicionar script. Verifique se o servidor está rodando.");
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
    const newStatusS = document.getElementById(`editStatusS-${index}`).value;
    const newStatusD = document.getElementById(`editStatusD-${index}`).value;
    const newStatusA = document.getElementById(`editStatusA-${index}`).value;

    const updatedScript = {
        title: newTitle,
        status: { S: newStatusS, D: newStatusD, A: newStatusA }
    };

    try {
        const response = await fetch(`${API_URL}/${index}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedScript)
        });

        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        await loadScripts(); //Usa await aqui
    }
    catch(error) {
        console.error("Erro ao atualizar script:", error);
        alert(error.message || "Erro ao atualizar script. Verifique se o servidor está rodando.");
    }
}

// A função original de edição que usava prompts (mantida para compatibilidade, mas não é mais usada)
//Desnecessária
// async function editScript(index, title, statusS, statusD, statusA) {
//     const newTitle = prompt("Novo título:", title);
//     const newStatusS = prompt("Novo valor para S:", statusS);
//     const newStatusD = prompt("Novo valor para D:", statusD);
//     const newStatusA = prompt("Novo valor para A:", statusA);

//     if (newTitle !== null && newStatusS !== null && newStatusD !== null && newStatusA !== null) {
//         const updatedScript = {
//             title: newTitle,
//             status: { S: newStatusS, D: newStatusD, A: newStatusA }
//         };

//         await fetch(`${API_URL}/${index}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(updatedScript)
//         });

//         loadScripts();
//     }
// }

async function copyScript(index) {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const scriptsData = await response.json();
        if (index < 0 || index >= scriptsData.length) return;

        const script = scriptsData[index];
        const textToCopy = `S - ${script.status.S}\nD - ${script.status.D}\nA - ${script.status.A}`;

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
        alert(error.message || "Erro ao copiar script.");
    }
}


function searchScripts() {
    const query = document.getElementById("search").value.toLowerCase();
    const scripts = document.querySelectorAll(".script");

    scripts.forEach(script => {
        const title = script.querySelector("h2").textContent.toLowerCase();
        script.style.display = title.includes(query) ? "block" : "none";
    });
}

//Mantido
document.addEventListener("DOMContentLoaded", () => {
    loadScripts();
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

    // Adiciona o evento de busca
    document.getElementById("search").addEventListener("input", searchScripts);
});