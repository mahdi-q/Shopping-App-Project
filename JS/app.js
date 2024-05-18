// json-server --watch db.json => run in terminal

// selecting
const selectOpenCart = document.querySelector(".nav__cart");
const selectClearCart = document.querySelector(".clear-cart");
const selectConfirmCart = document.querySelector(".confirm-cart");
const selectBackdrop = document.querySelector(".backdrop");
const selectOpenSearch = document.querySelector(".open-search");
const selectCartSection = document.querySelector(".cart-section");
const selectProductsWrapper = document.querySelector(".products__wrapper");
const selectNavCounter = document.querySelector(".nav__counter");
const selestCartPrice = document.querySelector(".cart__price");
const selectCartBody = document.querySelector(".cart__body");
const selectSearchSection = document.querySelector(".header-section");
const selectSearchBar = document.querySelector(".search-bar");
const selectLinks = document.querySelectorAll(".link");

// add event
document.addEventListener("DOMContentLoaded", () => {
  const products = new Products();
  setTimeout(() => {
    new Ui(products);
    new Storage(products);
  }, 1000);
});

// classes

// 1. get products
class Products {
  constructor() {
    this.allProductsData = [];

    axios
      .get("http://localhost:3000/products")
      .then((res) => {
        this.allProductsData.push(...res.data);
      })
      .catch((err) => console.log(err.message));
  }
}

// 2. display products
class Ui {
  constructor(products) {
    this.products = products.allProductsData;
    this.buttonsDom = [];
    this.cart = [];

    this.setupApp();
    this.displayProducts(this.products);
    this.getAddToCartBtns();
    this.cartLagic();

    selectOpenCart.addEventListener("click", this.creatCartDom);
    selectClearCart.addEventListener("click", this.clearCartDom);
    selectBackdrop.addEventListener("click", this.clearCartDom);
    selectConfirmCart.addEventListener("click", this.clearCartDom);
    selectOpenSearch.addEventListener("click", () => {
      if (selectSearchSection.style.display === "flex") {
        this.displayProducts(this.products);
        this.getAddToCartBtns();
      }
      this.toggleSearch();
    });
    selectSearchBar.addEventListener("input", (e) =>
      this.searchProducts(this.products, e.target.value)
    );
    selectLinks.forEach((link) =>
      link.addEventListener("click", (e) => this.filterProducts(e))
    );
  }

  setupApp() {
    this.cart = Storage.getCart() || [];

    this.cart.forEach((cartItem) => this.addCartItem(cartItem));
    this.setCartValue();
  }

  displayProducts(products) {
    let result = "";
    products.forEach(
      (product) =>
        (result += `<div class="product">
          <div class="product__image">
            <img src="${product.image}" alt="" />
          </div>
          <div class="product__info">
            <span class="product__title">${product.title}</span>
            <span class="product__price">${product.price} $</span>
          </div>
          <div class="product__btn">
            <button class="btn btn--primary add-to-cart" data-id=${product.id} >add to cart</button>
          </div>
        </div>`)
    );
    selectProductsWrapper.innerHTML = result;
  }

  getAddToCartBtns() {
    const addToCartBtns = [...document.querySelectorAll(".add-to-cart")];
    this.buttonsDom = addToCartBtns;

    addToCartBtns.forEach((btn) => {
      const id = btn.dataset.id;
      const isInCart = this.cart.find((p) => parseInt(p.id) === parseInt(id));
      if (isInCart) {
        btn.innerText = "in cart";
        btn.disabled = true;
      }

      btn.addEventListener("click", (event) => {
        event.target.innerText = "in cart";
        event.target.disabled = true;

        const selectedProduct = this.products.find((p) => {
          return p.id == id;
        });
        const clickedBtn = {
          ...selectedProduct,
          quantity: 1,
        };

        this.cart.push(clickedBtn);
        Storage.saveCart(this.cart);
        this.setCartValue();
        this.addCartItem(clickedBtn);
      });
    });
  }

  addCartItem(cartItem) {
    const div = document.createElement("div");
    div.classList.add("cart__item");
    div.innerHTML = `
          <div class="cart__info">
            <img src=${cartItem.image} alt="" />
            <div class="image-info">
              <span class="title">${cartItem.title}</span>
              <span class="price">${cartItem.price} $</span>
            </div>
          </div>
          <div class="cart__icons">
            <div class="cart__counter">
              <i class="fa-solid fa-chevron-up" data-id=${cartItem.id} ></i>
              <span>${cartItem.quantity}</span>
              <i class="fa-solid fa-chevron-down" data-id=${cartItem.id} ></i>
            </div>
            <i class="fa-solid fa-trash" data-id=${cartItem.id} ></i>
          </div>`;
    selectCartBody.appendChild(div);
  }

  cartLagic() {
    selectClearCart.addEventListener("click", () => this.clearCart());

    selectCartBody.addEventListener("click", (event) => {
      if (event.target.classList.contains("fa-chevron-up")) {
        const addQuantity = event.target;

        this.increaseQuantity(addQuantity);
      } else if (event.target.classList.contains("fa-chevron-down")) {
        const deleteQuantity = event.target;

        this.decreaseQuantity(deleteQuantity);
      } else if (event.target.classList.contains("fa-trash")) {
        const removeItem = event.target;

        this.removeCartItem(removeItem);
      }
    });
  }

  increaseQuantity(addQuantity) {
    const addedItem = this.cart.find(
      (pItem) => pItem.id == addQuantity.dataset.id
    );
    addedItem.quantity++;

    this.setCartValue();
    Storage.saveCart(this.cart);
    addQuantity.nextElementSibling.innerText = addedItem.quantity;
  }

  decreaseQuantity(deleteQuantity) {
    const deletedItem = this.cart.find(
      (pItem) => parseInt(pItem.id) === parseInt(deleteQuantity.dataset.id)
    );
    deletedItem.quantity--;

    const itemQuantity = deletedItem.quantity;
    deleteQuantity.previousElementSibling.innerText = itemQuantity;

    if (itemQuantity === 0) {
      this.cart = this.cart.filter(
        (item) => item.id !== deleteQuantity.dataset.id
      );
      Storage.saveCart(this.cart);

      this.updateButtons(deleteQuantity.dataset.id);

      selectCartBody.removeChild(
        deleteQuantity.parentElement.parentElement.parentElement
      );
    }

    this.setCartValue();
    Storage.saveCart(this.cart);
  }

  removeCartItem(removeItem) {
    const removedItem = this.cart.find(
      (pItem) => pItem.id == removeItem.dataset.id
    );

    Storage.saveCart(this.cart);

    selectCartBody.removeChild(removeItem.parentElement.parentElement);
    this.cart = this.cart.filter((item) => item.id !== removedItem.id);

    this.setCartValue();
    this.updateButtons(removeItem.dataset.id);
  }

  clearCart() {
    this.cart.forEach((item) => {
      this.cart = this.cart.filter((p) => p.id !== item.id);
      Storage.saveCart(this.cart);
      this.updateButtons(item.id);
      this.setCartValue();
    });

    while (selectCartBody.children.length) {
      selectCartBody.removeChild(selectCartBody.children[0]);
    }
  }

  setCartValue() {
    let navCounter = 0;

    const totalPrice = this.cart.reduce((acc, curr) => {
      navCounter += curr.quantity;
      return acc + curr.quantity * curr.price;
    }, 0);

    selectNavCounter.innerText = navCounter;
    selestCartPrice.innerText = `Total Price : ${totalPrice.toFixed(2)} $`;
  }

  updateButtons(id) {
    const button = this.buttonsDom.find(
      (btn) => parseInt(btn.dataset.id) === parseInt(id)
    );
    button.innerText = "add to cart";
    button.disabled = false;
  }

  searchProducts(products, filter) {
    const filteredProducts = products.filter((product) =>
      product.title.toLowerCase().trim().includes(filter.toLowerCase().trim())
    );
    this.displayProducts(filteredProducts);
    this.getAddToCartBtns();
    this.cartLagic();
  }

  filterProducts(e) {
    const eventFilter = e.target.dataset.filter;

    const filtered = this.products.filter(
      (product) => product.class === eventFilter
    );

    if (eventFilter === "all") {
      this.displayProducts(this.products);
    } else {
      this.displayProducts(filtered);
    }

    this.getAddToCartBtns();
    this.cartLagic();
  }

  creatCartDom() {
    selectBackdrop.style.display = "block";
    selectCartSection.style.opacity = "1";
    selectCartSection.style.top = "50%";
    window.scrollTo(0, 0);
  }

  clearCartDom() {
    selectBackdrop.style.display = "none";
    selectCartSection.style.opacity = "0";
    selectCartSection.style.top = "-100%";
  }

  toggleSearch() {
    window.scrollTo(0, 0);

    if (selectSearchSection.style.display === "none") {
      selectSearchSection.style.display = "flex";
    } else if (selectSearchSection.style.display === "flex") {
      selectSearchSection.style.display = "none";
      selectSearchBar.firstElementChild.value = "";
    }
  }
}

// 3. storage products
class Storage {
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return JSON.parse(localStorage.getItem("cart"));
  }
}
