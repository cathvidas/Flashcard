document.addEventListener('DOMContentLoaded', () => {
    const optionsContainer = document.getElementById('optionsContainer');
    const addOptBtn = document.getElementById('addOptBtn');
    const generateBtn = document.getElementById('generateBtn');
    const outputArea = document.getElementById('outputArea');
    const jsonResult = document.getElementById('jsonResult');

    addOptBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'opt-input';
        input.placeholder = `Next Option`;
        optionsContainer.appendChild(input);
    });

    generateBtn.addEventListener('click', () => {
        const options = Array.from(document.querySelectorAll('.opt-input'))
                             .map(i => i.value)
                             .filter(v => v.trim() !== "");

        const newEntry = {
            question: document.getElementById('qInput').value,
            options: options,
            answer: document.getElementById('aInput').value,
            explanation: document.getElementById('eInput').value.replace(/\n/g, '<br>')
        };

        jsonResult.textContent = JSON.stringify(newEntry, null, 4) + ",";
        outputArea.style.display = 'block';
    });
});