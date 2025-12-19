// ===== State Management =====
let transactions = [];

// ===== DOM Elements =====
const transactionForm = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions-list');
const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const filterTypeSelect = document.getElementById('filter-type');
const searchInput = document.getElementById('search-transaction');
const chartContainer = document.getElementById('chart-container');

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    setDefaultDate();
    updateUI();
    
    // Event Listeners
    transactionForm.addEventListener('submit', handleAddTransaction);
    filterTypeSelect.addEventListener('change', updateUI);
    searchInput.addEventListener('input', updateUI);
});

// ===== Set Default Date to Today =====
function setDefaultDate() {
    const dateInput = document.getElementById('transaction-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

// ===== Load Transactions from Local Storage =====
function loadTransactions() {
    const stored = localStorage.getItem('transactions');
    if (stored) {
        transactions = JSON.parse(stored);
    }
}

// ===== Save Transactions to Local Storage =====
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ===== Handle Add Transaction =====
function handleAddTransaction(e) {
    e.preventDefault();
    
    const description = document.getElementById('transaction-description').value.trim();
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const date = document.getElementById('transaction-date').value;
    const category = document.getElementById('transaction-category').value;
    const type = document.getElementById('transaction-type').value;
    
    if (!description || !amount || !date || !category || !type) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        description,
        amount,
        date,
        category,
        type
    };
    
    transactions.push(transaction);
    saveTransactions();
    updateUI();
    
    // Reset form
    transactionForm.reset();
    setDefaultDate();
    
    // Add success animation
    showSuccessMessage();
}

// ===== Show Success Message =====
function showSuccessMessage() {
    const btn = document.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>✓ Adicionado!</span>';
    btn.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 1500);
}

// ===== Delete Transaction =====
function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateUI();
    }
}

// ===== Calculate Totals =====
function calculateTotals() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
}

// ===== Format Currency =====
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// ===== Format Date =====
function formatDate(dateString) {
    if (!dateString) {
        return 'Data inválida';
    }
    
    // Parse the date string properly
    const date = new Date(dateString + 'T00:00:00');
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Data inválida';
    }
    
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

// ===== Update UI =====
function updateUI() {
    updateBalanceCards();
    updateTransactionsList();
    updateChart();
}

// ===== Update Balance Cards =====
function updateBalanceCards() {
    const { income, expenses, balance } = calculateTotals();
    
    totalBalanceEl.textContent = formatCurrency(balance);
    totalIncomeEl.textContent = formatCurrency(income);
    totalExpensesEl.textContent = formatCurrency(expenses);
    
    // Add color based on balance
    if (balance >= 0) {
        totalBalanceEl.style.color = '#43e97b';
    } else {
        totalBalanceEl.style.color = '#fa709a';
    }
}

// ===== Update Transactions List =====
function updateTransactionsList() {
    const filterType = filterTypeSelect.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    let filtered = transactions;
    
    // Filter by type
    if (filterType !== 'all') {
        filtered = filtered.filter(t => t.type === filterType);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        transactionsList.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">Nenhuma transação encontrada</td>
            </tr>
        `;
        return;
    }
    
    transactionsList.innerHTML = filtered.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td>
                <span class="transaction-type ${transaction.type}">
                    ${transaction.type === 'income' ? 'Receita' : 'Despesa'}
                </span>
            </td>
            <td>
                <span class="transaction-value ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                </span>
            </td>
            <td>
                <button class="btn-delete" onclick="deleteTransaction(${transaction.id})">
                    Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== Update Chart =====
function updateChart() {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
        chartContainer.innerHTML = '<p class="empty-state">Adicione despesas para ver o gráfico</p>';
        return;
    }
    
    // Group expenses by category
    const categoryTotals = {};
    expenses.forEach(t => {
        if (!categoryTotals[t.category]) {
            categoryTotals[t.category] = 0;
        }
        categoryTotals[t.category] += t.amount;
    });
    
    // Convert to array and sort by amount
    const categories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
    
    // Find max for percentage calculation
    const maxAmount = Math.max(...categories.map(c => c.amount));
    
    // Generate chart bars
    chartContainer.innerHTML = categories.map(({ category, amount }) => {
        const percentage = (amount / maxAmount) * 100;
        return `
            <div class="chart-bar">
                <div class="chart-label">${category}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-value">${formatCurrency(amount)}</div>
            </div>
        `;
    }).join('');
}

// ===== Make deleteTransaction available globally =====
window.deleteTransaction = deleteTransaction;
