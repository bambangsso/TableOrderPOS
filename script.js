
// Global variables
let tableNumber = null;
let cart = [];
let currentPage = 'menu';
let transactionNumber = null;
let orderData = null;
let menuData = [];
let categories = [];

// API configuration
const API_CONFIG = {
    url: 'https://artaka-api.com/api/products/show',
    payload: {
        user_id: "+62811987905",
        outlet_id: "OTL-001",
        category: "Semua",
        is_active: "Active"
    }
};

// Fetch menu data from API
async function fetchMenuData() {
    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(API_CONFIG.payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the API response
        if (data && Array.isArray(data)) {
            // Filter out items with "bahan baku" category
            const filteredData = data.filter(item => 
                item.category && item.category.toLowerCase() !== 'bahan baku'
            );
            
            menuData = filteredData.map(item => ({
                id: item.id || Math.random(),
                name: item.name || 'No Name',
                price: parseInt(item.sell_cost) || 0,
                category: item.category || 'Lainnya',
                image: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150',
                sku_id: item.sku_id || item.id,
                buy_cost: parseInt(item.buy_cost) || 0
            }));
            
            // Extract unique categories (excluding bahan baku)
            const uniqueCategories = [...new Set(menuData.map(item => item.category))];
            categories = ['Semua', ...uniqueCategories];
            
            // Render category tabs
            renderCategoryTabs();
            
            // Render menu
            renderMenu();
        } else {
            console.error('Invalid API response format');
            // Fallback to empty menu
            menuData = [];
            categories = ['Semua'];
            renderCategoryTabs();
            renderMenu();
        }
    } catch (error) {
        console.error('Error fetching menu data:', error);
        // Fallback to empty menu
        menuData = [];
        categories = ['Semua'];
        renderCategoryTabs();
        renderMenu();
    }
}

// Render category tabs dynamically
function renderCategoryTabs() {
    const categoryTabs = document.querySelector('.category-tabs');
    categoryTabs.innerHTML = '';
    
    categories.forEach((category, index) => {
        const button = document.createElement('button');
        button.className = `category-tab ${index === 0 ? 'active' : ''}`;
        button.textContent = category;
        button.onclick = () => filterCategory(category === 'Semua' ? 'all' : category);
        categoryTabs.appendChild(button);
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    // Get table number from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    tableNumber = urlParams.get('table') || '1';
    document.getElementById('tableNumber').textContent = tableNumber;
    
    // Fetch menu data from API
    await fetchMenuData();
    
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
    
    const cartItem = cart.find(c => c.id == item.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    div.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="menu-image">
        <div class="menu-info">
            <h3>${item.name}</h3>
            <p class="menu-price">Rp ${formatPrice(item.price)}</p>
        </div>
        <div class="menu-actions">
            ${quantity === 0 ? 
                `<button class="add-btn" onclick="addToCart('${item.id}')">Tambah</button>` :
                `<div class="quantity-controls">
                    <button class="quantity-btn" onclick="decreaseQuantity('${item.id}')">-</button>
                    <span class="quantity-display">${quantity}</span>
                    <button class="quantity-btn" onclick="increaseQuantity('${item.id}')">+</button>
                </div>`
            }
        </div>
    `;
    
    return div;
}

// Cart functions
function addToCart(itemId) {
    const item = menuData.find(m => m.id == itemId);
    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }
    
    const existingItem = cart.find(c => c.id == itemId);
    
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
    const cartItem = cart.find(c => c.id == itemId);
    if (cartItem) {
        cartItem.quantity++;
        updateUI();
    }
}

function decreaseQuantity(itemId) {
    const cartItem = cart.find(c => c.id == itemId);
    if (cartItem) {
        cartItem.quantity--;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(c => c.id != itemId);
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

function showOrderItemsInOrderTab() {
    document.getElementById('orderContent').style.display = 'block';
    document.getElementById('orderSummaryContent').style.display = 'none';
    updateOrderList();
}

function showOrderSummaryInOrderTab() {
    document.getElementById('orderContent').style.display = 'none';
    document.getElementById('orderSummaryContent').style.display = 'block';
    
    // Update order summary content
    document.getElementById('orderListTransactionNumber').textContent = orderData.transactionNumber;
    document.getElementById('orderListTableNumber').textContent = orderData.tableNumber;
    document.getElementById('orderListOrderTime').textContent = orderData.orderTime;
    document.getElementById('orderListSummaryTotal').textContent = `Rp ${formatPrice(orderData.total)}`;
    
    const summaryItems = document.getElementById('orderListSummaryItems');
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
    
    // Handle order page content based on order status
    if (pageName === 'order') {
        if (orderData) {
            showOrderSummaryInOrderTab();
        } else {
            showOrderItemsInOrderTab();
        }
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
    
    // Find and activate the clicked tab
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        if ((category === 'all' && tab.textContent === 'Semua') || tab.textContent === category) {
            tab.classList.add('active');
        }
    });
    
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
            <input type="text" class="notes-input" placeholder="Tambah catatan..." 
                   value="${item.notes}" onchange="updateItemNotes(${item.id}, this.value)">
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

async function processOrder() {
    closeModal();
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceCharge = Math.round(subtotal * 0.1);
    const pb1Tax = Math.round(subtotal * 0.11);
    const totalBill = subtotal + serviceCharge + pb1Tax;
    
    // Prepare products array
    const products = cart.map(item => {
        // Find the original item from API response to get sku_id and buy_cost
        const originalItem = menuData.find(m => m.id == item.id);
        
        return {
            sku_id: originalItem?.sku_id || item.id,
            name: item.name,
            category: originalItem?.category || 'Lainnya',
            variant: "",
            modifiers_price: 0,
            modifiers_option: "",
            number_orders: item.quantity,
            buy_cost: originalItem?.buy_cost || 0,
            buy_cost_discounted: 0,
            sell_cost: item.price,
            weight: 0,
            units: "Pieces",
            salestype_up: 0,
            discount_info: {
                name: "",
                amount: 0
            },
            taxInfo: [
                {
                    name: "PB1",
                    amount: 10,
                    final: Math.round(item.price * item.quantity * 0.1)
                }
            ],
            description: item.notes || ""
        };
    });
    
    // Prepare API payload
    const payload = {
        user_id: "62811987905",
        outlet_id: "OTL-001",
        customer: {
            name: `Table ${tableNumber}`,
            handphone: "",
            email: "",
            alamat: "",
            kecamatan: "",
            kodepos: "",
            subdistrics_info: {},
            fcm_web_token: ""
        },
        products: products,
        subtotal: subtotal,
        total_diskon: 0,
        total_tax: {
            PPN: 0,
            "Service Charge": serviceCharge,
            PB1: pb1Tax
        },
        total_bill: totalBill,
        payment_method: "bayar di kasir",
        payment_account: "",
        payment_due_date: "",
        total_payment: totalBill,
        expedition: "dine in",
        service: "Gratis",
        weight: 0,
        delivery_cost: 0,
        notes: "",
        total_buy_cost: 0,
        order_status: "completed",
        response: {}
    };
    
    try {
        // Call the API
        const response = await fetch('https://artaka-api.com/api/onlinesales/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Order submitted successfully:', result);
        
        // Show success modal
        document.getElementById('successModal').classList.add('active');
        
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('Gagal mengirim pesanan. Silakan coba lagi.');
    }
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
    
    // Clear cart and show order summary in order tab
    cart = [];
    updateUI();
    showPage('order');
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
