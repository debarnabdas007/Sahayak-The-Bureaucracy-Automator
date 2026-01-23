document.addEventListener('DOMContentLoaded', () => {
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    const body = document.body;

    // Function to set the icon based on the current theme state
    const updateIcon = () => {
        if (body.classList.contains('theme-dark')) {
            themeToggleIcon.classList.remove('fa-sun');
            themeToggleIcon.classList.add('fa-moon');
        } else {
            themeToggleIcon.classList.remove('fa-moon');
            themeToggleIcon.classList.add('fa-sun');
        }
    };

    // 1. On page load, apply the saved theme from localStorage, if any
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('theme-dark');
    }
    
    // 2. Set the initial icon state based on the current theme
    updateIcon();

    // 3. Add a click event listener to the toggle icon
    themeToggleIcon.addEventListener('click', () => {
        // Toggle the theme class on the body
        body.classList.toggle('theme-dark');

        // Check the new state and save it to localStorage
        if (body.classList.contains('theme-dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }

        // Update the icon to reflect the new theme
        updateIcon();
    });
});

