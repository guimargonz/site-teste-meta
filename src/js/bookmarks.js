// Constante para a URL da API
const API_URL = `http://${window.location.hostname}:3000/bookmarks`;

// Função para carregar os bookmarks do servidor
async function loadBookmarks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const bookmarksData = await response.json();

        // ... (resto do código de loadBookmarks permanece o mesmo) ...
        // Limpar o conteúdo atual
        const container = document.getElementById('bookmarks-container');
        container.innerHTML = '';

        // Agrupar bookmarks por categoria
        const categories = {};
        bookmarksData.forEach(bookmark => {
            if (!categories[bookmark.category]) {
                categories[bookmark.category] = [];
            }
            categories[bookmark.category].push(bookmark);
        });

        // Atualizar o dropdown de categorias
        updateCategoryDropdown(Object.keys(categories));

        // Criar elementos para cada categoria
        Object.keys(categories).forEach(category => {
            const categorySection = document.createElement('section');
            categorySection.className = 'about-site bookmark-category';

            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = category;
            categorySection.appendChild(categoryTitle);

            // Substituir a lista por um grid de botões
            const linksContainer = document.createElement('div');
            linksContainer.className = 'buttons-container';

            // Adicionar cada link como um botão
            categories[category].forEach((bookmark) => {
                const linkContainer = document.createElement('div');
                linkContainer.className = 'link-container';

                // Criar o link como um botão
                const a = document.createElement('a');
                a.href = bookmark.url;
                a.target = '_blank';
                a.textContent = bookmark.title;
                a.className = 'btn btn-primary bookmark-link';
                a.setAttribute('data-title', bookmark.title.toLowerCase());

                linkContainer.appendChild(a);

                // Adicionar botões de edição, cópia e exclusão
                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'button-group';

                const editButton = document.createElement('button');
                editButton.className = 'btn edit-button';
                editButton.textContent = 'Editar';
                editButton.onclick = () => toggleEditForm(bookmark.id);

                const copyButton = document.createElement('button');
                copyButton.className = 'btn copy-button';
                copyButton.textContent = 'Copiar URL';
                copyButton.onclick = () => copyBookmarkUrl(bookmark.url);

                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn delete-button';
                deleteButton.textContent = 'Excluir';
                deleteButton.onclick = () => deleteBookmark(bookmark.id);

                buttonGroup.appendChild(editButton);
                buttonGroup.appendChild(copyButton);
                buttonGroup.appendChild(deleteButton);
                linkContainer.appendChild(buttonGroup);

                // Criar formulário de edição (oculto por padrão)
                const editForm = document.createElement('div');
                editForm.className = 'edit-form';
                editForm.id = `editForm-${bookmark.id}`;
                editForm.style.display = 'none';

                // Criar dropdown de categorias para o formulário de edição
                const categoryOptions = Object.keys(categories).map(cat =>
                    `<option value="${cat}" ${cat === bookmark.category ? 'selected' : ''}>${cat}</option>`
                ).join('');

                editForm.innerHTML = `
                    <form onsubmit="submitEditForm(event, '${bookmark.id}')">
                        <input type="text" id="editTitle-${bookmark.id}" value="${bookmark.title}" required>
                        <input type="text" id="editUrl-${bookmark.id}" value="${bookmark.url}" required>
                        <select id="editCategory-${bookmark.id}" required>
                            ${categoryOptions}
                            <option value="new-category">+ Nova Categoria</option>
                        </select>
                        <div id="editNewCategoryContainer-${bookmark.id}" style="display: none;">
                            <input type="text" id="editNewCategory-${bookmark.id}" placeholder="Digite a nova categoria">
                        </div>
                        <div class="edit-buttons">
                            <button type="submit" class="btn btn-primary">Salvar</button>
                            <button type="button" class="btn" onclick="toggleEditForm('${bookmark.id}')">Cancelar</button>
                        </div>
                    </form>
                `;

                linkContainer.appendChild(editForm);
                linksContainer.appendChild(linkContainer);
            });

            categorySection.appendChild(linksContainer);
            container.appendChild(categorySection);
        });

        // Configurar os eventos para os dropdowns de edição
        setupEditCategoryEvents();

    } catch (error) {
        console.error("Erro ao carregar os bookmarks:", error);
        alert(error.message || "Erro ao carregar os bookmarks. Verifique o console para mais detalhes.");
    }
}

// Função para copiar URL para a área de transferência (mantido igual, mas com tratamento de erro)
async function copyBookmarkUrl(url) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            alert("URL copiada com sucesso!");
        } else {
            // Alternativa para navegadores sem Clipboard API
            const textarea = document.createElement("textarea");
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            alert("URL copiada com sucesso!");
        }
    } catch (error) {
        console.error("Erro ao copiar URL:", error);
        alert("Erro ao copiar URL. Verifique o console para mais detalhes.");
    }
}


// Função para atualizar o dropdown de categorias (mantido igual)
function updateCategoryDropdown(categories) {
    const categoryDropdown = document.getElementById("category");
    if (!categoryDropdown) return;

    // Limpar opções existentes exceto a última (Nova Categoria)
    while (categoryDropdown.options.length > 1) {
        categoryDropdown.remove(0);
    }

    // Adicionar categorias existentes
    categories.forEach(category => {
        const option = new Option(category, category);
        categoryDropdown.add(option, 0);
    });

    // Garantir que a opção "Nova Categoria" esteja no final
    categoryDropdown.selectedIndex = 0;
}

// Função para configurar eventos dos dropdowns de edição (mantido igual)
function setupEditCategoryEvents() {
    document.querySelectorAll('[id^="editCategory-"]').forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            const id = this.id.split('-')[1];
            const newCategoryContainer = document.getElementById(`editNewCategoryContainer-${id}`);

            if (this.value === 'new-category') {
                newCategoryContainer.style.display = 'block';
            } else {
                newCategoryContainer.style.display = 'none';
            }
        });
    });
}

// Função para mostrar/esconder o campo de nova categoria (mantido igual)
function toggleNewCategoryField() {
    const categorySelect = document.getElementById('category');
    const newCategoryContainer = document.getElementById('newCategoryContainer');

    if (categorySelect.value === 'new-category') {
        newCategoryContainer.style.display = 'block';
    } else {
        newCategoryContainer.style.display = 'none';
    }
}

// Função para mostrar o formulário de adição (mantido igual)
function showAddForm() {
    document.getElementById('showAddFormBtn').style.display = 'none';
    document.getElementById('addFormContainer').style.display = 'block';
}

// Função para esconder o formulário de adição (mantido igual)
function hideAddForm() {
    document.getElementById('showAddFormBtn').style.display = 'block';
    document.getElementById('addFormContainer').style.display = 'none';
    document.getElementById('addScriptForm').reset();
    document.getElementById('newCategoryContainer').style.display = 'none';
}

// Função para adicionar um novo bookmark (COM TRATAMENTO DE ERRO)
async function addBookmark(event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const url = document.getElementById("url").value;
    let category = document.getElementById("category").value;

    // Se for nova categoria, pegar o valor do campo de texto
    if (category === 'new-category') {
        const newCategory = document.getElementById("newCategory").value.trim();
        if (!newCategory) {
            alert("Por favor, digite o nome da nova categoria.");
            return;
        }
        category = newCategory;
    }

    const newBookmark = {
        id: Date.now().toString(), // Criar um ID único baseado no timestamp
        title,
        url,
        category
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newBookmark)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadBookmarks(); // Usa await aqui
        document.getElementById("addScriptForm").reset();
        document.getElementById("newCategoryContainer").style.display = 'none';
        hideAddForm(); // Esconde o formulário após adicionar com sucesso
    } catch (error) {
        console.error("Erro ao adicionar bookmark:", error);
        alert(error.message || "Erro ao adicionar bookmark. Verifique o console para mais detalhes.");  // Usa error.message
    }
}


// Função para mostrar/esconder o formulário de edição (mantido igual)
function toggleEditForm(id) {
    const editForm = document.getElementById(`editForm-${id}`);
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

// Função para processar o formulário de edição (COM TRATAMENTO DE ERRO)
async function submitEditForm(event, id) {
    event.preventDefault();

    const newTitle = document.getElementById(`editTitle-${id}`).value;
    const newUrl = document.getElementById(`editUrl-${id}`).value;
    let newCategory = document.getElementById(`editCategory-${id}`).value;

    // Se for nova categoria, pegar o valor do campo de texto
    if (newCategory === 'new-category') {
        const categoryInput = document.getElementById(`editNewCategory-${id}`).value.trim();
        if (!categoryInput) {
            alert("Por favor, digite o nome da nova categoria.");
            return;
        }
        newCategory = categoryInput;
    }

    const updatedBookmark = {
        id,
        title: newTitle,
        url: newUrl,
        category: newCategory
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedBookmark)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        await loadBookmarks();  // Usa await aqui
    } catch (error) {
        console.error("Erro ao atualizar bookmark:", error);
        alert(error.message || "Erro ao atualizar bookmark. Verifique o console para mais detalhes."); // Usa error.message
    }
}

// Função para excluir um bookmark (COM TRATAMENTO DE ERRO)
async function deleteBookmark(id) {
    if (confirm("Tem certeza que deseja excluir este bookmark?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
            }

            await loadBookmarks(); // Usa await aqui
        } catch (error) {
            console.error("Erro ao excluir bookmark:", error);
            alert(error.message || "Erro ao excluir bookmark. Verifique o console para mais detalhes."); // Usa error.message
        }
    }
}

// Função melhorada para pesquisar bookmarks somente pelo título (mantido igual)
function searchBookmarks() {
    const query = document.getElementById("search").value.toLowerCase();
    const links = document.querySelectorAll(".bookmark-link");

    // Contador para links visíveis por categoria
    const categoryCounts = {};

    // Verifica cada link
    links.forEach(link => {
        const title = link.getAttribute('data-title');
        const linkContainer = link.closest('.link-container');
        const category = link.closest('.bookmark-category');

        // Verifica se o título contém a consulta
        const isVisible = title.includes(query);

        // Mostra ou esconde o link
        linkContainer.style.display = isVisible ? "block" : "none";

        // Atualiza o contador para esta categoria
        if (category) {
            const categoryId = category.id || category.querySelector('h2').textContent;
            if (!categoryCounts[categoryId]) {
                categoryCounts[categoryId] = 0;
            }
            if (isVisible) {
                categoryCounts[categoryId]++;
            }
        }
    });

    // Verifica se há links visíveis em cada categoria
    document.querySelectorAll('.bookmark-category').forEach(category => {
        const categoryId = category.id || category.querySelector('h2').textContent;
        category.style.display = categoryCounts[categoryId] > 0 ? "block" : "none";
    });
}

// Inicialização ao carregar a página (mantido igual)
document.addEventListener("DOMContentLoaded", () => {
    loadBookmarks();

    const form = document.getElementById("addScriptForm");
    if (form) {
        form.addEventListener("submit", addBookmark);
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

    // Configurar o dropdown de categorias no formulário principal
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        // Adicionar a opção de nova categoria
        const newOption = new Option("+ Nova Categoria", "new-category");
        categorySelect.add(newOption);

        // Adicionar evento para mostrar/esconder campo de nova categoria
        categorySelect.addEventListener('change', toggleNewCategoryField);
    }

    // Adicionar evento de pesquisa
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", searchBookmarks);
    }
});