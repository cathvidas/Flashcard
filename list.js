document.addEventListener('DOMContentLoaded', async () => {
    const DATA_SOURCE = 'questions.json';
    const listContainer = document.getElementById('listContainer');
    const toggleAllBtn = document.getElementById('toggleAllBtn');
    let allExpanded = false;

    try {
        const response = await fetch(DATA_SOURCE);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const quizData = await response.json();

        if (quizData && quizData.length > 0) {
            listContainer.innerHTML = ''; // Clear loading message
            
            quizData.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'list-card';

                let optionsHtml = '';
                if (item.options && Array.isArray(item.options)) {
                    optionsHtml = `<ul class="options-list">` + 
                        item.options.map(opt => `<li>${opt}</li>`).join('') + 
                        `</ul>`;
                }

                let attachmentHtml = '';
                if (item.attachment) {
                    attachmentHtml = `<div class="q-attachment" style="margin-bottom: 1rem;"><img src="${'attachments/' + item.attachment}" alt="Attachment" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0;"></div>`;
                }

                card.innerHTML = `
                    <div class="list-card-header">
                        <div class="q-text" style="margin-bottom: 0;">#${index + 1}: ${item.question}</div>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="list-card-details" style="display: none; margin-top: 1.5rem;">
                        ${attachmentHtml}
                        ${optionsHtml}
                        <div style="margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem;">
                            <p style="color: var(--primary); font-weight: 700; margin-bottom: 0.5rem;">Answer: ${item.answer}</p>
                            <div class="a-explanation" style="color: var(--text-main);">${item.explanation}</div>
                        </div>
                    </div>
                `;

                const header = card.querySelector('.list-card-header');
                const details = card.querySelector('.list-card-details');
                const icon = card.querySelector('.toggle-icon');

                header.addEventListener('click', () => {
                    const isHidden = details.style.display === 'none';
                    details.style.display = isHidden ? 'block' : 'none';
                    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                });

                listContainer.appendChild(card);
            });

            toggleAllBtn.addEventListener('click', () => {
                allExpanded = !allExpanded;
                const allDetails = document.querySelectorAll('.list-card-details');
                const allIcons = document.querySelectorAll('.toggle-icon');
                
                allDetails.forEach(d => d.style.display = allExpanded ? 'block' : 'none');
                allIcons.forEach(i => i.style.transform = allExpanded ? 'rotate(180deg)' : 'rotate(0deg)');
                
                toggleAllBtn.textContent = allExpanded ? 'Collapse All' : 'Expand All';
            });

        } else {
            listContainer.innerHTML = '<p>No questions found in questions.json.</p>';
        }
    } catch (error) {
        console.error('Error loading list:', error);
        listContainer.innerHTML = `<p style="color:red;">Error loading questions.json. Make sure you are using a local server.</p>`;
    }
});