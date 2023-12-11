document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-container form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            const response = await fetch('http://localhost:5001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.role === 'admin') {
                    console.log('Admin login successful');
                    window.location.href = '../html/admin.html';
                } else {
                    console.log('User login successful');
                    window.location.href = '../html/home.html';
                }
            } else {
                console.error('Login failed');
                // Handle errors, e.g., show message to the user
            }
        } catch (error) {
            console.error('Error:', error);
            // Handle errors, e.g., show message to the user
        }
    });
});
