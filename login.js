const form = document.getElementById('login-form');

if(form){
    form.addEventListener('submit' , (e) => {
        e.preventDefault();

        const email = form.querySelector('input[type ="email"]').value.trim().toLowerCase();
        const password = form.querySelector('input[type="password"]').value.trim();

        if (!email || !password){
            alert('Please fill in all fiels.');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');

        const user = users.find(u => u.email === email && u.password === password);

        if(!user){
            alert('Invalid email or password.');
            return;
        }

        localStorage.setItem('currentUser',email);

        alert('Login succesful!');

        window.location.href = 'index.html';

    });
}