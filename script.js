
// Global variables
let tableNumber = null;
let cart = [];
let currentPage = 'menu';
let transactionNumber = null;
let orderData = null;

// Sample menu data
const menuData = [
    {
        id: 1,
        name: "Nasi Goreng Spesial",
        price: 25000,
        category: "makanan",
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 2,
        name: "Mie Ayam Bakso",
        price: 20000,
        category: "makanan",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 3,
        name: "Gado-Gado",
        price: 18000,
        category: "makanan",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 4,
        name: "Sate Ayam",
        price: 30000,
        category: "makanan",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 5,
        name: "Es Teh Manis",
        price: 8000,
        category: "minuman",
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 6,
        name: "Jus Jeruk",
        price: 12000,
        category: "minuman",
        image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 7,
        name: "Kopi Tubruk",
        price: 10000,
        category: "minuman",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 8,
        name: "Es Cendol",
        price: 15000,
        category: "minuman",
        image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 9,
        name: "Ayam Bakar Madu",
        price: 35000,
        category: "menu-baru",
        image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=150&h=150&fit=crop&crop=center"
    },
    {
        id: 10,
        name: "Smoothie Mangga",
        price: 18000,
        category: "menu-baru",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=150&h=150&fit=crop&crop=center"
    }
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Get table number from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    tableNumber = urlParams.get('table') || '1';
    document.getElementById('tableNumber').textContent = tableNumber;
    
    // Render menu
    renderMenu();
    
    // Set initial page
    showPage('menu');
});

// Menu functions
function renderMenu(items = menuData) {
    const menuContainer = document.getElementById('menuItems');
    menuContainer.innerHTML = '';
    
    items.forEach(item => {
        const menuItemElement = createMenuItemElement(item);
        menuContainer.appendChild(menuItemElement);
    });
}

function createMenuItemElement(item) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.setAttribute('data-category', item.category);
    
    const cartItem = cart.find(c => c.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    div.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="menu-image">
        <div class="menu-info">
            <h3>${item.name}</h3>
            <p class="menu-price">Rp ${formatPrice(item.price)}</p>
        </div>
        <div class="menu-actions">
            ${quantity === 0 ? 
                `<button class="add-btn" onclick="addToCart(${item.id})">Tambah</button>` :
                `<div class="quantity-controls">
                    <button class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
                    <span class="quantity-display">${quantity}</span>
                    <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
                </div>`
            }
        </div>
    `;
    
    return div;
}

// Cart functions
function addToCart(itemId) {
    const item = menuData.find(m => m.id === itemId);
    const existingItem = cart.find(c => c.id === itemId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            notes: ''
        });
    }
    
    updateUI();
}

function increaseQuantity(itemId) {
    const cartItem = cart.find(c => c.id === itemId);
    if (cartItem) {
        cartItem.quantity++;
        updateUI();
    }
}

function decreaseQuantity(itemId) {
    const cartItem = cart.find(c => c.id === itemId);
    if (cartItem) {
        cartItem.quantity--;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(c => c.id !== itemId);
        }
        updateUI();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.id !== itemId);
    updateUI();
}

function updateItemNotes(itemId, notes) {
    const cartItem = cart.find(c => c.id === itemId);
    if (cartItem) {
        cartItem.notes = notes;
    }
}

// UI update functions
function updateUI() {
    renderMenu();
    updateFloatingCart();
    updateOrderList();
}

function updateFloatingCart() {
    const floatingCart = document.getElementById('floatingCart');
    const cartQuantity = document.getElementById('cartQuantity');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (totalItems > 0) {
        floatingCart.style.display = 'flex';
        cartQuantity.textContent = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
        cartTotal.textContent = `Rp ${formatPrice(totalPrice)}`;
    } else {
        floatingCart.style.display = 'none';
    }
}

function updateOrderList() {
    const orderItems = document.getElementById('orderItems');
    
    if (cart.length === 0) {
        orderItems.innerHTML = '<p class="empty-order">Belum ada pesanan</p>';
        return;
    }
    
    orderItems.innerHTML = '';
    cart.forEach(item => {
        const orderItemElement = createOrderItemElement(item);
        orderItems.appendChild(orderItemElement);
    });
}

function createOrderItemElement(item) {
    const div = document.createElement('div');
    div.className = 'order-item';
    
    div.innerHTML = `
        <div class="order-item-info">
            <h4>${item.name}</h4>
            <p class="order-item-price">Rp ${formatPrice(item.price)} x ${item.quantity}</p>
            <input type="text" class="notes-input" placeholder="Tambah catatan..." 
                   value="${item.notes}" onchange="updateItemNotes(${item.id}, this.value)">
        </div>
        <div class="quantity-controls">
            <button class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
        </div>
    `;
    
    return div;
}

// Page navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageName + 'Page').classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (pageName === 'menu' || pageName === 'order') {
        document.querySelector(`.nav-btn[onclick="showPage('${pageName}')"]`).classList.add('active');
    }
    
    // Show/hide floating cart based on page
    if (pageName === 'menu' || pageName === 'order') {
        updateFloatingCart();
    } else {
        document.getElementById('floatingCart').style.display = 'none';
    }
    
    currentPage = pageName;
}

// Category filtering
function filterCategory(category) {
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter menu items
    const filteredItems = category === 'all' ? menuData : menuData.filter(item => item.category === category);
    renderMenu(filteredItems);
}

// Search functionality
function toggleSearch() {
    const searchContainer = document.getElementById('searchContainer');
    const mainContent = document.querySelector('.main-content');
    
    if (searchContainer.style.display === 'none' || !searchContainer.style.display) {
        searchContainer.style.display = 'block';
        mainContent.classList.add('with-search');
        document.getElementById('searchInput').focus();
    } else {
        searchContainer.style.display = 'none';
        mainContent.classList.remove('with-search');
        document.getElementById('searchInput').value = '';
        renderMenu();
    }
}

function searchMenu() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredItems = menuData.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    renderMenu(filteredItems);
}

// Checkout process
function showCheckout() {
    if (cart.length === 0) return;
    
    const checkoutItems = document.getElementById('checkoutItems');
    checkoutItems.innerHTML = '';
    
    cart.forEach(item => {
        const checkoutItemElement = createCheckoutItemElement(item);
        checkoutItems.appendChild(checkoutItemElement);
    });
    
    updateCheckoutSummary();
    
    // Hide floating cart during checkout
    document.getElementById('floatingCart').style.display = 'none';
    
    showPage('checkout');
}

function createCheckoutItemElement(item) {
    const div = document.createElement('div');
    div.className = 'checkout-item';
    
    div.innerHTML = `
        <div class="order-item-info">
            <h4>${item.name}</h4>
            <p class="order-item-price">Rp ${formatPrice(item.price)} x ${item.quantity}</p>
            ${item.notes ? `<p><small>Catatan: ${item.notes}</small></p>` : ''}
        </div>
        <div class="quantity-controls">
            <button class="quantity-btn" onclick="decreaseQuantity(${item.id}); refreshCheckout();">-</button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn" onclick="increaseQuantity(${item.id}); refreshCheckout();">+</button>
        </div>
    `;
    
    return div;
}

function updateCheckoutSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceCharge = Math.round(subtotal * 0.1);
    const total = subtotal + serviceCharge;
    
    document.getElementById('subtotal').textContent = `Rp ${formatPrice(subtotal)}`;
    document.getElementById('serviceCharge').textContent = `Rp ${formatPrice(serviceCharge)}`;
    document.getElementById('totalAmount').textContent = `Rp ${formatPrice(total)}`;
}

function refreshCheckout() {
    // Re-render checkout items to reflect quantity changes
    const checkoutItems = document.getElementById('checkoutItems');
    checkoutItems.innerHTML = '';
    
    cart.forEach(item => {
        const checkoutItemElement = createCheckoutItemElement(item);
        checkoutItems.appendChild(checkoutItemElement);
    });
    
    // Update the summary
    updateCheckoutSummary();
    
    // Keep floating cart hidden
    document.getElementById('floatingCart').style.display = 'none';
    
    // If cart is empty, go back to menu
    if (cart.length === 0) {
        showPage('menu');
    }
}

function confirmOrder() {
    if (cart.length === 0) return;
    
    document.getElementById('confirmModal').classList.add('active');
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

function processOrder() {
    closeModal();
    document.getElementById('successModal').classList.add('active');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
    
    // Generate transaction number and save order data
    transactionNumber = 'TXN' + Date.now().toString().slice(-8);
    orderData = {
        items: [...cart],
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        serviceCharge: Math.round(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + Math.round(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1),
        transactionNumber: transactionNumber,
        tableNumber: tableNumber,
        orderTime: new Date().toLocaleString('id-ID')
    };
    
    showOrderSummary();
}

function showOrderSummary() {
    document.getElementById('transactionNumber').textContent = orderData.transactionNumber;
    document.getElementById('summaryTableNumber').textContent = orderData.tableNumber;
    document.getElementById('orderTime').textContent = orderData.orderTime;
    document.getElementById('summaryTotal').textContent = `Rp ${formatPrice(orderData.total)}`;
    
    const summaryItems = document.getElementById('summaryItems');
    summaryItems.innerHTML = '';
    
    orderData.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.innerHTML = `
            <div class="order-item-info">
                <h4>${item.name}</h4>
                <p class="order-item-price">Rp ${formatPrice(item.price)} x ${item.quantity} = Rp ${formatPrice(item.price * item.quantity)}</p>
                ${item.notes ? `<p><small>Catatan: ${item.notes}</small></p>` : ''}
            </div>
        `;
        summaryItems.appendChild(div);
    });
    
    showPage('orderSummary');
}

function showPaymentPage() {
    const subtotal = orderData.subtotal;
    const serviceCharge = orderData.serviceCharge;
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + serviceCharge + tax;
    
    document.getElementById('paymentSubtotal').textContent = `Rp ${formatPrice(subtotal)}`;
    document.getElementById('paymentServiceCharge').textContent = `Rp ${formatPrice(serviceCharge)}`;
    document.getElementById('paymentTax').textContent = `Rp ${formatPrice(tax)}`;
    document.getElementById('paymentTotal').textContent = `Rp ${formatPrice(total)}`;
    
    showPage('payment');
}

function selectPaymentMethod(method) {
    document.querySelectorAll('.payment-method').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.payment-method').classList.add('selected');
}

function closeBill() {
    const subtotal = orderData.subtotal;
    const serviceCharge = orderData.serviceCharge;
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + serviceCharge + tax;
    
    document.getElementById('paymentDateTime').textContent = new Date().toLocaleString('id-ID');
    document.getElementById('paymentTransactionNumber').textContent = orderData.transactionNumber;
    document.getElementById('finalPaymentTotal').textContent = `Rp ${formatPrice(total)}`;
    
    showPage('paymentSuccess');
}

function resetApp() {
    cart = [];
    orderData = null;
    transactionNumber = null;
    updateUI();
    showPage('menu');
}

// Utility functions
function formatPrice(price) {
    return price.toLocaleString('id-ID');
}

// Event listeners
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') && !e.target.classList.contains('modal-content')) {
        e.target.classList.remove('active');
    }
});
