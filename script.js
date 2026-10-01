/* =========================================================
   LOVE OVER COFFEE
   CUSTOMER MENU
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const APP_CONFIG = {

    cafeName:
        "Love Over Coffee",

    tagline:
        "Good food. Good coffee. Good moments.",

    currency:
        "₹",

    logo:
        "",

    heroImage:
        "",

    apiUrl:
        "https://script.google.com/macros/s/AKfycbxNNb9AkA552XWf2t_Me3sbwNrr_JfpKPZ8QUOyk3pbMJ3dopFF4LUsGC7oToymbtcb/exec",

    customerFrontendUrl:
        "https://nexus2288.github.io/big-digital-menu/",

    activeOrderHours:
        2

};


/* =========================================================
   STATE
========================================================= */

const state = {

    menu: [],

    filteredMenu: [],

    categories: [],

    activeCategory:
        "All",

    search:
        "",

    cart:
        new Map(),

    table:
        null,

    tableToken:
        null,

    activeOrder:
        null,

    customerKey:
        null,

    isLoading:
        false,

    isSubmitting:
        false

};


/* =========================================================
   DOM REFERENCES
========================================================= */

const DOM = {

    cafeLogo:
        document.getElementById("cafeLogo"),

    logoFallback:
        document.getElementById("logoFallback"),

    cafeName:
        document.getElementById("cafeName"),

    cafeNameSmall:
        document.getElementById("cafeNameSmall"),

    cafeTagline:
        document.getElementById("cafeTagline"),

    tableNumber:
        document.getElementById("tableNumber"),

    searchInput:
        document.getElementById("searchInput"),

    clearSearch:
        document.getElementById("clearSearch"),

    categoryList:
        document.getElementById("categoryList"),

    menuContainer:
        document.getElementById("menuContainer"),

    emptyMenu:
        document.getElementById("emptyMenu"),

    cartBar:
        document.getElementById("cartBar"),

    cartItemCount:
        document.getElementById("cartItemCount"),

    cartTotal:
        document.getElementById("cartTotal"),

    viewCartButton:
        document.getElementById("viewCartButton"),

    cartOverlay:
        document.getElementById("cartOverlay"),

    cartDrawer:
        document.getElementById("cartDrawer"),

    closeCart:
        document.getElementById("closeCart"),

    cartItems:
        document.getElementById("cartItems"),

    cartEmpty:
        document.getElementById("cartEmpty"),

    drawerTotal:
        document.getElementById("drawerTotal"),

    checkoutButton:
        document.getElementById("checkoutButton"),

    toast:
        document.getElementById("toast"),

    activeOrderBanner:
        document.getElementById("activeOrderBanner"),

    activeOrderText:
        document.getElementById("activeOrderText"),

    viewOrderButton:
        document.getElementById("viewOrderButton"),

    customerFormSection:
        document.getElementById("customerFormSection"),

    orderForm:
        document.getElementById("orderForm"),

    customerName:
        document.getElementById("customerName"),

    mobileNumber:
        document.getElementById("mobileNumber"),

    tableNumberInput:
        document.getElementById("tableNumberInput"),

    specialRequest:
        document.getElementById("specialRequest"),

    confirmOrderButton:
        document.getElementById("confirmOrderButton"),

    confirmOrderTotal:
        document.getElementById("confirmOrderTotal"),

    closeCheckout:
        document.getElementById("closeCheckout"),

    checkoutOverlay:
        document.getElementById("checkoutOverlay"),

    orderStatusOverlay:
        document.getElementById("orderStatusOverlay"),

    closeOrderStatus:
        document.getElementById("closeOrderStatus"),

    orderStatusNumber:
        document.getElementById("orderStatusNumber"),

    orderStatusTable:
        document.getElementById("orderStatusTable"),

    orderStatusState:
        document.getElementById("orderStatusState")

};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    applyCafeBranding();

    bindEvents();

    state.customerKey =
        getOrCreateCustomerKey();

    state.tableToken =
        getTableTokenFromUrl();

    if (!state.tableToken) {

        showTableRequired();

        return;

    }

    try {

        await validateTable();

        await loadMenu();

        loadActiveOrder();

        updateCartUI();

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showToast(
            error.message ||
            "Unable to load menu."
        );

    }

}


/* =========================================================
   BRANDING
========================================================= */

function applyCafeBranding() {

    if (DOM.cafeName) {

        DOM.cafeName.textContent =
            APP_CONFIG.cafeName;

    }

    if (DOM.cafeNameSmall) {

        DOM.cafeNameSmall.textContent =
            APP_CONFIG.cafeName.toUpperCase();

    }

    if (DOM.cafeTagline) {

        DOM.cafeTagline.textContent =
            APP_CONFIG.tagline;

    }

    if (
        DOM.cafeLogo &&
        DOM.logoFallback
    ) {

        if (APP_CONFIG.logo) {

            DOM.cafeLogo.src =
                APP_CONFIG.logo;

            DOM.cafeLogo.hidden =
                false;

            DOM.logoFallback.hidden =
                true;

        } else {

            DOM.cafeLogo.hidden =
                true;

            DOM.logoFallback.hidden =
                false;

        }

    }

}


/* =========================================================
   SECURE TABLE TOKEN
========================================================= */

function getTableTokenFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const token =
        params.get("t");

    if (!token) {

        return null;

    }

    return String(token).trim();

}


/* =========================================================
   VALIDATE TABLE
========================================================= */

async function validateTable() {

    if (!state.tableToken) {

        throw new Error(
            "Table QR is required."
        );

    }

    const result =
        await callApiGet(
            "validateTable",
            {
                token:
                    state.tableToken
            }
        );


    if (
        !result ||
        result.success !== true
    ) {

        throw new Error(
            result?.message ||
            "Invalid or expired table QR."
        );

    }


    const table =
        result.table ||
        result.data ||
        result;


    const tableName =
        String(
            table.tableName ||
            table.name ||
            ""
        ).trim();


    if (!tableName) {

        throw new Error(
            "Table information could not be loaded."
        );

    }


    state.table = {

        tableId:
            String(
                table.tableId ||
                ""
            ),

        tableName:
            tableName,

        token:
            state.tableToken

    };


    if (DOM.tableNumber) {

        DOM.tableNumber.textContent =
            tableName;

    }

}


/* =========================================================
   TABLE REQUIRED SCREEN
========================================================= */

function showTableRequired() {

    if (DOM.tableNumber) {

        DOM.tableNumber.textContent =
            "—";

    }

    if (DOM.menuContainer) {

        DOM.menuContainer.innerHTML = "";

    }

    if (DOM.categoryList) {

        DOM.categoryList.innerHTML = "";

    }

    if (DOM.emptyMenu) {

        DOM.emptyMenu.hidden =
            false;

        DOM.emptyMenu.innerHTML = `

            <div class="empty-icon">
                🔒
            </div>

            <h3>
                Table QR Required
            </h3>

            <p>
                Please scan the QR code placed on your table to view the menu.
            </p>

        `;

    }

}


/* =========================================================
   LOAD MENU FROM GOOGLE SHEETS
========================================================= */

async function loadMenu() {

    if (state.isLoading) {

        return;

    }

    state.isLoading =
        true;


    try {

        const result =
            await callApiGet(
                "getMenu",
                {
                    token:
                        state.tableToken
                }
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.message ||
                "Unable to load menu."
            );

        }


        let menu = [];


        if (
            Array.isArray(
                result.items
            )
        ) {

            menu =
                result.items;

        } else if (
            Array.isArray(
                result.menu
            )
        ) {

            menu =
                result.menu;

        } else if (
            Array.isArray(
                result.data
            )
        ) {

            menu =
                result.data;

        }


        state.menu =
            normalizeMenu(menu);


        if (
            !state.menu.length
        ) {

            throw new Error(
                "No menu items found."
            );

        }


        buildCategories();

        renderCategories();

        applyFilters();

    } catch (error) {

        console.error(
            "Menu loading error:",
            error
        );

        if (DOM.menuContainer) {

            DOM.menuContainer.innerHTML =
                "";

        }

        if (DOM.emptyMenu) {

            DOM.emptyMenu.hidden =
                false;

            DOM.emptyMenu.innerHTML = `

                <div class="empty-icon">
                    ⚠
                </div>

                <h3>
                    Menu unavailable
                </h3>

                <p>
                    Please refresh and try again.
                </p>

            `;

        }

        showToast(
            error.message ||
            "Unable to load menu."
        );

        throw error;

    } finally {

        state.isLoading =
            false;

    }

}


/* =========================================================
   NORMALIZE MENU
========================================================= */

function normalizeMenu(items) {

    return items
        .map(item => {

            const id =
                String(
                    item.id ??
                    item.itemId ??
                    ""
                ).trim();


            const name =
                String(
                    item.name ??
                    item.itemName ??
                    ""
                ).trim();


            const category =
                String(
                    item.category ??
                    "Other"
                ).trim();


            const price =
                Number(
                    item.price
                );


            const available =
                item.available !== false;


            const tag =
                String(
                    item.tag ??
                    ""
                ).trim();


            const type =
                String(
                    item.type ??
                    ""
                )
                .trim()
                .toLowerCase();


            return {

                id,

                name,

                category,

                price:
                    Number.isFinite(price)
                        ? price
                        : 0,

                available,

                tag,

                type

            };

        })
        .filter(item => {

            return (
                item.id &&
                item.name
            );

        });

}


/* =========================================================
   BUILD CATEGORIES
   FIX:
   Uses existing .category-list /
   .category-button CSS structure.
========================================================= */

function buildCategories() {

    const categories = [];


    state.menu.forEach(
        item => {

            const category =
                String(
                    item.category ||
                    ""
                ).trim();


            if (
                category &&
                !categories.includes(
                    category
                )
            ) {

                categories.push(
                    category
                );

            }

        }
    );


    state.categories = [

        "All",

        ...categories

    ];

}


/* =========================================================
   RENDER CATEGORIES
========================================================= */

function renderCategories() {

    if (!DOM.categoryList) {

        return;

    }


    DOM.categoryList.innerHTML =
        "";


    state.categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            /*
             * IMPORTANT:
             * Existing CSS uses
             * .category-button
             */
            button.className =
                "category-button";


            if (
                category ===
                state.activeCategory
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.textContent =
                category;


            button.setAttribute(
                "type",
                "button"
            );


            button.addEventListener(
                "click",
                () => {

                    state.activeCategory =
                        category;


                    /*
                     * Re-render only the
                     * category buttons and
                     * filtered menu.
                     */
                    renderCategories();

                    applyFilters();

                }
            );


            DOM.categoryList.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    const category =
        state.activeCategory;


    const search =
        String(
            state.search ||
            ""
        )
        .trim()
        .toLowerCase();


    state.filteredMenu =
        state.menu.filter(
            item => {

                const matchesCategory =
                    category === "All" ||
                    item.category ===
                        category;


                const searchableText =
                    [

                        item.name,

                        item.category,

                        item.tag,

                        item.type

                    ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                return (
                    matchesCategory &&
                    matchesSearch
                );

            }
        );


    renderMenu();

}


/* =========================================================
   RENDER MENU
========================================================= */

function renderMenu() {

    if (!DOM.menuContainer) {

        return;

    }


    DOM.menuContainer.innerHTML =
        "";


    const items =
        state.filteredMenu;


    if (DOM.emptyMenu) {

        DOM.emptyMenu.hidden =
            items.length !== 0;

    }


    if (!items.length) {

        return;

    }


    items.forEach(
        item => {

            const card =
                createMenuCard(
                    item
                );


            DOM.menuContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREATE MENU CARD
========================================================= */

function createMenuCard(item) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "menu-card";


    if (!item.available) {

        card.classList.add(
            "unavailable"
        );

    }


    const top =
        document.createElement(
            "div"
        );


    top.className =
        "menu-card-top";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "menu-card-content";


    const name =
        document.createElement(
            "h3"
        );


    name.className =
        "menu-card-name";


    name.textContent =
        item.name;


    const tag =
        document.createElement(
            "div"
        );


    tag.className =
        "menu-card-tag";


    tag.textContent =
        item.tag;


    tag.hidden =
        !item.tag;


    const category =
        document.createElement(
            "span"
        );


    category.className =
        "menu-card-category";


    category.textContent =
        item.category;


    const price =
        document.createElement(
            "div"
        );


    price.className =
        "menu-card-price";


    price.textContent =
        formatCurrency(
            item.price
        );


    content.appendChild(
        name
    );

    content.appendChild(
        tag
    );

    content.appendChild(
        category
    );

    content.appendChild(
        price
    );


    const right =
        document.createElement(
            "div"
        );


    right.className =
        "menu-card-right";


    const quantity =
        getCartQuantity(
            item.id
        );


    if (!item.available) {

        const stock =
            document.createElement(
                "span"
            );


        stock.className =
            "out-of-stock";


        stock.textContent =
            "Out of Stock";


        right.appendChild(
            stock
        );


    } else if (
        quantity > 0
    ) {

        right.appendChild(

            createQuantityControl(
                item.id,
                quantity
            )

        );


    } else {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "add-button";


        button.textContent =
            "Add";


        button.addEventListener(
            "click",
            () => {

                addToCart(item);

            }
        );


        right.appendChild(
            button
        );

    }


    top.appendChild(
        content
    );


    top.appendChild(
        right
    );


    card.appendChild(
        top
    );


    return card;

}


/* =========================================================
   QUANTITY CONTROL
========================================================= */

function createQuantityControl(
    itemId,
    quantity
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "quantity-control";


    const minus =
        document.createElement(
            "button"
        );


    minus.type =
        "button";


    minus.className =
        "quantity-button";


    minus.textContent =
        "−";


    minus.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            changeQuantity(
                itemId,
                -1
            );

        }
    );


    const number =
        document.createElement(
            "span"
        );


    number.className =
        "quantity-number";


    number.textContent =
        quantity;


    const plus =
        document.createElement(
            "button"
        );


    plus.type =
        "button";


    plus.className =
        "quantity-button";


    plus.textContent =
        "+";


    plus.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            changeQuantity(
                itemId,
                1
            );

        }
    );


    wrapper.appendChild(
        minus
    );


    wrapper.appendChild(
        number
    );


    wrapper.appendChild(
        plus
    );


    return wrapper;

}


/* =========================================================
   CART
========================================================= */

function addToCart(item) {

    if (!item.available) {

        showToast(
            "This item is currently unavailable."
        );

        return;

    }


    const current =
        state.cart.get(
            item.id
        ) || 0;


    if (current >= 50) {

        showToast(
            "Maximum quantity reached."
        );

        return;

    }


    state.cart.set(
        item.id,
        current + 1
    );


    renderMenu();

    updateCartUI();


    showToast(
        `${item.name} added to cart`
    );

}


function changeQuantity(
    itemId,
    amount
) {

    const current =
        state.cart.get(
            itemId
        ) || 0;


    const next =
        current +
        Number(amount);


    if (next <= 0) {

        state.cart.delete(
            itemId
        );

    } else if (
        next <= 50
    ) {

        state.cart.set(
            itemId,
            next
        );

    } else {

        showToast(
            "Maximum quantity reached."
        );

        return;

    }


    renderMenu();

    renderCart();

    updateCartUI();

}


/* =========================================================
   CART HELPERS
========================================================= */

function getCartQuantity(
    itemId
) {

    return (
        state.cart.get(
            itemId
        ) || 0
    );

}


function getCartItems() {

    const items = [];


    state.cart.forEach(
        (
            quantity,
            itemId
        ) => {

            const item =
                state.menu.find(
                    menuItem =>
                        menuItem.id ===
                        itemId
                );


            if (!item) {

                return;

            }


            items.push({

                ...item,

                quantity,

                lineTotal:
                    item.price *
                    quantity

            });

        }
    );


    return items;

}


function getCartTotal() {

    return getCartItems()
        .reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    item.lineTotal
                );

            },
            0
        );

}


function getCartItemCount() {

    return getCartItems()
        .reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    item.quantity
                );

            },
            0
        );

}


/* =========================================================
   CART UI
========================================================= */

function updateCartUI() {

    const count =
        getCartItemCount();


    const total =
        getCartTotal();


    if (DOM.cartBar) {

        DOM.cartBar.hidden =
            count === 0;

    }


    if (DOM.cartItemCount) {

        DOM.cartItemCount.textContent =
            `${count} ${
                count === 1
                    ? "item"
                    : "items"
            }`;

    }


    if (DOM.cartTotal) {

        DOM.cartTotal.textContent =
            formatCurrency(
                total
            );

    }


    if (DOM.drawerTotal) {

        DOM.drawerTotal.textContent =
            formatCurrency(
                total
            );

    }


    if (DOM.confirmOrderTotal) {

        DOM.confirmOrderTotal.textContent =
            formatCurrency(
                total
            );

    }

}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    if (!DOM.cartItems) {

        return;

    }


    const items =
        getCartItems();


    DOM.cartItems.innerHTML =
        "";


    if (DOM.cartEmpty) {

        DOM.cartEmpty.hidden =
            items.length !== 0;

    }


    items.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "cart-item";


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "cart-item-info";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "cart-item-name";


            name.textContent =
                item.name;


            const price =
                document.createElement(
                    "div"
                );


            price.className =
                "cart-item-price";


            price.textContent =
                `${formatCurrency(
                    item.price
                )} × ${item.quantity} = ${formatCurrency(
                    item.lineTotal
                )}`;


            info.appendChild(
                name
            );


            info.appendChild(
                price
            );


            const controls =
                document.createElement(
                    "div"
                );


            controls.className =
                "cart-item-controls";


            controls.appendChild(

                createQuantityControl(
                    item.id,
                    item.quantity
                )

            );


            row.appendChild(
                info
            );


            row.appendChild(
                controls
            );


            DOM.cartItems.appendChild(
                row
            );

        }
    );


    updateCartUI();

}


/* =========================================================
   OPEN CART
========================================================= */

function openCart() {

    renderCart();


    if (DOM.cartOverlay) {

        DOM.cartOverlay.hidden =
            false;

    }


    if (DOM.cartDrawer) {

        DOM.cartDrawer.classList.add(
            "open"
        );

        DOM.cartDrawer.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE CART
========================================================= */

function closeCart() {

    if (DOM.cartDrawer) {

        DOM.cartDrawer.classList.remove(
            "open"
        );

        DOM.cartDrawer.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    setTimeout(
        () => {

            if (DOM.cartOverlay) {

                DOM.cartOverlay.hidden =
                    true;

            }

        },
        280
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
   ACTIVE ORDER
========================================================= */

function getCustomerKey() {

    try {

        return localStorage.getItem(
            "love_over_coffee_customer_key"
        );

    } catch (error) {

        return null;

    }

}


function getOrCreateCustomerKey() {

    let key =
        getCustomerKey();


    if (key) {

        return key;

    }


    key =
        "CUS-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(
                2,
                10
            );


    try {

        localStorage.setItem(
            "love_over_coffee_customer_key",
            key
        );

    } catch (error) {

        console.warn(
            "Could not save customer key.",
            error
        );

    }


    return key;

}


function loadActiveOrder() {

    try {

        const saved =
            localStorage.getItem(
                "love_over_coffee_active_order"
            );


        if (!saved) {

            return;

        }


        const order =
            JSON.parse(
                saved
            );


        if (
            !order ||
            !order.orderId
        ) {

            return;

        }


        const savedAt =
            Number(
                order.savedAt ||
                0
            );


        const maxAge =
            APP_CONFIG.activeOrderHours *
            60 *
            60 *
            1000;


        if (
            savedAt &&
            Date.now() -
                savedAt >
                maxAge
        ) {

            localStorage.removeItem(
                "love_over_coffee_active_order"
            );

            return;

        }


        state.activeOrder =
            order;


        showActiveOrder(
            order
        );

    } catch (error) {

        console.warn(
            "Could not load active order.",
            error
        );

    }

}


function showActiveOrder(
    order
) {

    if (!DOM.activeOrderBanner) {

        return;

    }


    DOM.activeOrderBanner.hidden =
        false;


    if (DOM.activeOrderText) {

        DOM.activeOrderText.textContent =
            `Order #${order.orderId}`;

    }

}


function saveActiveOrder(
    order
) {

    try {

        const data = {

            ...order,

            savedAt:
                Date.now()

        };


        localStorage.setItem(
            "love_over_coffee_active_order",
            JSON.stringify(data)
        );


        state.activeOrder =
            data;


        showActiveOrder(
            data
        );

    } catch (error) {

        console.warn(
            "Could not save active order.",
            error
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function handleSearch() {

    if (!DOM.searchInput) {

        return;

    }


    state.search =
        DOM.searchInput.value;


    if (DOM.clearSearch) {

        DOM.clearSearch.hidden =
            !state.search;

    }


    renderMenu();

}


function clearSearch() {

    if (!DOM.searchInput) {

        return;

    }


    DOM.searchInput.value =
        "";


    state.search =
        "";


    if (DOM.clearSearch) {

        DOM.clearSearch.hidden =
            true;

    }


    renderMenu();

}


/* =========================================================
   CHECKOUT
========================================================= */

function openCheckout() {

    if (
        getCartItemCount() === 0
    ) {

        showToast(
            "Your cart is empty."
        );

        return;

    }


    closeCart();


    if (
        DOM.tableNumberInput &&
        state.table
    ) {

        DOM.tableNumberInput.value =
            state.table.tableName;

    }


    if (
        DOM.customerFormSection
    ) {

        DOM.customerFormSection.hidden =
            false;

    }


    if (
        DOM.checkoutOverlay
    ) {

        DOM.checkoutOverlay.hidden =
            false;

    }


    updateCartUI();

}


function closeCheckout() {

    if (
        DOM.checkoutOverlay
    ) {

        DOM.checkoutOverlay.hidden =
            true;

    }

}


async function submitOrder() {

    if (state.isSubmitting) {

        return;

    }


    if (
        getCartItemCount() === 0
    ) {

        showToast(
            "Your cart is empty."
        );

        return;

    }


    const customerName =
        DOM.customerName
            ? DOM.customerName.value.trim()
            : "";


    const mobile =
        DOM.mobileNumber
            ? DOM.mobileNumber.value.trim()
            : "";


    const specialRequest =
        DOM.specialRequest
            ? DOM.specialRequest.value.trim()
            : "";


    if (!customerName) {

        showToast(
            "Please enter your name."
        );

        DOM.customerName?.focus();

        return;

    }


    if (
        !/^[0-9+\-\s]{7,15}$/.test(
            mobile
        )
    ) {

        showToast(
            "Please enter a valid mobile number."
        );

        DOM.mobileNumber?.focus();

        return;

    }


    if (
        !state.tableToken ||
        !state.table
    ) {

        showToast(
            "Table QR is invalid."
        );

        return;

    }


    const items =
        getCartItems()
            .map(item => {

                return {

                    id:
                        item.id,

                    quantity:
                        item.quantity

                };

            });


    const orderData = {

        customerName:

            customerName,

        mobile:

            mobile,

        mobileNumber:

            mobile,

        tableToken:

            state.tableToken,

        customerKey:

            state.customerKey,

        specialRequest:

            specialRequest,

        couponCode:

            "",

        items:

            items

    };


    state.isSubmitting =
        true;


    if (
        DOM.confirmOrderButton
    ) {

        DOM.confirmOrderButton.disabled =
            true;

        DOM.confirmOrderButton.textContent =
            "Placing Order...";

    }


    try {

        const result =
            await callApiPost(
                "createOrder",
                orderData
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.message ||
                "Unable to place order."
            );

        }


        const activeOrder = {

            orderId:
                result.orderId,

            customerKey:
                result.customerKey ||
                state.customerKey,

            table:
                result.table ||
                state.table.tableName,

            status:
                result.status ||
                "New",

            items:
                result.items ||
                [],

            subtotal:
                result.subtotal ||
                getCartTotal(),

            finalTotal:
                result.finalTotal ||
                getCartTotal(),

            createdAt:
                result.createdAt ||
                new Date().toISOString()

        };


        if (
            result.customerKey
        ) {

            state.customerKey =
                result.customerKey;


            try {

                localStorage.setItem(
                    "love_over_coffee_customer_key",
                    result.customerKey
                );

            } catch (error) {

                console.warn(
                    "Could not save customer key.",
                    error
                );

            }

        }


        saveActiveOrder(
            activeOrder
        );


        state.cart =
            new Map();


        updateCartUI();

        renderMenu();


        closeCheckout();


        showToast(
            `Order #${result.orderId} placed successfully.`
        );


        openOrderStatus();


    } catch (error) {

        console.error(
            "Order submission error:",
            error
        );


        showToast(
            error.message ||
            "Unable to place order."
        );

    } finally {

        state.isSubmitting =
            false;


        if (
            DOM.confirmOrderButton
        ) {

            DOM.confirmOrderButton.disabled =
                false;

            DOM.confirmOrderButton.textContent =
                "Place Order";

        }

    }

}


/* =========================================================
   ORDER STATUS
========================================================= */

async function openOrderStatus() {

    const order =
        state.activeOrder;


    if (!order?.orderId) {

        showToast(
            "No active order found."
        );

        return;

    }


    if (
        DOM.orderStatusOverlay
    ) {

        DOM.orderStatusOverlay.hidden =
            false;

    }


    if (
        DOM.orderStatusNumber
    ) {

        DOM.orderStatusNumber.textContent =
            `Order #${order.orderId}`;

    }


    if (
        DOM.orderStatusTable
    ) {

        DOM.orderStatusTable.textContent =
            order.table ||
            state.table?.tableName ||
            "";

    }


    if (
        DOM.orderStatusState
    ) {

        DOM.orderStatusState.textContent =
            order.status ||
            "New";

    }


    await refreshOrderStatus();

}


async function refreshOrderStatus() {

    const order =
        state.activeOrder;


    if (
        !order?.orderId ||
        !state.customerKey
    ) {

        return;

    }


    try {

        const result =
            await callApiGet(
                "getOrder",
                {

                    orderId:
                        order.orderId,

                    customerKey:
                        state.customerKey

                }
            );


        if (
            !result ||
            result.success !== true ||
            result.found !== true
        ) {

            return;

        }


        if (
            result.order
        ) {

            state.activeOrder = {

                ...order,

                ...result.order

            };


            saveActiveOrder(
                state.activeOrder
            );


            if (
                DOM.orderStatusState
            ) {

                DOM.orderStatusState.textContent =
                    result.order.status ||
                    "New";

            }

        }

    } catch (error) {

        console.warn(
            "Could not refresh order status.",
            error
        );

    }

}


/* =========================================================
   CLOSE ORDER STATUS
========================================================= */

function closeOrderStatus() {

    if (
        DOM.orderStatusOverlay
    ) {

        DOM.orderStatusOverlay.hidden =
            true;

    }

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    DOM.searchInput?.addEventListener(
        "input",
        handleSearch
    );


    DOM.clearSearch?.addEventListener(
        "click",
        clearSearch
    );


    DOM.viewCartButton?.addEventListener(
        "click",
        openCart
    );


    DOM.closeCart?.addEventListener(
        "click",
        closeCart
    );


    DOM.cartOverlay?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                DOM.cartOverlay
            ) {

                closeCart();

            }

        }
    );


    DOM.checkoutButton?.addEventListener(
        "click",
        openCheckout
    );


    DOM.closeCheckout?.addEventListener(
        "click",
        closeCheckout
    );


    DOM.checkoutOverlay?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                DOM.checkoutOverlay
            ) {

                closeCheckout();

            }

        }
    );


    DOM.orderForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            submitOrder();

        }
    );


    DOM.confirmOrderButton?.addEventListener(
        "click",
        event => {

            if (
                DOM.orderForm
            ) {

                return;

            }

            event.preventDefault();

            submitOrder();

        }
    );


    DOM.viewOrderButton?.addEventListener(
        "click",
        openOrderStatus
    );


    DOM.closeOrderStatus?.addEventListener(
        "click",
        closeOrderStatus
    );


    DOM.orderStatusOverlay?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                DOM.orderStatusOverlay
            ) {

                closeOrderStatus();

            }

        }
    );


    DOM.mobileNumber?.addEventListener(
        "input",
        () => {

            DOM.mobileNumber.value =
                DOM.mobileNumber.value
                    .replace(
                        /[^0-9+\-\s]/g,
                        ""
                    )
                    .slice(
                        0,
                        15
                    );

        }
    );


    DOM.specialRequest?.addEventListener(
        "input",
        () => {

            if (
                DOM.specialRequest.maxLength >
                0
            ) {

                DOM.specialRequest.value =
                    DOM.specialRequest.value.slice(
                        0,
                        DOM.specialRequest.maxLength
                    );

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closeCart();

            closeCheckout();

            closeOrderStatus();

        }
    );

}


/* =========================================================
   API - GET
========================================================= */

async function callApiGet(
    action,
    params = {}
) {

    const url =
        new URL(
            APP_CONFIG.apiUrl
        );


    url.searchParams.set(
        "action",
        action
    );


    Object.keys(params)
        .forEach(
            key => {

                const value =
                    params[key];


                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {

                    url.searchParams.set(
                        key,
                        value
                    );

                }

            }
        );


    const response =
        await fetch(
            url.toString(),
            {

                method:
                    "GET",

                redirect:
                    "follow"

            }
        );


    if (!response.ok) {

        throw new Error(
            "Unable to connect to server."
        );

    }


    const data =
        await response.json();


    return data;

}


/* =========================================================
   API - POST
========================================================= */

async function callApiPost(
    action,
    data = {}
) {

    const response =
        await fetch(
            APP_CONFIG.apiUrl,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify({

                        action:
                            action,

                        data:
                            data

                    })

            }
        );


    if (!response.ok) {

        throw new Error(
            "Unable to connect to server."
        );

    }


    const result =
        await response.json();


    return result;

}


/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
    amount
) {

    return (
        APP_CONFIG.currency +
        Number(
            amount || 0
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits:
                    2
            }
        )
    );

}


function showToast(
    message
) {

    if (!DOM.toast) {

        return;

    }


    DOM.toast.textContent =
        message;


    DOM.toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () => {

                DOM.toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}


/* =========================================================
   END
========================================================= */
