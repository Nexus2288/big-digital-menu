/* =========================================================
   LOVE OVER COFFEE
   CUSTOMER MENU - PART 1
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
    "hero.jpg",

  // Google Apps Script Web App URL.
  // Example: https://script.google.com/macros/s/XXXXX/exec
  apiUrl:
    "PASTE_APPS_SCRIPT_WEB_APP_URL_HERE",

  defaultTable:
    null

};


/* =========================================================
   DEMO MENU
   Temporary data for Part 1.

   Google Sheets/API will replace this
   in the next parts.
========================================================= */

const DEMO_MENU = [

  {
    id: "101",
    name: "Chicken Sandwich",
    category: "Sandwiches",
    price: 220,
    available: true,
    tag:
      "Grilled chicken, melted cheese, fresh vegetables & creamy sauce.",
    type:
      "nonveg"
  },

  {
    id: "102",
    name: "Veg Cheese Sandwich",
    category: "Sandwiches",
    price: 180,
    available: true,
    tag:
      "Fresh vegetables, melted cheese & creamy mayo.",
    type:
      "veg"
  },

  {
    id: "103",
    name: "Special Sandwich",
    category: "Sandwiches",
    price: 240,
    available: true,
    tag:
      "A delicious combination of grilled chicken, melted cheese, fresh vegetables and our special creamy sauce, layered between soft toasted bread.",
    type:
      "nonveg"
  },

  {
    id: "104",
    name: "Cold Coffee",
    category: "Beverages",
    price: 160,
    available: true,
    tag:
      "Smooth chilled coffee blended with creamy milk.",
    type:
      "veg"
  },

  {
    id: "105",
    name: "Cappuccino",
    category: "Beverages",
    price: 150,
    available: true,
    tag:
      "Rich espresso with silky steamed milk foam.",
    type:
      "veg"
  },

  {
    id: "106",
    name: "Classic Burger",
    category: "Burgers",
    price: 260,
    available: true,
    tag:
      "Crispy lettuce, fresh vegetables and signature sauce.",
    type:
      "veg"
  },

  {
    id: "107",
    name: "Chicken Burger",
    category: "Burgers",
    price: 290,
    available: true,
    tag:
      "Juicy grilled chicken with lettuce, cheese and house sauce.",
    type:
      "nonveg"
  },

  {
    id: "108",
    name: "Chocolate Brownie",
    category: "Desserts",
    price: 180,
    available: false,
    tag:
      "Warm chocolate brownie with a rich fudgy centre.",
    type:
      "veg"
  }

];


/* =========================================================
   STATE
========================================================= */

const state = {

  menu:
    [],

  categories:
    [],

  activeCategory:
    "All",

  search:
    "",

  cart:
    new Map(),

  table:
    null,

  activeOrder:
    null

};


/* =========================================================
   DOM
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
    document.getElementById("viewOrderButton")

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
  updateCartUI();

  const tableToken = getTableTokenFromUrl();

  if (!tableToken) {
    showTableError("Please scan the QR code placed on your table.");
    return;
  }

  state.table = { token: tableToken };
  DOM.tableNumber.textContent = "Checking…";

  try {
    const tableResult = await apiGet_("validateTable", { token: tableToken });

    if (!tableResult.success || !tableResult.valid) {
      throw new Error(tableResult.error || "Invalid or inactive table QR.");
    }

    state.table = {
      token: tableToken,
      tableId: tableResult.tableId,
      tableName: tableResult.tableName
    };

    DOM.tableNumber.textContent = tableResult.tableName || tableResult.tableId || "—";

    await loadLiveMenu();
    await loadActiveOrder();

  } catch (error) {
    console.error(error);
    showTableError(error.message || "Unable to load this table.");
  }
}

async function loadLiveMenu() {
  const response = await apiGet_("getMenu");
  if (!response.success) throw new Error(response.error || "Unable to load menu.");

  state.menu = normalizeMenu(response.items || []);
  buildCategories();
  renderCategories();
  renderMenu();
}

function getTableTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = String(params.get("t") || params.get("token") || "").trim();
  if (token && /^[A-Za-z0-9_-]{20,100}$/.test(token)) return token;
  return null;
}

function showTableError(message) {
  state.table = null;
  DOM.tableNumber.textContent = "—";
  DOM.categoryList.innerHTML = "";
  DOM.menuContainer.innerHTML = `
    <div class="table-access-error" style="padding:28px 18px;text-align:center;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.04)">
      <div style="font-size:34px;margin-bottom:10px">⌁</div>
      <strong style="display:block;margin-bottom:7px">Table QR Required</strong>
      <span style="opacity:.7">${escapeHtml_(message)}</span>
    </div>`;
  DOM.emptyMenu.hidden = true;
}

function apiBaseUrl_() {
  const url = String(APP_CONFIG.apiUrl || "").trim();
  if (!url || url.includes("PASTE_APPS_SCRIPT_WEB_APP_URL_HERE")) {
    throw new Error("Apps Script Web App URL is not configured in script.js.");
  }
  return url.replace(/\/$/, "");
}

async function apiGet_(action, params = {}) {
  const query = new URLSearchParams({ action, ...params });
  const response = await fetch(`${apiBaseUrl_()}?${query.toString()}`, {
    method: "GET",
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`API request failed (${response.status}).`);
  return response.json();
}

async function apiPost_(payload) {
  const response = await fetch(apiBaseUrl_(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`API request failed (${response.status}).`);
  return response.json();
}

function escapeHtml_(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
  }[char]));
}



/* =========================================================
   BRANDING
========================================================= */

function applyCafeBranding() {

  DOM.cafeName.textContent =
    APP_CONFIG.cafeName;

  DOM.cafeNameSmall.textContent =
    APP_CONFIG.cafeName.toUpperCase();

  DOM.cafeTagline.textContent =
    APP_CONFIG.tagline;


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


/* =========================================================
   TABLE DETECTION
   IMPORTANT:
   Part 1 only reads demo URL parameter.

   Secure token-based table validation
   will be implemented in backend part.
========================================================= */

function detectTableFromUrl() {
  return getTableTokenFromUrl();
}



/* =========================================================
   MENU NORMALIZATION
========================================================= */

function normalizeMenu(items) {

  return items
    .map((item) => {

      const id =
        String(item.id ?? "").trim();

      const name =
        String(item.name ?? "").trim();

      const category =
        String(item.category ?? "Other").trim();

      const price =
        Number(item.price);

      const available =
        item.available !== false;

      const tag =
        String(item.tag ?? "").trim();

      const type =
        String(item.type ?? "").toLowerCase();

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
    .filter(
      (item) =>
        item.id &&
        item.name
    );

}


/* =========================================================
   CATEGORIES
========================================================= */

function buildCategories() {

  const categories =
    state.menu
      .map(
        (item) =>
          item.category
      )
      .filter(Boolean);

  state.categories = [
    "All",
    ...new Set(categories)
  ];

}


/* =========================================================
   RENDER CATEGORIES
========================================================= */

function renderCategories() {

  DOM.categoryList.innerHTML =
    "";

  state.categories.forEach(
    (category) => {

      const button =
        document.createElement("button");

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

          renderMenu();

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

function getFilteredMenu() {

  const search =
    state.search
      .trim()
      .toLowerCase();

  return state.menu.filter(
    (item) => {

      const matchesCategory =
        state.activeCategory ===
          "All" ||
        item.category ===
          state.activeCategory;

      const searchableText =
        [
          item.name,
          item.category,
          item.tag
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

}


/* =========================================================
   RENDER MENU
========================================================= */

function renderMenu() {

  DOM.menuContainer.innerHTML =
    "";

  const items =
    getFilteredMenu();

  DOM.emptyMenu.hidden =
    items.length !== 0;

  items.forEach(
    (item) => {

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
    document.createElement("article");

  card.className =
    "menu-card";

  if (!item.available) {

    card.classList.add(
      "unavailable"
    );

  }


  const top =
    document.createElement("div");

  top.className =
    "menu-card-top";


  const content =
    document.createElement("div");

  content.className =
    "menu-card-content";


  const name =
    document.createElement("h3");

  name.className =
    "menu-card-name";

  name.textContent =
    item.name;


  const tag =
    document.createElement("div");

  tag.className =
    "menu-card-tag";

  tag.textContent =
    item.tag;

  tag.hidden =
    !item.tag;


  const category =
    document.createElement("span");

  category.className =
    "menu-card-category";

  category.textContent =
    item.category;


  const price =
    document.createElement("div");

  price.className =
    "menu-card-price";

  price.textContent =
    formatCurrency(item.price);


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
    document.createElement("div");

  right.className =
    "menu-card-right";


  const quantity =
    getCartQuantity(item.id);


  if (!item.available) {

    const stock =
      document.createElement("span");

    stock.className =
      "out-of-stock";

    stock.textContent =
      "Out of Stock";

    right.appendChild(
      stock
    );

  } else if (quantity > 0) {

    right.appendChild(
      createQuantityControl(
        item.id,
        quantity
      )
    );

  } else {

    const button =
      document.createElement("button");

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
    document.createElement("div");

  wrapper.className =
    "quantity-control";


  const minus =
    document.createElement("button");

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

      changeQuantity(
        itemId,
        -1
      );

    }
  );


  const number =
    document.createElement("span");

  number.className =
    "quantity-number";

  number.textContent =
    quantity;


  const plus =
    document.createElement("button");

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
    state.cart.get(item.id) || 0;

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
    state.cart.get(itemId) || 0;

  const next =
    current + amount;

  if (next <= 0) {

    state.cart.delete(
      itemId
    );

  } else {

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
    state.cart.get(itemId) ||
    0
  );

}


/* =========================================================
   CART CALCULATIONS
========================================================= */

function getCartItems() {

  const items = [];

  state.cart.forEach(
    (quantity, itemId) => {

      const item =
        state.menu.find(
          (menuItem) =>
            menuItem.id === itemId
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
      ) =>
        total +
        item.lineTotal,
      0
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

  DOM.cartBar.hidden =
    count === 0;

  DOM.cartItemCount.textContent =
    `${count} ${
      count === 1
        ? "item"
        : "items"
    }`;

  DOM.cartTotal.textContent =
    formatCurrency(total);

  DOM.drawerTotal.textContent =
    formatCurrency(total);

}


function renderCart() {

  const items =
    getCartItems();

  DOM.cartItems.innerHTML =
    "";

  DOM.cartEmpty.hidden =
    items.length !== 0;

  items.forEach(
    (item) => {

      const row =
        document.createElement("div");

      row.className =
        "cart-item";


      const info =
        document.createElement("div");

      info.className =
        "cart-item-info";


      const name =
        document.createElement("div");

      name.className =
        "cart-item-name";

      name.textContent =
        item.name;


      const price =
        document.createElement("div");

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
        document.createElement("div");

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
   CART DRAWER
========================================================= */

function openCart() {

  renderCart();

  DOM.cartOverlay.hidden =
    false;

  DOM.cartDrawer.classList.add(
    "open"
  );

  DOM.cartDrawer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

}


function closeCart() {

  DOM.cartDrawer.classList.remove(
    "open"
  );

  DOM.cartDrawer.setAttribute(
    "aria-hidden",
    "true"
  );

  setTimeout(
    () => {

      DOM.cartOverlay.hidden =
        true;

    },
    280
  );

  document.body.style.overflow =
    "";

}


/* =========================================================
   ACTIVE ORDER
========================================================= */

async function loadActiveOrder() {
  if (!state.table?.token) return;

  const key = `cafe_active_order_${state.table.token}`;

  try {
    const saved = localStorage.getItem(key);
    if (!saved) return;

    const local = JSON.parse(saved);
    if (!local?.orderId || !local?.customerKey || !local?.savedAt) return;

    const ageHours = (Date.now() - Number(local.savedAt)) / 3600000;
    if (ageHours > 2) {
      localStorage.removeItem(key);
      return;
    }

    const response = await apiGet_("getOrder", {
      orderId: local.orderId,
      customerKey: local.customerKey
    });

    if (!response.success || !response.found) {
      localStorage.removeItem(key);
      return;
    }

    state.activeOrder = response.order;
    state.activeOrder.customerKey = local.customerKey;
    state.activeOrder.savedAt = local.savedAt;
    showActiveOrder(state.activeOrder);

  } catch (error) {
    console.warn("Could not load active order.", error);
  }
}

function showActiveOrder(order) {
  if (!order || !DOM.activeOrderBanner) return;
  DOM.activeOrderBanner.hidden = false;
  DOM.activeOrderText.textContent = `Order #${order.orderId} • ${getFriendlyStatus_(order.status)}`;
}

function saveActiveOrder(order) {
  if (!state.table?.token || !order?.orderId || !order?.customerKey) return;
  try {
    localStorage.setItem(`cafe_active_order_${state.table.token}`, JSON.stringify({
      orderId: order.orderId,
      customerKey: order.customerKey,
      savedAt: Date.now()
    }));
  } catch (error) {
    console.warn("Could not save active order.", error);
  }
}

function clearActiveOrder() {
  if (!state.table?.token) return;
  try { localStorage.removeItem(`cafe_active_order_${state.table.token}`); } catch (_) {}
}

function getFriendlyStatus_(status) {
  if (status === "New") return "Order Received";
  if (status === "Preparing") return "Preparing";
  if (status === "Completed") return "Completed";
  if (status === "Cancelled") return "Cancelled";
  return status || "Unknown";
}

function startOrderPolling_() {
  clearInterval(startOrderPolling_.timer);
  if (!state.activeOrder?.orderId || !state.activeOrder?.customerKey) return;

  startOrderPolling_.timer = setInterval(async () => {
    try {
      const response = await apiGet_("getOrder", {
        orderId: state.activeOrder.orderId,
        customerKey: state.activeOrder.customerKey
      });
      if (!response.success || !response.found) return;
      state.activeOrder = { ...state.activeOrder, ...response.order, customerKey: state.activeOrder.customerKey };
      showActiveOrder(state.activeOrder);
      if (response.order.status === "Completed" || response.order.status === "Cancelled") {
        clearInterval(startOrderPolling_.timer);
      }
      if (document.getElementById("orderStatusModal")?.dataset.open === "true") {
        renderOrderStatus_(state.activeOrder);
      }
    } catch (error) {
      console.warn("Order status refresh failed.", error);
    }
  }, 15000);
}



/* =========================================================
   SEARCH
========================================================= */

function handleSearch() {

  state.search =
    DOM.searchInput.value;

  DOM.clearSearch.hidden =
    !state.search;

  renderMenu();

}


function clearSearch() {

  DOM.searchInput.value =
    "";

  state.search =
    "";

  DOM.clearSearch.hidden =
    true;

  renderMenu();

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

  DOM.searchInput.addEventListener(
    "input",
    handleSearch
  );


  DOM.clearSearch.addEventListener(
    "click",
    clearSearch
  );


  DOM.viewCartButton.addEventListener(
    "click",
    openCart
  );


  DOM.closeCart.addEventListener(
    "click",
    closeCart
  );


  DOM.cartOverlay.addEventListener(
    "click",
    closeCart
  );


  DOM.checkoutButton.addEventListener("click", openCheckoutModal);


  DOM.viewOrderButton.addEventListener("click", () => {
    if (state.activeOrder) openOrderStatusModal();
    else showToast("No active order found.");
  });

}


/* =========================================================
   CHECKOUT + ORDER STATUS
========================================================= */

function ensureModalStyles_() {
  if (document.getElementById("locDynamicStyles")) return;
  const style = document.createElement("style");
  style.id = "locDynamicStyles";
  style.textContent = `
    .loc-modal{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;padding:14px}
    .loc-modal[hidden]{display:none}.loc-modal-card{width:min(560px,100%);max-height:90vh;overflow:auto;background:#171717;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:22px;box-shadow:0 20px 70px rgba(0,0,0,.5)}
    .loc-modal-head{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px}.loc-modal-head h2{margin:0;font-size:22px}.loc-close{border:0;background:rgba(255,255,255,.08);color:#fff;width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer}
    .loc-field{margin:12px 0}.loc-field label{display:block;font-size:13px;opacity:.72;margin-bottom:7px}.loc-field input,.loc-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);background:#0f0f0f;color:#fff;border-radius:13px;padding:13px;font:inherit;outline:none}.loc-field textarea{min-height:90px;resize:vertical}.loc-submit{width:100%;border:0;border-radius:14px;padding:14px;background:#fff;color:#111;font-weight:700;font:inherit;cursor:pointer}.loc-submit:disabled{opacity:.55;cursor:not-allowed}.loc-note{font-size:12px;opacity:.58;line-height:1.5;margin-top:10px}
    .loc-status{border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:18px;margin-bottom:14px;background:rgba(255,255,255,.04)}.loc-status-pill{display:inline-flex;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.09);font-size:12px;font-weight:700}.loc-items{display:grid;gap:9px;margin-top:14px}.loc-item{display:flex;justify-content:space-between;gap:10px;font-size:14px}.loc-total{border-top:1px solid rgba(255,255,255,.1);margin-top:14px;padding-top:14px;display:flex;justify-content:space-between;font-weight:700}
  `;
  document.head.appendChild(style);
}

function createModal_(id, title) {
  ensureModalStyles_();
  let modal = document.getElementById(id);
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = id;
  modal.className = "loc-modal";
  modal.hidden = true;
  modal.innerHTML = `<div class="loc-modal-card"><div class="loc-modal-head"><h2>${escapeHtml_(title)}</h2><button class="loc-close" type="button" aria-label="Close">×</button></div><div class="loc-modal-body"></div></div>`;
  modal.addEventListener("click", e => { if (e.target === modal) closeModal_(modal); });
  modal.querySelector(".loc-close").addEventListener("click", () => closeModal_(modal));
  document.body.appendChild(modal);
  return modal;
}

function closeModal_(modal) {
  if (!modal) return;
  modal.hidden = true;
  modal.dataset.open = "false";
  document.body.style.overflow = "";
}

function openCheckoutModal() {
  if (!state.table?.token) { showToast("Please scan a valid table QR first."); return; }
  if (getCartItemCount() === 0) { showToast("Your cart is empty."); return; }

  const modal = createModal_("checkoutModal", "Complete Your Order");
  const body = modal.querySelector(".loc-modal-body");
  body.innerHTML = `
    <div class="loc-status"><strong>${escapeHtml_(state.table.tableName || "Table")}</strong><div class="loc-note">Your table is securely identified by the QR code.</div></div>
    <div class="loc-field"><label for="checkoutName">Your Name</label><input id="checkoutName" maxlength="80" autocomplete="name" placeholder="Enter your name"></div>
    <div class="loc-field"><label for="checkoutMobile">Mobile Number</label><input id="checkoutMobile" maxlength="10" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile number"></div>
    <div class="loc-field"><label for="checkoutRequest">Special Instructions <span style="opacity:.55">(optional)</span></label><textarea id="checkoutRequest" maxlength="300" placeholder="Less spicy, no onions, etc."></textarea></div>
    <div class="loc-status"><strong>Order Total</strong><div class="loc-total" style="border:0;margin-top:8px;padding-top:0"><span>${getCartItemCount()} items</span><span>${formatCurrency(getCartTotal())}</span></div></div>
    <button class="loc-submit" id="placeOrderButton" type="button">Place Order</button>
    <div class="loc-note">Prices and availability are checked again on the server before your order is saved.</div>`;

  modal.querySelector("#checkoutMobile").addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0,10); });
  modal.querySelector("#placeOrderButton").addEventListener("click", submitOrder_);
  modal.hidden = false; modal.dataset.open = "true"; document.body.style.overflow = "hidden";
}

async function submitOrder_() {
  const nameEl = document.getElementById("checkoutName");
  const mobileEl = document.getElementById("checkoutMobile");
  const requestEl = document.getElementById("checkoutRequest");
  const button = document.getElementById("placeOrderButton");
  if (!nameEl || !mobileEl || !button) return;

  const customerName = nameEl.value.trim();
  const mobile = mobileEl.value.trim();
  const specialRequest = requestEl?.value.trim() || "";

  if (!customerName) { showToast("Enter your name."); nameEl.focus(); return; }
  if (!/^\d{10}$/.test(mobile)) { showToast("Enter a valid 10-digit mobile number."); mobileEl.focus(); return; }
  if (!state.table?.token) { showToast("Invalid table QR."); return; }

  const items = getCartItems().map(item => ({ id:item.id, quantity:item.quantity }));
  button.disabled = true; button.textContent = "Placing Order…";

  try {
    const response = await apiPost_({
      action: "createOrder",
      tableToken: state.table.token,
      customerName,
      mobile,
      specialRequest,
      items
    });

    if (!response.success) throw new Error(response.error || "Order could not be placed.");

    const order = {
      ...response,
      customerKey: response.customerKey,
      savedAt: Date.now()
    };
    state.activeOrder = order;
    saveActiveOrder(order);
    state.cart.clear();
    renderMenu(); renderCart(); updateCartUI(); closeCart();
    closeModal_(document.getElementById("checkoutModal"));
    showActiveOrder(order);
    openOrderStatusModal();
    startOrderPolling_();
    showToast("Order placed successfully.");
  } catch (error) {
    console.error(error);
    showToast(error.message || "Unable to place order.");
    button.disabled = false; button.textContent = "Place Order";
  }
}

function openOrderStatusModal() {
  if (!state.activeOrder) return;
  const modal = createModal_("orderStatusModal", "Your Order");
  renderOrderStatus_(state.activeOrder);
  modal.hidden = false; modal.dataset.open = "true"; document.body.style.overflow = "hidden";
  startOrderPolling_();
}

function renderOrderStatus_(order) {
  const modal = document.getElementById("orderStatusModal");
  if (!modal) return;
  const body = modal.querySelector(".loc-modal-body");
  const items = Array.isArray(order.items) ? order.items : [];
  body.innerHTML = `
    <div class="loc-status"><div class="loc-status-pill">${escapeHtml_(getFriendlyStatus_(order.status))}</div><div style="margin-top:10px;font-weight:700">Order #${escapeHtml_(order.orderId)}</div><div class="loc-note">${escapeHtml_(order.table || state.table?.tableName || "")}</div></div>
    <div class="loc-items">${items.map(item => `<div class="loc-item"><span>${escapeHtml_(item.name)} × ${Number(item.quantity || 0)}</span><strong>${formatCurrency(item.lineTotal)}</strong></div>`).join("")}</div>
    <div class="loc-total"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
    ${Number(order.discountAmount || 0) ? `<div class="loc-item" style="margin-top:10px"><span>Discount</span><strong>−${formatCurrency(order.discountAmount)}</strong></div>` : ""}
    <div class="loc-total"><span>Total</span><span>${formatCurrency(order.finalTotal)}</span></div>
    ${order.specialRequest ? `<div class="loc-note"><strong>Special request:</strong> ${escapeHtml_(order.specialRequest)}</div>` : ""}`;
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  amount
) {

  return (
    APP_CONFIG.currency +
    Number(amount || 0)
      .toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2
        }
      )
  );

}


function showToast(
  message
) {

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