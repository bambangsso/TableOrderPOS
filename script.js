// Global variables
let tableNumber = null;
let cart = [];
let currentPage = 'menu';
let currentCategory = 'all';
let transactionNumber = null;
let orderData = null;
let menuData = [];
let categories = [];
let taxData = [];
let storeData = {};
let selectedItemForVariant = null;
let selectedVariantOption = null;
let selectedProteinOption = null;
let selectedSpiceOption = null;

// Store API configuration (will be updated from URL parameters)
let STORE_API_CONFIG = {
    url: 'https://artaka-api.com/api/getstoreid/show',
    payload: {
        mini_website_url: ""
    }
};

// API configuration (will be updated after store API call)
let API_CONFIG = {
    url: 'https://artaka-api.com/api/products/show',
    payload: {
        user_id: "",
        outlet_id: "",
        category: "Semua",
        is_active: "Active"
    }
};

// Fetch store data from API
async function fetchStoreData() {
    try {
        const response = await fetch(STORE_API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(STORE_API_CONFIG.payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Store data response:', data);

        // Process the API response - data is an array, get the first item
        if (data && Array.isArray(data) && data.length > 0) {
            const storeInfo = data[0];
            if (storeInfo.user_id && storeInfo.outlet_id && storeInfo.nama) {
                storeData = {
                    user_id: storeInfo.user_id,
                    outlet_id: storeInfo.outlet_id,
                    nama: storeInfo.nama
                };

                // Update API config with dynamic values
                API_CONFIG.payload.user_id = storeInfo.user_id;
                API_CONFIG.payload.outlet_id = storeInfo.outlet_id;

                // Update restaurant name in header
                document.querySelector('.restaurant-name').textContent = storeInfo.nama;

                console.log('Processed store data:', storeData);
            } else {
                console.error('Invalid store data structure');
                // Fallback to default values
                storeData = {
                    user_id: "+62811987905",
                    outlet_id: "OTL-001",
                    nama: "Tawan Restaurant"
                };
                API_CONFIG.payload.user_id = storeData.user_id;
                API_CONFIG.payload.outlet_id = storeData.outlet_id;
            }
        } else {
            console.error('Invalid store API response format');
            // Fallback to default values
            storeData = {
                user_id: "+62811987905",
                outlet_id: "OTL-001",
                nama: "Tawan Restaurant"
            };
            API_CONFIG.payload.user_id = storeData.user_id;
            API_CONFIG.payload.outlet_id = storeData.outlet_id;
        }
    } catch (error) {
        console.error('Error fetching store data:', error);
        // Fallback to default values
        storeData = {
            user_id: "+62811987905",
            outlet_id: "OTL-001",
            nama: "Tawan Restaurant"
        };
        API_CONFIG.payload.user_id = storeData.user_id;
        API_CONFIG.payload.outlet_id = storeData.outlet_id;
    }
}

// Fetch tax data from API
async function fetchTaxData() {
    try {
        const response = await fetch('https://artaka-api.com/api/activetaxes/show', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: storeData.user_id || "+62811987905",
                outlet_id: storeData.outlet_id || "OTL-001"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Tax data response:', data);

        // Process the API response
        if (data && Array.isArray(data)) {
            taxData = data.map(tax => ({
                name: tax.name || 'Unknown Tax',
                percentage: parseFloat(tax.percentage) || 0
            }));
        } else {
            console.error('Invalid tax API response format');
            taxData = [];
        }

        console.log('Processed tax data:', taxData);
    } catch (error) {
        console.error('Error fetching tax data:', error);
        taxData = [];
    }
}

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
        console.log('Menu API response:', data);

        // Process the API response
        if (data && Array.isArray(data)) {
            console.log('Total items received:', data.length);
            
            // Log all item names for debugging
            console.log('All items from API:', data.map(item => ({
                name: item.name,
                category: item.category,
                variant: item.variant
            })));
            
            // Filter out items with "bahan baku" category
            const filteredData = data.filter(item =>
                item.category && item.category.toLowerCase() !== 'bahan baku'
            );
            
            console.log('Items after filtering out bahan baku:', filteredData.length);
            console.log('Filtered items:', filteredData.map(item => ({
                name: item.name,
                category: item.category,
                variant: item.variant
            })));

            // Group items by name to handle variants properly
            const groupedItems = {};
            
            filteredData.forEach(item => {
                const itemName = item.name || 'No Name';
                
                if (!groupedItems[itemName]) {
                    groupedItems[itemName] = {
                        id: item.id || Math.random(),
                        name: itemName,
                        price: parseInt(item.sell_cost) || 0,
                        category: item.category || 'Lainnya',
                        image: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150',
                        sku_id: item.sku_id || item.id,
                        buy_cost: parseInt(item.buy_cost) || 0,
                        variant: item.variant || '',
                        allVariants: [item.variant || ''].filter(v => v) // Track all variants
                    };
                } else {
                    // If item with same name exists, combine variants
                    const newVariant = item.variant || '';
                    
                    // Add new variant to allVariants if not already present
                    if (newVariant && !groupedItems[itemName].allVariants.includes(newVariant)) {
                        groupedItems[itemName].allVariants.push(newVariant);
                    }
                    
                    // Create combined variant string
                    const allVariants = groupedItems[itemName].allVariants.filter(v => v);
                    
                    if (allVariants.length > 1) {
                        // Multiple variants - combine them intelligently
                        const variantGroups = {};
                        
                        allVariants.forEach(variant => {
                            const parts = variant.split('|');
                            const baseName = parts[0].trim();
                            const options = parts.length > 1 ? parts[1].split(',').map(opt => opt.trim()) : [baseName];
                            
                            if (!variantGroups[baseName]) {
                                variantGroups[baseName] = new Set();
                            }
                            
                            options.forEach(opt => {
                                if (opt) variantGroups[baseName].add(opt);
                            });
                        });
                        
                        // Build final variant string
                        const baseNames = Object.keys(variantGroups);
                        if (baseNames.length === 1) {
                            // Same base variant, different options
                            const baseName = baseNames[0];
                            const allOptions = Array.from(variantGroups[baseName]);
                            
                            if (allOptions.length > 1) {
                                // Check if these are size variants (Small, Medium, Large, etc.)
                                const sizeVariants = ['small', 'medium', 'large', 'xl', 'xxl', 's', 'm', 'l'];
                                const isAllSizes = allOptions.every(opt => 
                                    sizeVariants.includes(opt.toLowerCase()) || 
                                    opt.toLowerCase().includes('size')
                                );
                                
                                if (isAllSizes) {
                                    // For size variants, use "Size" as the base name
                                    groupedItems[itemName].variant = `Size|${allOptions.join(', ')}`;
                                } else if (!allOptions.includes(baseName)) {
                                    // Use the base name if it's not already in the options
                                    groupedItems[itemName].variant = `${baseName}|${allOptions.join(', ')}`;
                                } else {
                                    // Just list the options without a generic "Choose" prefix
                                    groupedItems[itemName].variant = allOptions.join(', ');
                                }
                            } else {
                                groupedItems[itemName].variant = baseName;
                            }
                        } else {
                            // Different base variants - combine all unique options
                            const allUniqueOptions = new Set();
                            Object.values(variantGroups).forEach(optionSet => {
                                optionSet.forEach(opt => allUniqueOptions.add(opt));
                            });
                            
                            groupedItems[itemName].variant = Array.from(allUniqueOptions).join(', ');
                        }
                    } else if (allVariants.length === 1) {
                        groupedItems[itemName].variant = allVariants[0];
                    }
                }
            });

            menuData = Object.values(groupedItems);
            console.log('Grouped items:', groupedItems);
            console.log('Final menu data:', menuData);

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
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    tableNumber = urlParams.get('table') || '1';
    const restoName = urlParams.get('restoname') || 'bellevue-shopx';

    // Update table number display
    document.getElementById('tableNumber').textContent = tableNumber;

    // Update store API configuration with restaurant name from URL
    STORE_API_CONFIG.payload.mini_website_url = `https://orderin.id/${restoName}`;

    console.log('URL Parameters:', { table: tableNumber, restoname: restoName });
    console.log('Store API URL will be:', STORE_API_CONFIG.payload.mini_website_url);

    // Fetch store data first, then menu and tax data
    await fetchStoreData();
    await Promise.all([
        fetchMenuData(),
        fetchTaxData()
    ]);

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
    // Calculate total quantity for this item (considering all variant notes)
    const cartItems = cart.filter(c => c.id == item.id);
    const quantity = cartItems.reduce((sum, c) => sum + c.quantity, 0);
    
    const div = document.createElement('div');
    div.className = 'menu-item';

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

    // Case 1: Empty variant - add directly to cart without popup
    if (!item.variant || !item.variant.trim()) {
        addItemToCart(item, '');
        return;
    }

    // Cases 2 & 3: Has variant - show selection modal
    selectedItemForVariant = item;
    showVariantModal(item);
}

function addItemToCart(item, variantNote) {
    const existingItem = cart.find(c => c.id == item.id && c.notes === variantNote);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            notes: variantNote
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
    // Maintain current category filter when updating UI
    const filteredItems = currentCategory === 'all' ? menuData : menuData.filter(item => item.category === currentCategory);
    renderMenu(filteredItems);
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
    // Track current category
    currentCategory = category;

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

    // Calculate dynamic taxes
    let totalTaxes = 0;
    const taxCalculations = {};

    taxData.forEach(tax => {
        const taxAmount = Math.round(subtotal * (tax.percentage / 100));
        taxCalculations[tax.name] = taxAmount;
        totalTaxes += taxAmount;
    });

    const total = subtotal + totalTaxes;

    document.getElementById('subtotal').textContent = `Rp ${formatPrice(subtotal)}`;

    // Dynamically create tax rows
    const taxRowsContainer = document.getElementById('taxRows');
    taxRowsContainer.innerHTML = '';

    taxData.forEach(tax => {
        const taxRow = document.createElement('div');
        taxRow.className = 'summary-row';
        taxRow.innerHTML = `
            <span>${tax.name} (${tax.percentage}%):</span>
            <span>Rp ${formatPrice(taxCalculations[tax.name])}</span>
        `;
        taxRowsContainer.appendChild(taxRow);
    });

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

    // Calculate dynamic taxes
    let totalTaxes = 0;
    const taxCalculations = {};

    taxData.forEach(tax => {
        const taxAmount = Math.round(subtotal * (tax.percentage / 100));
        taxCalculations[tax.name] = taxAmount;
        totalTaxes += taxAmount;
    });

    const totalBill = subtotal + serviceCharge + totalTaxes;

    // Prepare products array with error checking
    console.log('Cart items:', cart);
    console.log('Menu data:', menuData);

    const products = cart.map((item, index) => {
        console.log(`Processing cart item ${index}:`, item);

        if (!item) {
            console.error(`Cart item at index ${index} is undefined`);
            return null;
        }

        if (!item.id) {
            console.error(`Cart item at index ${index} has no id:`, item);
        }

        if (!item.name) {
            console.error(`Cart item at index ${index} has no name:`, item);
        }

        if (!item.price) {
            console.error(`Cart item at index ${index} has no price:`, item);
        }

        if (!item.quantity) {
            console.error(`Cart item at index ${index} has no quantity:`, item);
        }

        // Find the original item from API response to get sku_id and buy_cost
        const originalItem = menuData.find(m => m.id == item.id);
        console.log(`Original item for ${item.id}:`, originalItem);

        return {
            sku_id: originalItem?.sku_id || item.id || 'unknown',
            name: item.name || 'Unknown Item',
            category: originalItem?.category || 'Lainnya',
            variant: originalItem?.variant || "",
            modifiers_price: 0,
            modifiers_option: "",
            number_orders: item.quantity || 1,
            buy_cost: originalItem?.buy_cost || 0,
            buy_cost_discounted: 0,
            sell_cost: item.price || 0,
            weight: 0,
            units: "Pieces",
            salestype_up: 0,
            discount_info: {
                name: "",
                amount: 0
            },
            taxInfo: taxData.map(tax => ({
                name: tax.name,
                amount: tax.percentage,
                final: Math.round((item.price || 0) * (item.quantity || 1) * (tax.percentage / 100))
            })),
            description: item.notes || ""
        };
    }).filter(product => product !== null);

    console.log('Processed products:', products);

    // Prepare API payload
    const payload = {
        user_id: storeData.user_id || "+62811987905",
        outlet_id: storeData.outlet_id || "OTL-001",
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
            "Service Charge": serviceCharge,
            ...taxCalculations
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

    console.log('Final payload:', JSON.stringify(payload, null, 2));

    try {
        // Call the API
        console.log('Calling API...');
        const response = await fetch('https://artaka-api.com/api/onlinesales/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }

        const result = await response.json();
        console.log('Order submitted successfully:', result);

        // Show success modal
        document.getElementById('successModal').classList.add('active');

    } catch (error) {
        console.error('Detailed error submitting order:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert(`Gagal mengirim pesanan: ${error.message}`);
    }
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');

    // Generate transaction number and save order data
    transactionNumber = 'TXN' + Date.now().toString().slice(-8);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceCharge = Math.round(subtotal * 0.1);

    // Calculate dynamic taxes for order data
    let totalTaxes = 0;
    taxData.forEach(tax => {
        totalTaxes += Math.round(subtotal * (tax.percentage / 100));
    });

    orderData = {
        items: [...cart],
        subtotal: subtotal,
        serviceCharge: serviceCharge,
        total: subtotal + serviceCharge + totalTaxes,
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

    // Calculate dynamic taxes for payment page
    let totalTaxes = 0;
    taxData.forEach(tax => {
        totalTaxes += Math.round(subtotal * (tax.percentage / 100));
    });

    const total = subtotal + serviceCharge + totalTaxes;

    document.getElementById('paymentSubtotal').textContent = `Rp ${formatPrice(subtotal)}`;
    document.getElementById('paymentServiceCharge').textContent = `Rp ${formatPrice(serviceCharge)}`;
    document.getElementById('paymentTax').textContent = `Rp ${formatPrice(totalTaxes)}`;
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

    // Calculate dynamic taxes for final payment
    let totalTaxes = 0;
    taxData.forEach(tax => {
        totalTaxes += Math.round(subtotal * (tax.percentage / 100));
    });

    const total = subtotal + serviceCharge + totalTaxes;

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

// Variant selection functions
function showVariantModal(item) {
    const modal = document.getElementById('variantModal');
    const optionsContainer = document.getElementById('variantOptions');
    
    // Clear previous options
    optionsContainer.innerHTML = '';
    
    // Check if variant contains "|" character
    if (item.variant.includes('|')) {
        // Case 3: Variant contains "|" - e.g., "Ayam|Pedas,Tdk Pedas"
        const variantParts = item.variant.split('|');
        const variantName = variantParts[0].trim();
        const options = variantParts[1].split(',').map(opt => opt.trim()).filter(opt => opt);
        
        // Add variant name header
        const variantHeader = document.createElement('div');
        variantHeader.innerHTML = `<h4 style="margin: 10px 0 5px 0; font-size: 0.9rem;">Varian: ${variantName}</h4>`;
        optionsContainer.appendChild(variantHeader);
        
        // Add options header
        const optionHeader = document.createElement('div');
        optionHeader.innerHTML = `<h4 style="margin: 15px 0 5px 0; font-size: 0.9rem;">Option:</h4>`;
        optionsContainer.appendChild(optionHeader);
        
        // Create radio buttons for options
        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'variant-option';
            optionDiv.onclick = () => selectVariantOption(option, optionDiv);
            
            optionDiv.innerHTML = `
                <input type="radio" name="variantOption" value="${option}" id="option_${index}">
                <label for="option_${index}">${option}</label>
            `;
            
            optionsContainer.appendChild(optionDiv);
        });
    } else {
        // Case 2: Variant doesn't contain "|" - show all variants of same item name
        const sameNameItems = menuData.filter(menuItem => menuItem.name === item.name && menuItem.variant.trim());
        
        if (sameNameItems.length > 0) {
            // Add varian header
            const variantHeader = document.createElement('div');
            variantHeader.innerHTML = `<h4 style="margin: 10px 0 5px 0; font-size: 0.9rem;">Varian:</h4>`;
            optionsContainer.appendChild(variantHeader);
            
            // Create radio buttons for each variant
            sameNameItems.forEach((variantItem, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'variant-option';
                optionDiv.onclick = () => selectVariantOption(variantItem.variant, optionDiv);
                
                optionDiv.innerHTML = `
                    <input type="radio" name="variantOption" value="${variantItem.variant}" id="variant_${index}">
                    <label for="variant_${index}">${variantItem.variant}</label>
                `;
                
                optionsContainer.appendChild(optionDiv);
            });
        }
    }
    
    // Reset selection
    selectedVariantOption = null;
    selectedProteinOption = null;
    selectedSpiceOption = null;
    
    // Show modal
    modal.classList.add('active');
}

function selectVariantOption(option, optionElement) {
    // Remove previous selection
    document.querySelectorAll('input[name="variantOption"]').forEach(input => {
        input.checked = false;
        input.closest('.variant-option').classList.remove('selected');
    });
    
    // Select current option
    optionElement.classList.add('selected');
    optionElement.querySelector('input').checked = true;
    selectedVariantOption = option;
}

function confirmVariantSelection() {
    if (!selectedVariantOption) {
        alert('Silakan pilih varian terlebih dahulu');
        return;
    }
    
    if (!selectedItemForVariant) {
        alert('Item tidak ditemukan');
        return;
    }
    
    // Add item to cart with selected variant as note
    addItemToCart(selectedItemForVariant, selectedVariantOption);
    
    // Close modal
    closeVariantModal();
}

function closeVariantModal() {
    document.getElementById('variantModal').classList.remove('active');
    selectedItemForVariant = null;
    selectedVariantOption = null;
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