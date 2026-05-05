// Vodafone Sales Organizer - script.js (versão completa e funcional)

let sales = [];
let currentEditIndex = -1;
const STORAGE_KEY = 'vodafone_sales_data';

// ---- Elementos do DOM ----
const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('searchInput');
const salesBody = document.getElementById('salesBody');
const summaryRow = document.getElementById('summaryRow');
const totalComissao = document.getElementById('totalComissao');
const modal = document.getElementById('modal');
const salesForm = document.getElementById('salesForm');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');

const clientName = document.getElementById('clientName');
const packageDesc = document.getElementById('packageDesc');
const price = document.getElementById('price');
const iban = document.getElementById('iban');
const idPhotoInput = document.getElementById('idPhoto');
const nosBillInput = document.getElementById('nosBill');
const idPhotoPreview = document.getElementById('idPhotoPreview');
const nosBillPreview = document.getElementById('nosBillPreview');

// ---- Inicialização ----
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderTable();
    setupEventListeners();
});

function setupEventListeners() {
    addBtn.addEventListener('click', () => openModal(-1));
    searchInput.addEventListener('input', renderTable);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    idPhotoInput.addEventListener('change', handleIdPhoto);
    nosBillInput.addEventListener('change', handleNosBill);
    salesForm.addEventListener('submit', handleSubmit);
}

// ---- Persistência ----
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            sales = JSON.parse(data);
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            sales = [];
        }
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    } catch (e) {
        alert('❌ Armazenamento cheio! As fotos podem ser muito grandes.\nReduza o tamanho das imagens ou elimine algumas vendas.');
        console.error('Erro ao guardar:', e);
    }
}

// ---- Lógica de negócio ----
function calcularComissao(preco) {
    return (parseFloat(preco) * 2) + 5;
}

function atualizarSumario() {
    const total = sales.reduce((soma, venda) => soma + calcularComissao(venda.price), 0);
    totalComissao.textContent = total.toFixed(2) + ' €';
    summaryRow.style.display = sales.length ? 'table-row' : 'none';
}

// ---- Renderização da tabela ----
function renderTable() {
    const termo = searchInput.value.toLowerCase().trim();
    const filtradas = termo
        ? sales.filter(v => v.clientName.toLowerCase().includes(termo))
        : sales;

    salesBody.innerHTML = '';

    if (filtradas.length === 0) {
        salesBody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhuma proposta encontrada.</td></tr>`;
        atualizarSumario();
        return;
    }

    filtradas.forEach(venda => {
        const idxGlobal = sales.indexOf(venda);
        const comissao = calcularComissao(venda.price);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(venda.clientName)}</td>
            <td>${escapeHtml(venda.packageDesc)}</td>
            <td>€${parseFloat(venda.price).toFixed(2)}</td>
            <td><strong>€${comissao.toFixed(2)}</strong></td>
            <td>${escapeHtml(venda.iban.slice(0,4) + '...' + venda.iban.slice(-4))}</td>
            <td>
                <div class="photo-thumbs">
                    ${venda.idPhoto ? `<img src="${venda.idPhoto}" alt="Cartão Cidadão" onclick="abrirImagem('${venda.idPhoto}')">` : ''}
                    ${venda.nosBill ? `<img src="${venda.nosBill}" alt="Fatura NOS" onclick="abrirImagem('${venda.nosBill}')">` : ''}
                </div>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editarVenda(${idxGlobal})" title="Editar">✏️</button>
                <button class="action-btn delete-btn" onclick="eliminarVenda(${idxGlobal})" title="Eliminar">🗑️</button>
            </td>
        `;
        salesBody.appendChild(tr);
    });

    atualizarSumario();
}

// ---- Modal ----
function openModal(indice) {
    currentEditIndex = indice;
    modal.style.display = 'block';
    modalTitle.textContent = indice === -1 ? 'Nova Proposta' : 'Editar Proposta';
    salesForm.reset();
    idPhotoPreview.style.display = 'none';
    nosBillPreview.style.display = 'none';

    if (indice > -1) {
        const v = sales[indice];
        clientName.value = v.clientName;
        packageDesc.value = v.packageDesc;
        price.value = v.price;
        iban.value = v.iban;

        if (v.idPhoto) {
            idPhotoPreview.src = v.idPhoto;
            idPhotoPreview.style.display = 'block';
        }
        if (v.nosBill) {
            nosBillPreview.src = v.nosBill;
            nosBillPreview.style.display = 'block';
        }
    }

    clientName.focus();
}

function closeModal() {
    modal.style.display = 'none';
    currentEditIndex = -1;
}

// ---- Processamento de imagens (com compressão amigável) ----
function processarFicheiro(file, previewImg) {
    return new Promise((resolve) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Redimensionar para no máximo 400px de largura (poupa imenso espaço)
                const MAX_WIDTH = 400;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // qualidade 70%
                previewImg.src = compressedDataUrl;
                previewImg.style.display = 'block';
                resolve(compressedDataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function handleIdPhoto(e) {
    const base64 = await processarFicheiro(e.target.files[0], idPhotoPreview);
    // Guardamos temporariamente; será recolhido no submit
    e.target._dataUrl = base64;
}
async function handleNosBill(e) {
    const base64 = await processarFicheiro(e.target.files[0], nosBillPreview);
    e.target._dataUrl = base64;
}

// ---- Submeter formulário ----
async function handleSubmit(e) {
    e.preventDefault();

    // Obtém as imagens comprimidas (ou mantém as anteriores se não foram alteradas)
    const novaIdPhoto = idPhotoInput._dataUrl || (currentEditIndex > -1 ? sales[currentEditIndex].idPhoto : null);
    const novaNosBill = nosBillInput._dataUrl || (currentEditIndex > -1 ? sales[currentEditIndex].nosBill : null);

    const novaVenda = {
        clientName: clientName.value.trim(),
        packageDesc: packageDesc.value.trim(),
        price: price.value,
        iban: iban.value.trim(),
        idPhoto: novaIdPhoto || null,
        nosBill: novaNosBill || null
    };

    if (currentEditIndex === -1) {
        sales.unshift(novaVenda);
    } else {
        sales[currentEditIndex] = novaVenda;
    }

    saveData();
    renderTable();
    closeModal();

    // Limpar dados temporários dos inputs
    idPhotoInput._dataUrl = undefined;
    nosBillInput._dataUrl = undefined;
}

// ---- Ações da tabela ----
function editarVenda(indice) {
    openModal(indice);
}

function eliminarVenda(indice) {
    if (confirm('Tem a certeza que quer eliminar esta proposta?')) {
        sales.splice(indice, 1);
        saveData();
        renderTable();
    }
}

function abrirImagem(src) {
    const imgModal = document.createElement('div');
    imgModal.className = 'modal';
    imgModal.style.display = 'flex';
    imgModal.style.alignItems = 'center';
    imgModal.style.justifyContent = 'center';
    imgModal.style.background = 'rgba(0,0,0,0.9)';
    imgModal.innerHTML = `
        <span style="position:fixed; top:20px; right:30px; color:white; font-size:3rem; cursor:pointer" onclick="this.parentElement.remove()">&times;</span>
        <img src="${src}" style="max-width:90%; max-height:90%; object-fit:contain;">
    `;
    document.body.appendChild(imgModal);
}

function escapeHtml(texto) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return texto.replace(/[&<>"']/g, m => map[m]);
}