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
        false,

    appliedCoupon:
        null,

    orderStatusTimer:
        null

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

    couponInput:
        document.getElementById("couponInput"),

    applyCouponButton:
        document.getElementById("applyCouponButton"),

    couponMessage:
        document.getElementById("couponMessage"),

    confirmSubtotal:
        document.getElementById("confirmSubtotal"),

    confirmDiscountLabel:
        document.getElementById("confirmDiscountLabel"),

    confirmDiscount:
        document.getElementById("confirmDiscount"),

    nextCouponBox:
        document.getElementById("nextCouponBox"),

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

        if (state.activeOrder) {
            refreshOrderStatus();
            startOrderStatusPolling();
        }

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


    DOM.categoryList.innerHTML = "";


    state.categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


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


            button.addEventListener(
                "click",
                () => {

                    state.activeCategory =
                        category;

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
   FILTER MENU
========================================================= */

function applyFilters() {

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
                    state.activeCategory ===
                    "All" ||
                    item.category ===
                    state.activeCategory;


                const haystack = [
                    item.name,
                    item.category,
                    item.tag,
                    item.type
                ]
                .join(" ")
                .toLowerCase();


                const matchesSearch =
                    !search ||
                    haystack.includes(
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


    if (
        !state.filteredMenu.length
    ) {

        if (DOM.emptyMenu) {

            DOM.emptyMenu.hidden =
                false;

            DOM.emptyMenu.innerHTML = `

                <div class="empty-icon">
                    🍽️
                </div>

                <h3>
                    No items found
                </h3>

                <p>
                    Try another search or category.
                </p>

            `;

        }

        return;

    }


    if (DOM.emptyMenu) {

        DOM.emptyMenu.hidden =
            true;

    }


    state.filteredMenu.forEach(
        item => {

            const card =
                createMenuCard(item);


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
            "is-unavailable"
        );

    }


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "menu-card-content";


    const top =
        document.createElement(
            "div"
        );


    top.className =
        "menu-card-top";


    const left =
        document.createElement(
            "div"
        );


    left.className =
        "menu-card-left";


    const name =
        document.createElement(
            "h3"
        );


    name.className =
        "menu-card-name";


    name.textContent =
        item.name;


    const category =
        document.createElement(
            "div"
        );


    category.className =
        "menu-card-category";


    category.textContent =
        item.category;


    left.appendChild(
        name
    );


    left.appendChild(
        category
    );


    top.appendChild(
        left
    );


    const right =
        document.createElement(
            "div"
        );


    right.className =
        "menu-card-right";


    const price =
        document.createElement(
            "div"
        );


    price.className =
        "menu-card-price";


    price.textContent =
        formatMoney(
            item.price
        );


    right.appendChild(
        price
    );


    if (item.type) {

        const type =
            document.createElement(
                "span"
            );


        type.className =
            "menu-type";


        type.textContent =
            item.type === "veg"
                ? "VEG"
                : item.type === "non-veg"
                    ? "NON-VEG"
                    : item.type.toUpperCase();


        right.appendChild(
            type
        );

    }


    top.appendChild(
        right
    );


    content.appendChild(
        top
    );


    if (item.tag) {

        const tag =
            document.createElement(
                "span"
            );


        tag.className =
            "menu-card-tag";


        tag.textContent =
            item.tag;


        content.appendChild(
            tag
        );

    }


    const bottom =
        document.createElement(
            "div"
        );


    bottom.className =
        "menu-card-bottom";


    if (!item.available) {

        const unavailable =
            document.createElement(
                "span"
            );


        unavailable.className =
            "out-of-stock";


        unavailable.textContent =
            "Out of Stock";


        bottom.appendChild(
            unavailable
        );

    } else {

        const quantity =
            getCartQuantity(
                item.id
            );


        if (quantity > 0) {

            bottom.appendChild(
                createQuantityControl(
                    item.id,
                    quantity
                )
            );

        } else {

            const addButton =
                document.createElement(
                    "button"
                );


            addButton.type =
                "button";


            addButton.className =
                "add-item-button";


            addButton.textContent =
                "Add";


            addButton.addEventListener(
                "click",
                () => {

                    addToCart(
                        item.id
                    );

                }
            );


            bottom.appendChild(
                addButton
            );

        }

    }


    content.appendChild(
        bottom
    );


    card.appendChild(
        content
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


    minus.setAttribute(
        "aria-label",
        "Decrease quantity"
    );


    minus.addEventListener(
        "click",
        () => {

            updateCartQuantity(
                itemId,
                quantity - 1
            );

        }
    );


    const count =
        document.createElement(
            "span"
        );


    count.className =
        "quantity-value";


    count.textContent =
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


    plus.setAttribute(
        "aria-label",
        "Increase quantity"
    );


    plus.addEventListener(
        "click",
        () => {

            updateCartQuantity(
                itemId,
                quantity + 1
            );

        }
    );


    wrapper.appendChild(
        minus
    );

    wrapper.appendChild(
        count
    );

    wrapper.appendChild(
        plus
    );


    return wrapper;

}


/* =========================================================
   CART
========================================================= */

function getCartQuantity(itemId) {

    return Number(
        state.cart.get(
            String(itemId)
        ) || 0
    );

}


function addToCart(itemId) {

    const item =
        state.menu.find(
            menuItem =>
                String(
                    menuItem.id
                ) ===
                String(itemId)
        );


    if (!item) {

        return;

    }


    if (!item.available) {

        showToast(
            "This item is currently unavailable."
        );

        return;

    }


    const current =
        getCartQuantity(
            itemId
        );


    state.cart.set(
        String(itemId),
        current + 1
    );


    updateCartUI();

    renderMenu();

    showToast(
        `${item.name} added to cart`
    );

}


function updateCartQuantity(
    itemId,
    quantity
) {

    const id =
        String(itemId);


    if (
        quantity <= 0
    ) {

        state.cart.delete(
            id
        );

    } else {

        const item =
            state.menu.find(
                menuItem =>
                    String(
                        menuItem.id
                    ) === id
            );


        if (
            !item ||
            !item.available
        ) {

            return;

        }


        state.cart.set(
            id,
            quantity
        );

    }


    updateCartUI();

    renderMenu();

    renderCartDrawer();

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
                        String(
                            menuItem.id
                        ) ===
                        String(itemId)
                );


            if (!item) {

                return;

            }


            if (
                !item.available
            ) {

                return;

            }


            items.push({

                id:
                    item.id,

                name:
                    item.name,

                price:
                    Number(item.price),

                quantity:
                    Number(quantity),

                category:
                    item.category,

                type:
                    item.type

            });

        }
    );


    return items;

}


function calculateCartSubtotal() {

    return getCartItems()
        .reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    (
                        item.price *
                        item.quantity
                    )
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
   UPDATE CART UI
========================================================= */

function updateCartUI() {

    const count =
        getCartItemCount();


    const subtotal =
        calculateCartSubtotal();


    if (DOM.cartItemCount) {

        DOM.cartItemCount.textContent =
            count;

    }


    if (DOM.cartTotal) {

        DOM.cartTotal.textContent =
            formatMoney(
                subtotal
            );

    }


    if (DOM.drawerTotal) {

        DOM.drawerTotal.textContent =
            formatMoney(
                subtotal
            );

    }


    if (DOM.cartBar) {

        DOM.cartBar.hidden =
            count <= 0;

    }


    if (DOM.checkoutButton) {

        DOM.checkoutButton.disabled =
            count <= 0;

    }


    renderCartDrawer();

}


/* =========================================================
   CART DRAWER
========================================================= */

function renderCartDrawer() {

    if (!DOM.cartItems) {

        return;

    }


    const items =
        getCartItems();


    DOM.cartItems.innerHTML =
        "";


    if (!items.length) {

        if (DOM.cartEmpty) {

            DOM.cartEmpty.hidden =
                false;

        }

        return;

    }


    if (DOM.cartEmpty) {

        DOM.cartEmpty.hidden =
            true;

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


            const itemName =
                document.createElement(
                    "div"
                );


            itemName.className =
                "cart-item-name";


            itemName.textContent =
                item.name;


            const itemPrice =
                document.createElement(
                    "div"
                );


            itemPrice.className =
                "cart-item-price";


            itemPrice.textContent =
                `${formatMoney(item.price)} × ${item.quantity}`;


            info.appendChild(
                itemName
            );


            info.appendChild(
                itemPrice
            );


            const controls =
                createQuantityControl(
                    item.id,
                    item.quantity
                );


            controls.classList.add(
                "cart-item-controls"
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

}


/* =========================================================
   OPEN / CLOSE CART
========================================================= */

function openCart() {

    if (!DOM.cartOverlay) {

        return;

    }


    renderCartDrawer();


    DOM.cartOverlay.hidden =
        false;

    if (DOM.cartDrawer) {
        DOM.cartDrawer.classList.add(
            "open"
        );
    }

    requestAnimationFrame(
        () => {

            DOM.cartOverlay.classList.add(
                "show"
            );

        }
    );

}


function closeCart() {

    if (!DOM.cartOverlay) {

        return;

    }


    DOM.cartOverlay.classList.remove(
        "show"
    );

    if (DOM.cartDrawer) {
        DOM.cartDrawer.classList.remove(
            "open"
        );
    }

    setTimeout(
        () => {

            DOM.cartOverlay.hidden =
                true;

        },
        250
    );

}


/* =========================================================
   CHECKOUT
========================================================= */

function openCheckout() {

    if (
        !getCartItems().length
    ) {

        showToast(
            "Your cart is empty."
        );

        return;

    }


    closeCart();

    state.appliedCoupon = null;
    if (DOM.couponInput) DOM.couponInput.value = "";
    setCouponMessage("", "");
    updateCheckoutTotals();


    if (
        DOM.tableNumberInput
    ) {

        DOM.tableNumberInput.value =
            state.table?.tableName ||
            "";

        DOM.tableNumberInput.readOnly =
            true;

    }


    if (DOM.checkoutOverlay) {

        DOM.checkoutOverlay.hidden =
            false;


        requestAnimationFrame(
            () => {

                DOM.checkoutOverlay.classList.add(
                    "show"
                );

            }
        );

    }

}


function closeCheckout() {

    if (!DOM.checkoutOverlay) {

        return;

    }


    DOM.checkoutOverlay.classList.remove(
        "show"
    );


    setTimeout(
        () => {

            DOM.checkoutOverlay.hidden =
                true;

        },
        250
    );

}


function setCouponMessage(message, type) {
    if (!DOM.couponMessage) return;
    DOM.couponMessage.textContent = message || "";
    DOM.couponMessage.className = "coupon-message" + (type ? ` ${type}` : "");
}

function updateCheckoutTotals() {
    const subtotal = calculateCartSubtotal();
    const discount = Number(state.appliedCoupon?.discountAmount || 0);
    const finalTotal = Math.max(0, subtotal - discount);

    if (DOM.confirmSubtotal) DOM.confirmSubtotal.textContent = formatMoney(subtotal);
    if (DOM.confirmDiscountLabel) DOM.confirmDiscountLabel.hidden = discount <= 0;
    if (DOM.confirmDiscount) {
        DOM.confirmDiscount.hidden = discount <= 0;
        DOM.confirmDiscount.textContent = `−${formatMoney(discount)}`;
    }
    if (DOM.confirmOrderTotal) DOM.confirmOrderTotal.textContent = formatMoney(finalTotal);
}

async function applyCoupon() {
    const code = String(DOM.couponInput?.value || "").trim().toUpperCase();
    const subtotal = calculateCartSubtotal();

    if (!code) {
        state.appliedCoupon = null;
        setCouponMessage("Enter a coupon code.", "error");
        updateCheckoutTotals();
        return;
    }

    if (DOM.applyCouponButton) DOM.applyCouponButton.disabled = true;
    setCouponMessage("Checking coupon…", "");

    try {
        const result = await callApiPost("validateCoupon", { couponCode: code, orderTotal: subtotal });
        if (!result || result.valid !== true) throw new Error(result?.message || "Invalid coupon code.");

        state.appliedCoupon = {
            code,
            discountPercent: Number(result.discountPercent || 0),
            discountAmount: Number(result.discountAmount || 0),
            finalTotal: Number(result.finalTotal ?? subtotal)
        };

        setCouponMessage(`${state.appliedCoupon.discountPercent}% discount applied.`, "success");
        updateCheckoutTotals();
    } catch (error) {
        state.appliedCoupon = null;
        setCouponMessage(error.message || "Unable to validate coupon.", "error");
        updateCheckoutTotals();
    } finally {
        if (DOM.applyCouponButton) DOM.applyCouponButton.disabled = false;
    }
}


/* =========================================================
   SUBMIT ORDER
========================================================= */

async function submitOrder(
    event
) {

    if (event) {

        event.preventDefault();

    }


    if (state.isSubmitting) {

        return;

    }


    const items =
        getCartItems();


    if (!items.length) {

        showToast(
            "Your cart is empty."
        );

        return;

    }


    if (!state.tableToken) {

        showToast(
            "Invalid table QR."
        );

        return;

    }


    const customerName =
        String(
            DOM.customerName?.value ||
            ""
        ).trim();


    const mobileNumber =
        String(
            DOM.mobileNumber?.value ||
            ""
        ).trim();


    const specialRequest =
        String(
            DOM.specialRequest?.value ||
            ""
        ).trim();


    if (!customerName) {

        showToast(
            "Please enter your name."
        );

        DOM.customerName?.focus();

        return;

    }


    if (!mobileNumber) {

        showToast(
            "Please enter your mobile number."
        );

        DOM.mobileNumber?.focus();

        return;

    }


    const subtotal =
        calculateCartSubtotal();


    const payload = {

        tableToken:
            state.tableToken,

        customerKey:
            state.customerKey,

        customerName:
            customerName,

        mobile:
            mobileNumber,

        specialRequest:
            specialRequest,

        items:
            items.map(
                item => ({

                    id:
                        item.id,

                    name:
                        item.name,

                    quantity:
                        item.quantity,

                    price:
                        item.price

                })
            ),

        couponCode:
            state.appliedCoupon?.code || "",

        subtotal:
            subtotal

    };


    state.isSubmitting =
        true;


    setSubmitButtonLoading(
        true
    );


    try {

        const result =
            await callApiPost(
                "createOrder",
                payload
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


        const order = {

            orderId:
                String(
                    result.orderId ||
                    ""
                ),

            customerKey:
                String(
                    result.customerKey ||
                    state.customerKey
                ),

            table:
                result.table ||
                state.table?.tableName ||
                "",

            items:
                Array.isArray(
                    result.items
                )
                    ? result.items
                    : items,

            subtotal:
                Number(
                    result.subtotal ??
                    subtotal
                ),

            couponCode:
                String(
                    result.couponCode ||
                    ""
                ),

            discountPercent:
                Number(
                    result.discountPercent ||
                    0
                ),

            discountAmount:
                Number(
                    result.discountAmount ||
                    0
                ),

            finalTotal:
                Number(
                    result.finalTotal ??
                    subtotal
                ),

            nextCoupon:
                result.nextCoupon || null,

            status:
                normalizeOrderStatus(
                    result.status ||
                    "New"
                ),

            createdAt:
                result.createdAt ||
                new Date().toISOString()

        };


        state.activeOrder =
            order;


        saveActiveOrder(
            order
        );


        state.cart.clear();


        updateCartUI();

        closeCheckout();


        showToast(
            `Order #${order.orderId} placed successfully.`
        );


        renderActiveOrderBanner();

        openOrderStatus();

        startOrderStatusPolling();


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

        setSubmitButtonLoading(
            false
        );

    }

}


/* =========================================================
   SUBMIT BUTTON STATE
========================================================= */

function setSubmitButtonLoading(
    loading
) {

    if (!DOM.confirmOrderButton) {

        return;

    }


    DOM.confirmOrderButton.disabled =
        loading;


    if (loading) {

        DOM.confirmOrderButton.dataset.originalText =
            DOM.confirmOrderButton.textContent;

        DOM.confirmOrderButton.textContent =
            "Placing Order...";

    } else {

        DOM.confirmOrderButton.textContent =
            DOM.confirmOrderButton.dataset.originalText ||
            "Confirm Order";

    }

}


/* =========================================================
   ACTIVE ORDER STORAGE
========================================================= */

const ACTIVE_ORDER_STORAGE_KEY =
    "loc_active_order";


const CUSTOMER_KEY_STORAGE_KEY =
    "loc_customer_key";


function getOrCreateCustomerKey() {

    let key =
        localStorage.getItem(
            CUSTOMER_KEY_STORAGE_KEY
        );


    if (key) {

        return key;

    }


    key =
        generateLocalId();


    localStorage.setItem(
        CUSTOMER_KEY_STORAGE_KEY,
        key
    );


    return key;

}


function generateLocalId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();

    }


    return (
        "loc-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 12)
    );

}


/* =========================================================
   SAVE ACTIVE ORDER
========================================================= */

function saveActiveOrder(
    order
) {

    if (!order) {

        return;

    }


    const payload = {

        ...order,

        savedAt:
            Date.now()

    };


    localStorage.setItem(
        ACTIVE_ORDER_STORAGE_KEY,
        JSON.stringify(
            payload
        )
    );

}


/* =========================================================
   LOAD ACTIVE ORDER
========================================================= */

function loadActiveOrder() {

    const raw =
        localStorage.getItem(
            ACTIVE_ORDER_STORAGE_KEY
        );


    if (!raw) {

        state.activeOrder =
            null;

        return null;

    }


    try {

        const order =
            JSON.parse(
                raw
            );


        const savedAt =
            Number(
                order.savedAt ||
                0
            );


        const maxAge =
            Number(
                APP_CONFIG.activeOrderHours ||
                2
            ) *
            60 *
            60 *
            1000;


        if (
            !savedAt ||
            Date.now() -
                savedAt >
                maxAge
        ) {

            clearActiveOrder();

            return null;

        }


        if (
            !order.orderId ||
            !order.customerKey
        ) {

            clearActiveOrder();

            return null;

        }


        if (
            order.customerKey !==
            state.customerKey
        ) {

            clearActiveOrder();

            return null;

        }


        state.activeOrder =
            order;


        renderActiveOrderBanner();


        return order;

    } catch (error) {

        console.error(
            "Active order storage error:",
            error
        );

        clearActiveOrder();

        return null;

    }

}


/* =========================================================
   CLEAR ACTIVE ORDER
========================================================= */

function clearActiveOrder() {

    state.activeOrder =
        null;


    localStorage.removeItem(
        ACTIVE_ORDER_STORAGE_KEY
    );


    stopOrderStatusPolling();

    renderActiveOrderBanner();

}


/* =========================================================
   ACTIVE ORDER BANNER
========================================================= */

function renderActiveOrderBanner() {

    if (
        !DOM.activeOrderBanner
    ) {

        return;

    }


    if (!state.activeOrder) {

        DOM.activeOrderBanner.hidden =
            true;

        return;

    }


    const orderId =
        state.activeOrder.orderId ||
        "";


    const status =
        normalizeOrderStatus(
            state.activeOrder.status ||
            "New"
        );


    const statusLabel =
        getCustomerStatusLabel(
            status
        );


    if (DOM.activeOrderText) {

        DOM.activeOrderText.textContent =
            `Order #${orderId} · ${statusLabel}`;

    }


    DOM.activeOrderBanner.hidden =
        false;

}


/* =========================================================
   ORDER STATUS
========================================================= */

function normalizeOrderStatus(
    status
) {

    const value =
        String(
            status ||
            ""
        )
        .trim()
        .toLowerCase();


    if (
        value === "preparing"
    ) {

        return "Preparing";

    }


    if (
        value === "completed" ||
        value === "complete" ||
        value === "done"
    ) {

        return "Completed";

    }


    if (
        value === "cancelled" ||
        value === "canceled"
    ) {

        return "Cancelled";

    }


    return "New";

}


function getCustomerStatusLabel(
    status
) {

    const normalized =
        normalizeOrderStatus(
            status
        );


    if (
        normalized ===
        "Preparing"
    ) {

        return "Preparing";

    }


    if (
        normalized ===
        "Completed"
    ) {

        return "Completed";

    }


    if (
        normalized ===
        "Cancelled"
    ) {

        return "Cancelled";

    }


    return "Order Received";

}


function getCustomerStatusMessage(
    status
) {

    const normalized =
        normalizeOrderStatus(
            status
        );


    if (
        normalized ===
        "Preparing"
    ) {

        return "Your order is being prepared.";

    }


    if (
        normalized ===
        "Completed"
    ) {

        return "Your order has been completed. Enjoy your meal!";

    }


    if (
        normalized ===
        "Cancelled"
    ) {

        return "This order has been cancelled.";

    }


    return "Your order has been received by the cafe.";

}


/* =========================================================
   REFRESH ORDER STATUS
========================================================= */

async function refreshOrderStatus() {

    if (
        !state.activeOrder ||
        !state.activeOrder.orderId ||
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
                        state.activeOrder.orderId,

                    customerKey:
                        state.customerKey
                }
            );


        if (
            !result ||
            result.success !== true
        ) {

            return;

        }


        if (
            result.found === false
        ) {

            return;

        }


        const serverOrder =
            result.order ||
            result.data ||
            null;


        if (!serverOrder) {

            return;

        }


        state.activeOrder = {

            ...state.activeOrder,

            ...serverOrder,

            status:
                normalizeOrderStatus(
                    serverOrder.status
                ),

            customerKey:
                state.customerKey,

            savedAt:
                Date.now()

        };


        saveActiveOrder(
            state.activeOrder
        );


        renderActiveOrderBanner();

        renderOrderStatus(
            state.activeOrder
        );


        if (
            normalizeOrderStatus(
                state.activeOrder.status
            ) ===
            "Completed"
        ) {

            stopOrderStatusPolling();

        }


    } catch (error) {

        console.error(
            "Order status refresh error:",
            error
        );

    }

}


/* =========================================================
   ORDER STATUS POLLING
========================================================= */

function startOrderStatusPolling() {

    stopOrderStatusPolling();


    if (
        !state.activeOrder ||
        !state.activeOrder.orderId
    ) {

        return;

    }


    state.orderStatusTimer =
        setInterval(
            () => {

                refreshOrderStatus();

            },
            12000
        );

}


function stopOrderStatusPolling() {

    if (
        state.orderStatusTimer
    ) {

        clearInterval(
            state.orderStatusTimer
        );

        state.orderStatusTimer =
            null;

    }

}
/* =========================================================
   RENDER ORDER STATUS
========================================================= */

function renderOrderStatus(
    order
) {

    if (!order) {

        return;

    }


    if (DOM.orderStatusNumber) {

        DOM.orderStatusNumber.textContent =
            order.orderId ||
            "—";

    }


    if (DOM.orderStatusTable) {

        DOM.orderStatusTable.textContent =
            order.table ||
            state.table?.tableName ||
            "—";

    }


    const status =
        normalizeOrderStatus(
            order.status
        );


    if (DOM.orderStatusState) {

        DOM.orderStatusState.textContent =
            getCustomerStatusLabel(
                status
            );

    }


    const message =
        document.getElementById(
            "orderStatusMessage"
        );


    if (message) {

        message.textContent =
            getCustomerStatusMessage(
                status
            );

    }


    updateOrderStatusSteps(
        status
    );


    const itemsContainer =
        document.getElementById(
            "orderStatusItems"
        );


    if (itemsContainer) {

        itemsContainer.innerHTML =
            "";


        const items =
            Array.isArray(
                order.items
            )
                ? order.items
                : [];


        if (!items.length) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "status-empty-items";


            empty.textContent =
                "No item details available.";


            itemsContainer.appendChild(
                empty
            );

        } else {

            items.forEach(
                item => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "status-item-row";


                    const name =
                        document.createElement(
                            "div"
                        );


                    name.className =
                        "status-item-name";


                    name.textContent =
                        `${item.name || "Item"} × ${Number(item.quantity || 0)}`;


                    const amount =
                        document.createElement(
                            "div"
                        );


                    amount.className =
                        "status-item-price";


                    amount.textContent =
                        formatMoney(
                            Number(
                                item.price || 0
                            ) *
                            Number(
                                item.quantity || 0
                            )
                        );


                    row.appendChild(
                        name
                    );


                    row.appendChild(
                        amount
                    );


                    itemsContainer.appendChild(
                        row
                    );

                }
            );

        }

    }


    const subtotal =
        Number(
            order.subtotal ||
            0
        );


    const discountAmount =
        Number(
            order.discountAmount ||
            0
        );


    const finalTotal =
        Number(
            order.finalTotal ??
            (
                subtotal -
                discountAmount
            )
        );


    const subtotalElement =
        document.getElementById(
            "orderStatusSubtotal"
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatMoney(
                subtotal
            );

    }


    const discountRow =
        document.getElementById(
            "orderStatusDiscountRow"
        );


    const discountElement =
        document.getElementById(
            "orderStatusDiscount"
        );


    if (
        discountRow &&
        discountElement
    ) {

        if (
            discountAmount > 0
        ) {

            discountRow.hidden =
                false;


            const discountPercent =
                Number(
                    order.discountPercent ||
                    0
                );


            discountElement.textContent =
                `-${formatMoney(discountAmount)}${discountPercent ? ` (${discountPercent}%)` : ""}`;

        } else {

            discountRow.hidden =
                true;

        }

    }


    const finalTotalElement =
        document.getElementById(
            "orderStatusFinalTotal"
        );


    if (finalTotalElement) {

        finalTotalElement.textContent =
            formatMoney(
                finalTotal
            );

    }

    renderNextCoupon(order.nextCoupon);

}

function renderNextCoupon(nextCoupon) {
    const box = DOM.nextCouponBox || document.getElementById("nextCouponBox");
    if (!box) return;

    if (!nextCoupon || !nextCoupon.code) {
        box.hidden = true;
        box.innerHTML = "";
        return;
    }

    const expiryText = nextCoupon.expiresAt ? new Date(nextCoupon.expiresAt).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "24 hours";
    box.hidden = false;
    box.innerHTML = `
        <div class="next-coupon-label">NEXT ORDER COUPON</div>
        <div class="next-coupon-code">${escapeHtmlClient(nextCoupon.code)}</div>
        <div class="next-coupon-info">${Number(nextCoupon.discountPercent || 0)}% OFF · Minimum order ${formatMoney(Number(nextCoupon.minOrder || 0))}+ · Valid up to ${formatMoney(Number(nextCoupon.maxOrder || 99999))}<br>Valid until ${escapeHtmlClient(expiryText)}</div>
        <button type="button" class="next-coupon-copy" id="copyNextCoupon">Copy Coupon</button>`;

    const copy = document.getElementById("copyNextCoupon");
    if (copy) copy.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(String(nextCoupon.code));
            copy.textContent = "Copied";
        } catch (error) {
            copy.textContent = String(nextCoupon.code);
        }
    });
}

function escapeHtmlClient(value) {
    return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}


/* =========================================================
   ORDER STATUS STEPS
========================================================= */

function updateOrderStatusSteps(
    status
) {

    const normalized =
        normalizeOrderStatus(
            status
        );


    const receivedStep =
        document.querySelector(
            '[data-step="received"]'
        );


    const preparingStep =
        document.querySelector(
            '[data-step="preparing"]'
        );


    const completedStep =
        document.querySelector(
            '[data-step="completed"]'
        );


    [
        receivedStep,
        preparingStep,
        completedStep
    ]
    .filter(Boolean)
    .forEach(
        step => {

            step.classList.remove(
                "active",
                "completed"
            );

        }
    );


    if (
        normalized ===
        "New"
    ) {

        receivedStep?.classList.add(
            "active"
        );

        return;

    }


    if (
        normalized ===
        "Preparing"
    ) {

        receivedStep?.classList.add(
            "completed"
        );

        preparingStep?.classList.add(
            "active"
        );

        return;

    }


    if (
        normalized ===
        "Completed"
    ) {

        receivedStep?.classList.add(
            "completed"
        );

        preparingStep?.classList.add(
            "completed"
        );

        completedStep?.classList.add(
            "active",
            "completed"
        );

        return;

    }


    if (
        normalized ===
        "Cancelled"
    ) {

        receivedStep?.classList.add(
            "completed"
        );

    }

}


/* =========================================================
   OPEN ORDER STATUS
========================================================= */

function openOrderStatus() {

    if (
        !state.activeOrder
    ) {

        showToast(
            "No active order found."
        );

        return;

    }


    renderOrderStatus(
        state.activeOrder
    );


    if (
        DOM.orderStatusOverlay
    ) {

        DOM.orderStatusOverlay.hidden =
            false;


        requestAnimationFrame(
            () => {

                DOM.orderStatusOverlay.classList.add(
                    "show"
                );

            }
        );

    }


    refreshOrderStatus();

    startOrderStatusPolling();

}


/* =========================================================
   CLOSE ORDER STATUS
========================================================= */

function closeOrderStatus() {

    if (
        !DOM.orderStatusOverlay
    ) {

        return;

    }


    DOM.orderStatusOverlay.classList.remove(
        "show"
    );


    setTimeout(
        () => {

            DOM.orderStatusOverlay.hidden =
                true;

        },
        250
    );

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    if (DOM.searchInput) {

        DOM.searchInput.addEventListener(
            "input",
            event => {

                state.search =
                    event.target.value ||
                    "";

                applyFilters();

                if (
                    DOM.clearSearch
                ) {

                    DOM.clearSearch.hidden =
                        !state.search;

                }

            }
        );

    }


    if (DOM.clearSearch) {

        DOM.clearSearch.addEventListener(
            "click",
            () => {

                if (DOM.searchInput) {

                    DOM.searchInput.value =
                        "";

                }

                state.search =
                    "";

                DOM.clearSearch.hidden =
                    true;

                applyFilters();

            }
        );

    }


    if (DOM.viewCartButton) {

        DOM.viewCartButton.addEventListener(
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


    if (DOM.checkoutButton) {

        DOM.checkoutButton.addEventListener(
            "click",
            openCheckout
        );

    }

    if (DOM.applyCouponButton) {
        DOM.applyCouponButton.addEventListener("click", applyCoupon);
    }

    if (DOM.couponInput) {
        DOM.couponInput.addEventListener("input", () => {
            if (state.appliedCoupon && DOM.couponInput.value.trim().toUpperCase() !== state.appliedCoupon.code) {
                state.appliedCoupon = null;
                setCouponMessage("", "");
                updateCheckoutTotals();
            }
        });
        DOM.couponInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                applyCoupon();
            }
        });
    }


    if (DOM.closeCheckout) {

        DOM.closeCheckout.addEventListener(
            "click",
            closeCheckout
        );

    }


    if (DOM.checkoutOverlay) {

        DOM.checkoutOverlay.addEventListener(
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

    }


    if (DOM.orderForm) {

        DOM.orderForm.addEventListener(
            "submit",
            submitOrder
        );

    }


    if (DOM.viewOrderButton) {

        DOM.viewOrderButton.addEventListener(
            "click",
            openOrderStatus
        );

    }


    if (DOM.closeOrderStatus) {

        DOM.closeOrderStatus.addEventListener(
            "click",
            closeOrderStatus
        );

    }


    if (DOM.orderStatusOverlay) {

        DOM.orderStatusOverlay.addEventListener(
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

    }


    const statusDoneButton =
        document.getElementById(
            "statusDoneButton"
        );


    if (statusDoneButton) {

        statusDoneButton.addEventListener(
            "click",
            closeOrderStatus
        );

    }


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


    Object.entries(
        params
    ).forEach(
        (
            [key, value]
        ) => {

            if (
                value !== undefined &&
                value !== null
            ) {

                url.searchParams.set(
                    key,
                    String(value)
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

                cache:
                    "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            `API request failed (${response.status}).`
        );

    }


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    } catch (error) {

        throw new Error(
            "Invalid response from server."
        );

    }


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
                        action,
                        ...data
                    })
            }
        );


    if (!response.ok) {

        throw new Error(
            `API request failed (${response.status}).`
        );

    }


    const text =
        await response.text();


    let result;


    try {

        result =
            JSON.parse(
                text
            );

    } catch (error) {

        throw new Error(
            "Invalid response from server."
        );

    }


    return result;

}


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(
    amount
) {

    const number =
        Number(
            amount || 0
        );


    return (
        APP_CONFIG.currency +
        number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits:
                    0,

                maximumFractionDigits:
                    2
            }
        )
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer =
    null;


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
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                DOM.toast.classList.remove(
                    "show"
                );

            },
            2800
        );

}


/* =========================================================
   WINDOW / PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            if (
                state.activeOrder
            ) {

                refreshOrderStatus();

            }

        }

    }
);


/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopOrderStatusPolling();

    }
);


/* =========================================================
   SAFETY: RECOVER ORDER ON PAGE LOAD
========================================================= */

window.addEventListener(
    "pageshow",
    () => {

        if (
            state.activeOrder
        ) {

            refreshOrderStatus();

        }

    }
);

