const express = require("express");
const fs = require("fs").promises; // Usando promises para async/await
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.port || 3000;

app.use(cors());
app.use(express.json());

// --- Definição dos caminhos dos arquivos ---
const filePaths = {
    sda: path.join(__dirname, "src", "data", "sda.json"),
    servidores: path.join(__dirname, "src", "data", "servidores.json"),
    ramais: path.join(__dirname, "src", "data", "ramais.json"),
    instrucoes: path.join(__dirname, "src", "data", "instrucoes.json"),
    chamados: path.join(__dirname, "src", "data", "chamados.json"),
    bookmarks: path.join(__dirname, "src", "data", "bookmarks.json"),
    senhas: path.join(__dirname, "src", "data", "senhas.json"), // Garantindo que esta linha existe e está correta
};

// --- Middleware de Autenticação ---
// Usando Authorization Basic, a senha 'helpdesk' deve ser enviada em base64
function passwordAuth(req, res, next) {
    console.log(`\n--- Auth Check ---`); // Log para iniciar a verificação
    console.log(`Method: ${req.method}, Path: ${req.path}`);
    const protectedGetRoutesPatterns = [
        /^\/senhas\/[^/]+\/reveal$/ // Regex para /senhas/:id/reveal
        // Adicione outros padrões GET protegidos aqui se necessário
    ];
    // Determina se a autenticação é necessária
    let requiresAuth = false;
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        requiresAuth = true; // Sempre requer para POST, PUT, DELETE
        console.log("Reason: Modifying method (POST/PUT/DELETE)");
    } else if (req.method === 'GET') {
        // Verifica se o path corresponde a alguma rota GET protegida
        if (protectedGetRoutesPatterns.some(pattern => pattern.test(req.path))) {
            requiresAuth = true;
            console.log("Reason: Protected GET route match");
        } else {
            console.log("Reason: Standard GET route, no auth needed.");
        }
    } else {
        console.log("Reason: Other method, no auth needed.");
    }
    console.log(`Requires Authentication: ${requiresAuth}`);
    if (requiresAuth) {
        const authHeader = req.headers.authorization;
        console.log(`Auth Header Received: ${authHeader ? authHeader.substring(0, 15) + '...' : 'None'}`); // Log do header (truncado)
        if (authHeader && authHeader.startsWith('Basic ')) {
            const base64Credentials = authHeader.split(' ')[1];
            if (!base64Credentials) {
                console.log("Auth Failed: Invalid Basic format (no credentials).");
                return res.status(401).json({ error: "Formato de autenticação inválido." });
            }
            try {
                const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                const [username, password] = credentials.split(':'); // Username é ignorado
                console.log(`Decoded Password: '${password}'`); // Log da senha decodificada
                console.log(`Comparing with 'helpdesk': ${password === 'helpdesk'}`);
                if (password === 'helpdesk') {
                    console.log("Authentication Successful.");
                    next(); // Autenticado com sucesso
                } else {
                    console.log("Auth Failed: Incorrect password.");
                    res.status(401).json({ error: "Senha incorreta." }); // Senha errada
                }
            } catch (e) {
                console.error("Auth Failed: Error decoding Base64.", e);
                return res.status(401).json({ error: "Credenciais Base64 inválidas." }); // Erro na decodificação
            }
        } else {
            console.log("Auth Failed: Header missing or not Basic.");
            res.status(401).json({ error: "Credenciais de autenticação não fornecidas ou formato inválido." });
        }
    } else {
        next(); // Não requer autenticação
    }
    console.log(`--- End Auth Check ---`);
}

app.use(passwordAuth); // Aplica o middleware globalmente

// --- Funções auxiliares (refatoradas) ---

async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, "utf8");
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // CRIA O ARQUIVO COM UM ARRAY VAZIO SE NÃO EXISTIR
            console.log(`Arquivo ${filePath} não encontrado, criando um novo.`);
            await writeJsonFile(filePath, []); // Chama a função de escrita
            return []; // Retorna o array vazio
        }
        // Se for outro erro (ex: permissão), lança o erro
        console.error(`Erro lendo ${filePath}:`, err);
        throw err;
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error(`Erro escrevendo em ${filePath}:`, err);
        throw err; // Propaga erros de escrita
    }
}

// --- Rotas (refatoradas) ---

// Função genérica para lidar com rotas CRUD
function setupCrudRoutes(routePrefix, filePath) {

    // GET (listar - Modificado para Senhas: NÃO retorna a senha)
    app.get(routePrefix, async (req, res) => {
        try {
            let data = await readJsonFile(filePath);
            // Se for a rota de senhas, remove o campo 'password' antes de enviar
            if (routePrefix === "/senhas") {
                data = data.map(({ password, ...rest }) => rest); // Remove o campo 'password'
            }
            res.json(data);
        } catch (err) {
            console.error(`Error in GET ${routePrefix}:`, err); // Adiciona log de erro no servidor
            res.status(500).json({ error: `Erro ao carregar ${routePrefix}: ${err.message}` });
        }
    });

    // POST (criar)
    app.post(routePrefix, async (req, res) => {
        try {
            // Validação específica para senhas (exemplo)
            if (routePrefix === "/senhas" && (!req.body.title || !req.body.password)) {
                return res.status(400).json({ error: "Título e senha são obrigatórios." });
            }
            if (routePrefix === "/senhas" && !req.body.id) {
                req.body.id = Date.now().toString(); // Garante um ID se não fornecido
            }

            const data = await readJsonFile(filePath);
            data.push(req.body);
            await writeJsonFile(filePath, data);
            res.status(201).json({ message: `${routePrefix.substring(1)} adicionado com sucesso!` });
        } catch (err) {
            res.status(500).json({ error: `Erro ao adicionar ${routePrefix}: ${err.message}` });
        }
    });

    // PUT (atualizar por índice ou ID)
    const paramName = (routePrefix === "/bookmarks" || routePrefix === "/senhas") ? 'id' : 'index';
    app.put(`${routePrefix}/:${paramName}`, async (req, res) => {
        try {
            const paramValue = req.params[paramName];
            const data = await readJsonFile(filePath);
            let index;

            if (paramName === 'id') {
                index = data.findIndex(item => item.id === paramValue);
            } else {
                index = parseInt(paramValue, 10);
                if (isNaN(index) || index < 0 || index >= data.length) {
                    return res.status(400).json({ error: "Índice inválido" });
                }
            }

            if (index === -1 && paramName === 'id') {
                return res.status(404).json({ error: "Item não encontrado" });
            }

            // Validação específica para senhas ao atualizar
            if (routePrefix === "/senhas" && (!req.body.title || !req.body.password)) {
                return res.status(400).json({ error: "Título e senha são obrigatórios ao atualizar." });
            }

            // Mantém o ID original ao atualizar
            const originalId = data[index].id;
            data[index] = { ...req.body, id: originalId }; // Garante que o ID não seja sobrescrito se não estiver no body

            await writeJsonFile(filePath, data);
            res.json({ message: `${routePrefix.substring(1)} atualizado com sucesso!` });

        } catch (err) {
            res.status(500).json({ error: `Erro ao atualizar ${routePrefix}: ${err.message}` });
        }
    });

    // DELETE (excluir por índice ou ID)
    app.delete(`${routePrefix}/:${paramName}`, async (req, res) => {
        try {
            const paramValue = req.params[paramName];
            const data = await readJsonFile(filePath);
            let initialLength = data.length;
            let newData;

            if (paramName === 'id') {
                newData = data.filter(item => item.id !== paramValue);
            } else {
                const index = parseInt(paramValue, 10);
                if (isNaN(index) || index < 0 || index >= data.length) {
                    return res.status(400).json({ error: "Índice inválido" });
                }
                data.splice(index, 1);
                newData = data; // A própria 'data' foi modificada
            }

            if (newData.length < initialLength) {
                await writeJsonFile(filePath, newData);
                res.json({ message: `${routePrefix.substring(1)} removido com sucesso!` });
            } else {
                res.status(404).json({ error: "Item não encontrado" });
            }
        } catch (err) {
            res.status(500).json({ error: `Erro ao remover ${routePrefix}: ${err.message}` });
        }
    });
}

// Configura as rotas CRUD para cada recurso
setupCrudRoutes("/scripts", filePaths.sda);
setupCrudRoutes("/servidores", filePaths.servidores);
setupCrudRoutes("/ramais", filePaths.ramais);
setupCrudRoutes("/instrucoes", filePaths.instrucoes);
setupCrudRoutes("/chamados", filePaths.chamados);
setupCrudRoutes("/bookmarks", filePaths.bookmarks);
setupCrudRoutes("/senhas", filePaths.senhas); // Configura rotas para senhas

// --- Rota Específica para Revelar Senha (Autenticada) ---
app.get("/senhas/:id/reveal", async (req, res) => {
    try {
        const id = req.params.id;
        const senhas = await readJsonFile(filePaths.senhas);
        const senhaEntry = senhas.find(s => s.id === id);

        if (senhaEntry) {
            res.json({ password: senhaEntry.password }); // Retorna SOMENTE a senha
        } else {
            res.status(404).json({ error: "Senha não encontrada" });
        }
    } catch (err) {
        res.status(500).json({ error: `Erro ao revelar senha: ${err.message}` });
    }
});

// --- Servir arquivos estáticos e página inicial ---
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Iniciar o servidor ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
    console.log(`Acesse de outros computadores usando: http://0.0.0.0.0:${PORT}`);
});