let cart = JSON.parse(localStorage.getItem("cart")) || [];

updateCart();

function addToCart(name, price) {
    cart.push({ name, price });
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");

    cartItems.innerHTML = "";
    cartCount.innerText = cart.length;

    cart.forEach((item, index) => {
        let li = document.createElement("li");
        li.innerHTML = `${item.name} - ₹${item.price}
        <span class="remove" onclick="removeItem(${index})">❌</span>`;
        cartItems.appendChild(li);
    });
}

function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCart();
}
