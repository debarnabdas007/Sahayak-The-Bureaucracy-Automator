document.getElementById('submit-btn').addEventListener('click', () => {
    const category = document.getElementById('category-select').value;
    const draftEn = document.getElementById('draft-en').value;

    const data = {
        category: category,
        draft_en: draftEn
    };

    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/submit_success';
        } else {
            alert('Failed to send email. Please try again later.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
});

// Pre-select the category based on the AI's guess
document.addEventListener('DOMContentLoaded', () => {
    const guessedCategory = document.getElementById('guessed-category').textContent;
    const categorySelect = document.getElementById('category-select');
    for (let i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].value === guessedCategory) {
            categorySelect.options[i].selected = true;
            break;
        }
    }
});