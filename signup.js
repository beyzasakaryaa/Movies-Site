const form = document.getElementById('signup-form');

form.addEventListener("submit", function (e) {
  e.preventDefault();

  // alanları çek
  const first = document.getElementById('first-name').value.trim();
  const last = document.getElementById('last-name').value.trim();
  const gender = document.getElementById('gender').value;
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();

  // basit kontroller
  if (!first || !last || !gender || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }
  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  // toplu kullanıcı listesi (opsiyonel)
  let users = JSON.parse(localStorage.getItem("users") || '[]');
  const exists = users.some((u) => u.email === email);
  if (exists) {
    alert("This email is already registered. Please log in.");
    return;
  }

  // kullanıcı objesi
  const user = {
    name: first,
    surname: last,
    email,
    gender,
    password, // şimdilik localStorage’a düz yazıyorsun (gerçekte güvenli değil!)
    registrationDate: new Date().toISOString()
  };

  // hem listeye ekle
  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));

  // hem de email’i key olarak sakla (profil okurken kolaylık için)
  localStorage.setItem(email, JSON.stringify(user));

  // aktif kullanıcı olarak set et
  localStorage.setItem("currentUser", email);

  alert("Registration successful!");
  window.location.href = "index.html"; 
});
