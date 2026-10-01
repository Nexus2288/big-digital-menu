/* =========================================================
   LOVE OVER COFFEE
   CUSTOMER MENU - PART 3
   SECURE TABLE + LIVE SHEET MENU + ORDER CREATION
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const APP_CONFIG = {

    cafeName: "Love Over Coffee",

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

    activeCategory: "all",

    search: "",

    cart: new Map(),

    table: null,

    tableToken: null,

    activeOrder: null,

    isLoading: false,

    isSubmitting: false

};


/* =========================================================
   DOM
========================================================= */

const DOM = {

    pageLoader:
        document.getElementById("pageLoader"),

    app:
        document.getElementById("app"),

    cafeLogo:
        document.getElementById("cafeLogo"),

    cafeName:
        document.getElementById("cafeName"),

    cafeSubtitle:
        document.getElementById("cafeSubtitle"),

    infoBtn:
        document.getElementById("infoBtn"),

    infoOverlay:
        document.getElementById("infoOverlay"),

    closeInfo:
        document.getElementById("closeInfo"),

    searchInput:
        document.getElementById("searchInput"),

    clearSearch:
        document.getElementById("clearSearch"),

    categoryNav:
        document.getElementById("categoryNav"),

    menuContainer:
        document.getElementById("menuContainer"),

    emptyState:
        document.getElementById("emptyState"),

    resetSearch:
        document.getElementById("resetSearch"),

    itemCount:
        document.getElementById("itemCount"),

    tableNumber:
        document.getElementById("tableNumber"),

    cartButton:
        document.getElementById("cartButton"),

    cartItemCount:
        document.getElementById("cartItemCount"),

    cartTotal:
        document.getElementById("cartTotal"),

    cartOverlay:
        document.getElementById("cartOverlay"),

    closeCart:
        document.getElementById("closeCart"),

    cartItems:
        document.getElementById("cartItems"),

    emptyCart:
        document.getElementById("emptyCart"),

    continueShopping:
        document.getElementById("continueShopping"),

    cartSummary:
        document.getElementById("cartSummary"),

    summarySubtotal:
        document.getElementById("summarySubtotal"),

    summaryTotal:
        document.getElementById("summaryTotal"),

    checkoutButton:
        document.getElementById("checkoutButton"),

    checkoutOverlay:
        document.getElementById("checkoutOverlay"),

    closeCheckout:
        document.getElementById("closeCheckout"),

    orderForm:
        document.getElementById("orderForm"),

    customerName:
        document.getElementById("customerName"),

    customerPhone:
        document.getElementById("customerPhone"),

    orderNote:
        document.getElementById("orderNote"),

    checkoutItems:
        document.getElementById("checkoutItems"),

    checkoutTotal:
        document.getElementById("checkoutTotal"),

    editCart:
        document.getElementById("editCart"),

    placeOrderButton:
        document.getElementById("placeOrderButton"),

    successOverlay:
        document.getElementById("successOverlay"),

    successOrderId:
        document.getElementById("successOrderId"),

    successTotal:
        document.getElementById("successTotal"),

    newOrderButton:
        document.getElementById("newOrderButton"),

    toast:
        document.getElementById("toast"),

    toastIcon:
        document.getElementById("toastIcon"),

    toastMessage:
        document.getElementById("toastMessage")

};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    try {

        applyBranding();

        bindEvents();

        prepareTableField();

        state.tableToken =
            getTableTokenFromUrl();

        if (!state.tableToken) {

            showTableRequired();

            hideLoader();

            return;

        }

        await validateTable();

        await loadMenu();

        loadActiveOrder();

        renderMenu();

        updateCartUI();

        hideLoader();

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showFatalError(
            error.message ||
            "Unable to load the menu."
        );

        hideLoader();

    }

}


/* =========================================================
   BRANDING
========================================================= */

function applyBranding() {

    if (DOM.cafeName) {

        DOM.cafeName.textContent =
            APP_CONFIG.cafeName;

    }

    if (DOM.cafeSubtitle) {

        DOM.cafeSubtitle.textContent =
            APP_CONFIG.tagline;

    }

    if (
        DOM.cafeLogo &&
        APP_CONFIG.logo
    ) {

        DOM.cafeLogo.src =
            APP_CONFIG.logo;

    }

}


/* =========================================================
   TABLE FIELD
   Customer can see table number,
   but cannot edit it.
========================================================= */

function prepareTableField() {

    if (!DOM.tableNumber) {
        return;
    }

    DOM.tableNumber.readOnly = true;

    DOM.tableNumber.setAttribute(
        "readonly",
        "readonly"
    );

    DOM.tableNumber.setAttribute(
        "aria-readonly",
        "true"
    );

    DOM.tableNumber.placeholder =
        "Table will be detected automatically";

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
        String(
            params.get("t") || ""
        ).trim();

    if (!token) {
        return null;
    }

    /*
     * We do not expose or trust
     * table number from URL.
     *
     * Only secure token is accepted.
     */

    return token;

}


/* =========================================================
   VALIDATE TABLE
========================================================= */

async function validateTable() {

    const response =
        await apiGet(
            "validateTable",
            {
                token:
                    state.tableToken
            }
        );

    if (
        !response ||
        response.success !== true ||
        response.valid !== true
    ) {

        throw new Error(
            response?.error ||
            "Invalid or inactive table QR."
        );

    }

    state.table = {

        tableId:
            response.tableId,

        tableName:
            response.tableName

    };


    if (DOM.tableNumber) {

        DOM.tableNumber.value =
            response.tableName;

        DOM.tableNumber.textContent =
            response.tableName;

    }

}


/* =========================================================
   LOAD MENU
========================================================= */

async function loadMenu() {

    state.isLoading = true;

    try {

        const response =
            await apiGet(
                "getMenu"
            );

        if (
            !response ||
            response.success !== true
        ) {

            throw new Error(
                response?.error ||
                "Unable to load menu."
            );

        }

        state.menu =
            normalizeMenu(
                response.items || []
            );

    } finally {

        state.isLoading = false;

    }

}


/* =========================================================
   MENU NORMALIZATION
========================================================= */

function normalizeMenu(items) {

    return items
        .map(
            item => {

                const id =
                    String(
                        item.id ?? ""
                    ).trim();

                const name =
                    String(
                        item.name ?? ""
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
                        item.tag ?? ""
                    ).trim();

                const type =
                    String(
                        item.type ?? ""
                    )
                    .trim()
                    .toLowerCase();

                return {

                    id,

                    name,

                    category,

                    price:
                        Number.isFinite(
                            price
                        )
                            ? price
                            : 0,

                    available,

                    tag,

                    type

                };

            }
        )
        .filter(
            item =>
                item.id &&
                item.name
        );

}


/* =========================================================
   CATEGORY NAVIGATION
   Uses existing category buttons
   already present in index.html.
========================================================= */

function setupCategories() {

    if (!DOM.categoryNav) {
        return;
    }

    const buttons =
        DOM.categoryNav.querySelectorAll(
            ".category-btn"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const category =
                        String(
                            button.dataset.category ||
                            "all"
                        )
                        .trim()
                        .toLowerCase();

                    state.activeCategory =
                        category;

                    buttons.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );

                    button.classList.add(
                        "active"
                    );

                    renderMenu();

                }
            );

        }
    );

}


/* =========================================================
   FILTER MENU
========================================================= */

function getFilteredMenu() {

    const search =
        state.search
            .trim()
            .toLowerCase();

    const category =
        state.activeCategory
            .trim()
            .toLowerCase();


    return state.menu.filter(
        item => {

            const itemCategory =
                item.category
                    .trim()
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9]+/g,
                        "-"
                    )
                    .replace(
                        /^-|-$|/g,
                        ""
                    );

            const categoryMatch =
                category === "all" ||
                itemCategory === category ||
                item.category
                    .trim()
                    .toLowerCase() ===
                    category;


            const searchableText =
                [
                    item.name,
                    item.category,
                    item.tag
                ]
                    .join(" ")
                    .toLowerCase();


            const searchMatch =
                !search ||
                searchableText.includes(
                    search
                );


            return (
                categoryMatch &&
                searchMatch
            );

        }
    );

}


/* =========================================================
   RENDER MENU
========================================================= */

function renderMenu() {

    if (!DOM.menuContainer) {
        return;
    }

    const items =
        getFilteredMenu();

    DOM.menuContainer.innerHTML =
        "";


    if (DOM.itemCount) {

        DOM.itemCount.textContent =
            `${items.length} ${
                items.length === 1
                    ? "item"
                    : "items"
            }`;

    }


    if (DOM.emptyState) {

        DOM.emptyState.style.display =
            items.length === 0
                ? "block"
                : "none";

    }


    items.forEach(
        item => {

            DOM.menuContainer.appendChild(
                createMenuCard(item)
            );

        }
    );

}


/* =========================================================
   MENU CARD
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

    name.textContent =
        item.name;


    const tag =
        document.createElement(
            "p"
        );

    tag.className =
        "menu-card-tag";

    tag.textContent =
        item.tag || "";


    if (!item.tag) {

        tag.style.display =
            "none";

    }


    const meta =
        document.createElement(
            "div"
        );

    meta.className =
        "menu-card-meta";


    const category =
        document.createElement(
            "span"
        );

    category.textContent =
        item.category;


    const price =
        document.createElement(
            "strong"
        );

    price.textContent =
        formatCurrency(
            item.price
        );


    meta.appendChild(
        category
    );

    meta.appendChild(
        price
    );


    content.appendChild(
        name
    );

    content.appendChild(
        tag
    );

    content.appendChild(
        meta
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

        const add =
            document.createElement(
                "button"
            );

        add.type =
            "button";

        add.className =
            "add-button";

        add.textContent =
            "Add";

        add.addEventListener(
            "click",
            () => {

                addToCart(
                    item
                );

            }
        );

        right.appendChild(
            add
        );

    }


    card.appendChild(
        content
    );

    card.appendChild(
        right
    );


    /*
     * Veg / Non-Veg indicator.
     */

    if (
        item.type === "veg" ||
        item.type === "nonveg"
    ) {

        const typeBadge =
            document.createElement(
                "span"
            );

        typeBadge.className =
            `food-type ${item.type}`;

        typeBadge.textContent =
            item.type === "veg"
                ? "VEG"
                : "NON-VEG";

        card.appendChild(
            typeBadge
        );

    }


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
        () => {

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
        () => {

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
            "This item is currently unavailable.",
            "error"
        );

        return;

    }


    const current =
        state.cart.get(
            item.id
        ) || 0;


    if (current >= 50) {

        showToast(
            "Maximum quantity reached.",
            "error"
        );

        return;

    }


    state.cart.set(
        item.id,
        current + 1
    );


    renderMenu();

    renderCart();

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
        current + amount;


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

    }


    renderMenu();

    renderCart();

    updateCartUI();

}


function getCartQuantity(
    itemId
) {

    return (
        state.cart.get(
            itemId
        ) || 0
    );

}


/* =========================================================
   CART DATA
========================================================= */

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

                id:
                    item.id,

                name:
                    item.name,

                category:
                    item.category,

                price:
                    item.price,

                quantity,

                lineTotal:
                    roundMoney(
                        item.price *
                        quantity
                    )

            });

        }
    );


    return items;

}


function getCartTotal() {

    return roundMoney(
        getCartItems()
            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    item.lineTotal,
                0
            )
    );

}


function getCartItemCount() {

    return getCartItems()
        .reduce(
            (
                total,
                item
            ) =>
                total +
                item.quantity,
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


    if (DOM.cartItemCount) {

        DOM.cartItemCount.textContent =
            count;

    }


    if (DOM.cartTotal) {

        DOM.cartTotal.textContent =
            formatCurrency(
                total
            );

    }


    if (DOM.summarySubtotal) {

        DOM.summarySubtotal.textContent =
            formatCurrency(
                total
            );

    }


    if (DOM.summaryTotal) {

        DOM.summaryTotal.textContent =
            formatCurrency(
                total
            );

    }


    if (DOM.cartSummary) {

        DOM.cartSummary.style.display =
            count > 0
                ? ""
                : "none";

    }

}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    const items =
        getCartItems();


    if (!DOM.cartItems) {
        return;
    }


    DOM.cartItems.innerHTML =
        "";


    if (DOM.emptyCart) {

        DOM.emptyCart.style.display =
            items.length === 0
                ? ""
                : "none";

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
                    "strong"
                );

            name.textContent =
                item.name;


            const price =
                document.createElement(
                    "span"
                );

            price.textContent =
                `${formatCurrency(
                    item.price
                )} × ${item.quantity}`;


            info.appendChild(
                name
            );

            info.appendChild(
                price
            );


            const controls =
                createQuantityControl(
                    item.id,
                    item.quantity
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
   CHECKOUT PREVIEW
========================================================= */

function renderCheckout() {

    const items =
        getCartItems();


    if (!DOM.checkoutItems) {
        return;
    }


    DOM.checkoutItems.innerHTML =
        "";


    items.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "checkout-item";


            const name =
                document.createElement(
                    "span"
                );

            name.textContent =
                `${item.name} × ${item.quantity}`;


            const price =
                document.createElement(
                    "strong"
                );

            price.textContent =
                formatCurrency(
                    item.lineTotal
                );


            row.appendChild(
                name
            );

            row.appendChild(
                price
            );


            DOM.checkoutItems.appendChild(
                row
            );

        }
    );


    if (DOM.checkoutTotal) {

        DOM.checkoutTotal.textContent =
            formatCurrency(
                getCartTotal()
            );

    }

}


/* =========================================================
   CART MODAL
========================================================= */

function openCart() {

    renderCart();

    showOverlay(
        DOM.cartOverlay
    );

}


function closeCart() {

    hideOverlay(
        DOM.cartOverlay
    );

}


function openCheckout() {

    if (
        getCartItemCount() === 0
    ) {

        showToast(
            "Your cart is empty.",
            "error"
        );

        return;

    }


    renderCheckout();

    hideOverlay(
        DOM.cartOverlay
    );

    showOverlay(
        DOM.checkoutOverlay
    );

}


function closeCheckout() {

    hideOverlay(
        DOM.checkoutOverlay
    );

}


/* =========================================================
   CREATE ORDER
========================================================= */

async function submitOrder(
    event
) {

    event.preventDefault();


    if (state.isSubmitting) {
        return;
    }


    if (
        !state.tableToken ||
        !state.table
    ) {

        showToast(
            "Please scan the table QR code again.",
            "error"
        );

        return;

    }


    const items =
        getCartItems();


    if (
        items.length === 0
    ) {

        showToast(
            "Your cart is empty.",
            "error"
        );

        return;

    }


    const customerName =
        String(
            DOM.customerName?.value ||
            ""
        ).trim();


    const mobile =
        String(
            DOM.customerPhone?.value ||
            ""
        ).trim();


    const specialRequest =
        String(
            DOM.orderNote?.value ||
            ""
        ).trim();


    if (!customerName) {

        showToast(
            "Please enter your name.",
            "error"
        );

        DOM.customerName?.focus();

        return;

    }


    /*
     * Current backend requires mobile.
     */

    if (!mobile) {

        showToast(
            "Please enter your mobile number.",
            "error"
        );

        DOM.customerPhone?.focus();

        return;

    }


    const cleanMobile =
        mobile.replace(
            /[\s-]/g,
            ""
        );


    if (
        !/^[0-9+]{10,15}$/.test(
            cleanMobile
        )
    ) {

        showToast(
            "Please enter a valid mobile number.",
            "error"
        );

        DOM.customerPhone?.focus();

        return;

    }


    state.isSubmitting =
        true;


    setPlaceOrderLoading(
        true
    );


    try {

        /*
         * Customer key:
         * generated locally once,
         * then sent with order.
         */

        let customerKey =
            localStorage.getItem(
                "cafe_customer_key"
            );


        if (!customerKey) {

            customerKey =
                generateLocalKey();

            localStorage.setItem(
                "cafe_customer_key",
                customerKey
            );

        }


        /*
         * IMPORTANT:
         * Backend currently expects
         * action + order fields directly.
         *
         * Do NOT wrap this in { data: ... }.
         */

        const response =
            await apiPost({

                action:
                    "createOrder",

                tableToken:
                    state.tableToken,

                customerName,

                mobile:
                    cleanMobile,

                specialRequest,

                customerKey,

                couponCode:
                    "",

                items:
                    items.map(
                        item => ({

                            id:
                                item.id,

                            quantity:
                                item.quantity

                        })
                    )

            });


        if (
            !response ||
            response.success !== true
        ) {

            throw new Error(
                response?.error ||
                "Order could not be placed."
            );

        }


        const order =
            {

                orderId:
                    response.orderId,

                customerKey:
                    response.customerKey ||
                    customerKey,

                table:
                    response.table,

                status:
                    response.status,

                items:
                    response.items || items,

                subtotal:
                    response.subtotal,

                couponCode:
                    response.couponCode || "",

                discountPercent:
                    response.discountPercent || 0,

                discountAmount:
                    response.discountAmount || 0,

                finalTotal:
                    response.finalTotal,

                createdAt:
                    response.createdAt ||
                    new Date().toISOString(),

                savedAt:
                    Date.now()

            };


        state.activeOrder =
            order;


        saveActiveOrder(
            order
        );


        /*
         * Show success.
         */

        if (DOM.successOrderId) {

            DOM.successOrderId.textContent =
                order.orderId;

        }


        if (DOM.successTotal) {

            DOM.successTotal.textContent =
                formatCurrency(
                    order.finalTotal
                );

        }


        hideOverlay(
            DOM.checkoutOverlay
        );

        showOverlay(
            DOM.successOverlay
        );


        /*
         * New order starts with
         * an empty cart.
         */

        state.cart.clear();

        renderMenu();

        updateCartUI();


        showToast(
            "Order placed successfully."
        );


    } catch (error) {

        console.error(
            "Order submission error:",
            error
        );

        showToast(
            error.message ||
            "Unable to place order.",
            "error"
        );

    } finally {

        state.isSubmitting =
            false;

        setPlaceOrderLoading(
            false
        );

    }

}


/* =========================================================
   NEW ORDER
========================================================= */

function startNewOrder() {

    state.cart.clear();

    state.activeOrder =
        null;


    /*
     * Do not delete customer key.
     * Same browser/customer can
     * continue using the system.
     */

    renderMenu();

    updateCartUI();


    hideOverlay(
        DOM.successOverlay
    );


    showToast(
        "Ready for a new order."
    );

}


/* =========================================================
   ACTIVE ORDER
   Local recovery for 2 hours.
========================================================= */

function loadActiveOrder() {

    try {

        const raw =
            localStorage.getItem(
                "cafe_active_order"
            );


        if (!raw) {
            return;
        }


        const order =
            JSON.parse(
                raw
            );


        if (
            !order ||
            !order.orderId ||
            !order.savedAt
        ) {

            clearActiveOrder();

            return;

        }


        const age =
            Date.now() -
            Number(
                order.savedAt
            );


        const maxAge =
            Number(
                APP_CONFIG.activeOrderHours
            ) *
            60 *
            60 *
            1000;


        if (
            age >
            maxAge
        ) {

            clearActiveOrder();

            return;

        }


        state.activeOrder =
            order;


    } catch (error) {

        console.warn(
            "Could not recover active order.",
            error
        );

        clearActiveOrder();

    }

}


function saveActiveOrder(
    order
) {

    try {

        localStorage.setItem(
            "cafe_active_order",
            JSON.stringify(
                order
            )
        );

    } catch (error) {

        console.warn(
            "Could not save active order.",
            error
        );

    }

}


function clearActiveOrder() {

    state.activeOrder =
        null;

    localStorage.removeItem(
        "cafe_active_order"
    );

}


/* =========================================================
   API - GET
========================================================= */

async function apiGet(
    action,
    params = {}
) {

    if (!APP_CONFIG.apiUrl) {

        throw new Error(
            "Apps Script API URL is missing."
        );

    }


    const query =
        new URLSearchParams();


    query.set(
        "action",
        action
    );


    Object.keys(
        params
    ).forEach(
        key => {

            const value =
                params[key];


            if (
                value !== undefined &&
                value !== null
            ) {

                query.set(
                    key,
                    String(value)
                );

            }

        }
    );


    const response =
        await fetch(
            APP_CONFIG.apiUrl +
            "?" +
            query.toString(),
            {
                method: "GET",
                redirect: "follow",
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Server connection failed."
        );

    }


    const data =
        await response.json();


    return data;

}


/* =========================================================
   API - POST
========================================================= */

async function apiPost(
    payload
) {

    if (!APP_CONFIG.apiUrl) {

        throw new Error(
            "Apps Script API URL is missing."
        );

    }


    /*
     * text/plain avoids unnecessary
     * CORS preflight with Apps Script.
     */

    const response =
        await fetch(
            APP_CONFIG.apiUrl,
            {

                method:
                    "POST",

                headers:
                    {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                body:
                    JSON.stringify(
                        payload
                    ),

                redirect:
                    "follow"

            }
        );


    if (!response.ok) {

        throw new Error(
            "Server connection failed."
        );

    }


    return await response.json();

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    setupCategories();


    if (DOM.searchInput) {

        DOM.searchInput.addEventListener(
            "input",
            () => {

                state.search =
                    DOM.searchInput.value;

                if (DOM.clearSearch) {

                    DOM.clearSearch.hidden =
                        !state.search;

                }

                renderMenu();

            }
        );

    }


    if (DOM.clearSearch) {

        DOM.clearSearch.addEventListener(
            "click",
            clearSearch
        );

    }


    if (DOM.resetSearch) {

        DOM.resetSearch.addEventListener(
            "click",
            () => {

                clearSearch();

                state.activeCategory =
                    "all";

                activateAllCategory();

                renderMenu();

            }
        );

    }


    if (DOM.cartButton) {

        DOM.cartButton.addEventListener(
            "click",
            openCart
        );

    }


    if (DOM.closeCart) {

        DOM.closeCart.addEventListener(
            "click",
            closeCart
        );

    }


    if (DOM.cartOverlay) {

        DOM.cartOverlay.addEventListener(
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

    }


    if (DOM.continueShopping) {

        DOM.continueShopping.addEventListener(
            "click",
            closeCart
        );

    }


    if (DOM.checkoutButton) {

        DOM.checkoutButton.addEventListener(
            "click",
            openCheckout
        );

    }


    if (DOM.closeCheckout) {

        DOM.closeCheckout.addEventListener(
            "click",
            closeCheckout
        );

    }


    if (DOM.editCart) {

        DOM.editCart.addEventListener(
            "click",
            () => {

                closeCheckout();

                openCart();

            }
        );

    }


    if (DOM.orderForm) {

        DOM.orderForm.addEventListener(
            "submit",
            submitOrder
        );

    }


    if (DOM.newOrderButton) {

        DOM.newOrderButton.addEventListener(
            "click",
            startNewOrder
        );

    }


    if (DOM.infoBtn) {

        DOM.infoBtn.addEventListener(
            "click",
            () => {

                showOverlay(
                    DOM.infoOverlay
                );

            }
        );

    }


    if (DOM.closeInfo) {

        DOM.closeInfo.addEventListener(
            "click",
            () => {

                hideOverlay(
                    DOM.infoOverlay
                );

            }
        );

    }


    if (DOM.infoOverlay) {

        DOM.infoOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    DOM.infoOverlay
                ) {

                    hideOverlay(
                        DOM.infoOverlay
                    );

                }

            }
        );

    }

}


/* =========================================================
   CATEGORY HELPERS
========================================================= */

function activateAllCategory() {

    if (!DOM.categoryNav) {
        return;
    }


    const buttons =
        DOM.categoryNav.querySelectorAll(
            ".category-btn"
        );


    buttons.forEach(
        button => {

            const category =
                String(
                    button.dataset.category ||
                    ""
                )
                .trim()
                .toLowerCase();


            if (
                category === "all"
            ) {

                button.classList.add(
                    "active"
                );

            } else {

                button.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   SEARCH
========================================================= */

function clearSearch() {

    if (DOM.searchInput) {

        DOM.searchInput.value =
            "";

    }


    state.search =
        "";


    if (DOM.clearSearch) {

        DOM.clearSearch.hidden =
            true;

    }


    renderMenu();

}


/* =========================================================
   OVERLAY HELPERS
========================================================= */

function showOverlay(
    element
) {

    if (!element) {
        return;
    }


    element.classList.add(
        "active"
    );


    element.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function hideOverlay(
    element
) {

    if (!element) {
        return;
    }


    element.classList.remove(
        "active"
    );


    element.setAttribute(
        "aria-hidden",
        "true"
    );


    const anyOpen =
        document.querySelector(
            ".modal-overlay.active"
        );


    if (!anyOpen) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


/* =========================================================
   PLACE ORDER BUTTON
========================================================= */

function setPlaceOrderLoading(
    loading
) {

    if (!DOM.placeOrderButton) {
        return;
    }


    DOM.placeOrderButton.disabled =
        loading;


    if (loading) {

        DOM.placeOrderButton.dataset
            .originalText =
            DOM.placeOrderButton.innerHTML;


        DOM.placeOrderButton.innerHTML =
            `
            <span>Placing Order...</span>
            <span>⏳</span>
            `;

    } else {

        DOM.placeOrderButton.innerHTML =
            DOM.placeOrderButton.dataset
                .originalText ||
            `
            <span>Confirm Order</span>
            <span>→</span>
            `;

    }

}


/* =========================================================
   TABLE REQUIRED STATE
========================================================= */

function showTableRequired() {

    if (DOM.menuContainer) {

        DOM.menuContainer.innerHTML =
            `
            <div class="empty-state"
                 style="display:block">

                <div class="empty-icon">
                    📱
                </div>

                <h3>
                    Table QR Required
                </h3>

                <p>
                    Please scan the QR code
                    placed on your table.
                </p>

            </div>
            `;

    }


    if (DOM.itemCount) {

        DOM.itemCount.textContent =
            "QR required";

    }

}


/* =========================================================
   FATAL ERROR
========================================================= */

function showFatalError(
    message
) {

    if (!DOM.menuContainer) {
        return;
    }


    DOM.menuContainer.innerHTML =
        `
        <div class="empty-state"
             style="display:block">

            <div class="empty-icon">
                ⚠️
            </div>

            <h3>
                Unable to load menu
            </h3>

            <p>
                ${escapeHtml(
                    message
                )}
            </p>

            <button
                type="button"
                class="reset-btn"
                onclick="location.reload()">

                Try Again

            </button>

        </div>
        `;

}


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

    if (!DOM.pageLoader) {
        return;
    }


    DOM.pageLoader.classList.add(
        "hidden"
    );


    setTimeout(
        () => {

            DOM.pageLoader.style.display =
                "none";

        },
        350
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    if (!DOM.toast) {
        return;
    }


    if (DOM.toastMessage) {

        DOM.toastMessage.textContent =
            message;

    } else {

        DOM.toast.textContent =
            message;

    }


    if (DOM.toastIcon) {

        DOM.toastIcon.textContent =
            type === "error"
                ? "!"
                : "✓";

    }


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
            2600
        );

}


/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
    amount
) {

    const value =
        Number(
            amount || 0
        );


    return (
        APP_CONFIG.currency +
        value.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits:
                    2
            }
        )
    );

}


function roundMoney(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return 0;

    }


    return (
        Math.round(
            number * 100
        ) / 100
    );

}


function generateLocalKey() {

    if (
        window.crypto &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }


    return (
        "CK-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 12)
    );

}


function escapeHtml(
    value
) {

    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   END
========================================================= */
