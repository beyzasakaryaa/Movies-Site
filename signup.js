const form = document.getElementById('signup-form');

form.addEventListener("submit",function (e) {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value.trim().toLowerCase();
    const password = form.querySelector('input[type="password"]').value.trim();

    if(!email || !password)
    {
        alert("Please fill in all fields.");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users") || '[]');

    const exists = users.some((u) => u.email === email);
    if (exists) {
        alert("This email is already registered. Please log in.");
        return;
    }

    users.push({ email, password });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! You can now log in.");
    window.location.href = "login.html"; 


});