// Vodafone Sales Organizer - script.js
// Stores data as array of objects in localStorage

let sales = [];
let currentEditIndex = -1;

const STORAGE_KEY = 'vodafone_sales_data';

// DOM elements
const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('searchInput');
const salesBody = document.getElementById('salesBody');
const modal = document.getElementById('modal');
const salesForm = document.getElementById('salesForm');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');
const editIndexInput = document.getElementById('editIndex');

// Form fields
const clientName = document.getElementById('clientName');
const packageDesc = document.getElementById('packageDesc');
const price = document.getElementById('price');
const iban = document.getElementById('iban');
const idPhotoInput = document.getElementById('idPhoto');
const nosBillInput = document.getElementById('nosBill');
const idPhotoPreview = document.getElementById('idPhotoPreview');
const nosBillPreview = document.getElementById('nosBillPreview');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderTable();
    setupEventListeners();
});

function setupEventListeners() {
    addBtn.addEventListener('click', openModal);
    searchInput.addEventListener('input', renderTable);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    idPhotoInput.addEventListener('change', handleIdPhoto);
    nosBillInput.addEventListener('change', handleNosBill);
    
    salesForm.addEventListener('submit', handleSubmit);
}

function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        sales = JSON.parse(data);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

function renderTable(filteredSales = sales) {
    const tbody = salesBody;
    tbody.innerHTML = '';
    
    if (filteredSales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma proposta encontrada. Adicione a primeira!</td></tr>';
        return;
    }
    
    filteredSales.forEach((sale, index) => {
        const globalIndex = sales.indexOf(sale);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(sale.clientName)}</td>
            <td>${escapeHtml(sale.packageDesc)}</td>
            <td>€${parseFloat(sale.price).toFixed(2)}</td>
            <td>${escapeHtml(sale.iban.slice(0,4) + '...' + sale.iban.slice(-4))}</td>
            <td>
                <div class="photo-thumbs">
                    ${sale.idPhoto ? `<img src="${sale.idPhoto}" alt="Cartão Cidadão" onclick="openImageModal('${sale.idPhoto}')">` : ''}
                    ${sale.nosBill ? `<img src="${sale.nosBill}" alt="Fatura NOS" onclick="openImageModal('${sale.nosBill}')">` : ''}
                </div>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editSale(${globalIndex})" title="Editar">✏️</button>
                <button class="action-btn delete-btn" onclick="deleteSale(${globalIndex})" title="Eliminar">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openModal(index = -1) {
    currentEditIndex = index;
    modal.style.display = 'block';
    modalTitle.textContent = index === -1 ? 'Nova Proposta' : 'Editar Proposta';
    salesForm.reset();
    idPhotoPreview.style.display = 'none';
    nosBillPreview.style.display = 'none';
    
    if (index > -1) {
        const sale = sales[index];
        clientName.value = sale.clientName;
        packageDesc.value = sale.packageDesc;
        price.value = sale.price;
        iban.value = sale.iban;
        editIndexInput.value = index;
        
        if (sale.idPhoto) {
            idPhotoPreview.src = sale.idPhoto;
            idPhotoPreview.style.display = 'block';
        }
        if (sale.nosBill) {
            nosBillPreview.src = sale.nosBill;
            nosBillPreview.style.display = 'block';
        }
    }
    
    clientName.focus();
}

function closeModal() {
    modal.style.display = 'none';
    currentEditIndex = -1;
}

function handleIdPhoto(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            idPhotoPreview.src = e.target.result;
            idPhotoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function handleNosBill(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            nosBillPreview.src = e.target.result;
            nosBillPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function handleSubmit(e) {
    e.preventDefault();
    
    const idPhoto = idPhotoPreview.style.display === 'block' ? idPhotoPreview.src : '';
    const nosBill = nosBillPreview.style.display === 'block' ? nosBillPreview.src : '';
    
    const saleData = {
        clientName: clientName.value.trim(),
        packageDesc: packageDesc.value.trim(),
        price: price.value,
        iban: iban.value.trim(),
        idPhoto: idPhoto || null,
        nosBill: nosBill || null
    };
    
    if (currentEditIndex === -1) {
        sales.unshift(saleData); // Add to top
    } else {
        sales[currentEditIndex] = saleData;
    }
    
    saveData();
    renderTable();
    closeModal();
}

function editSale(index) {
    openModal(index);
}

function deleteSale(index) {
    if (confirm('Tem a certeza que quer eliminar esta proposta?')) {
        sales.splice(index, 1);
        saveData();
        renderTable();
    }
}

function openImageModal(imageSrc) {
    // Simple full-screen image preview
    const imgModal = document.createElement('div');
    imgModal.className = 'modal image-modal';
    imgModal.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.9);
    `;
    imgModal.innerHTML = `
        <span class="close" style="position: fixed; top: 20px; right: 30px; color: white; font-size: 3rem; cursor: pointer;" onclick="this.parentElement.remove()">&times;</span>
        <img src="${imageSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
    `;
    document.body.appendChild(imgModal);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Search functionality
function getSearchTerm() {
    return searchInput.value.toLowerCase().trim();
}

// Filter table on search (called by input event)
const originalRenderTable = renderTable;
renderTable = function() {
    const term = getSearchTerm();
    const filtered = sales.filter(sale => 
        sale.clientName.toLowerCase().includes(term)
    );
    originalRenderTable(filtered);
};

