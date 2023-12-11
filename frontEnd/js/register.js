document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('.register-container form');
    
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(registerForm);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await fetch('http://localhost:5001/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                console.log('Registration successful');
                window.location.href = '../html/login.html';
            } else {
                console.error('Registration failed');
                // Handle errors, e.g., show message to the user
            }
        } catch (error) {
            console.error('Error:', error);
            // Handle errors, e.g., show message to the user
        }
    });
});
