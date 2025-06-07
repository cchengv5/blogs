let activeTextArea = document.querySelector('.text-area.active');

function toggleEmptyPrompt(show) {
    const prompt = document.getElementById('emptyTextAreaPrompt');
    if (prompt) {
        prompt.style.display = show ? 'block' : 'none';
    }
}

function saveAllTopics() {
    const topics = [];
    document.querySelectorAll('.text-area-item').forEach((item, index) => {
        const textarea = item.querySelector('.text-area');
        const header = item.querySelector('.text-area-header span').textContent;
        topics.push({
            id: index,
            header: header,
            content: textarea.value,
            isActive: textarea.classList.contains('active')
        });
    });
    localStorage.setItem('allTopics', JSON.stringify(topics));
}

function createTextAreaItem(header, content = '', isActive = false) {
    if (content.startsWith('#')) {
        const firstLine = content.split('\n')[0];
        header = firstLine.substring(1).trim();
        content = content.substring(firstLine.length).trim();
    }

    const newItem = document.createElement('div');
    newItem.className = 'text-area-item';
    newItem.innerHTML = `
        <div class="text-area-header">
            <span>${header}</span>
            <div class="header-actions">
                <button class="export-btn" onclick="exportToSVG()">
                    <i class="material-icons">download</i>
                </button>
                <button class="refresh-btn" onclick="refreshCurrentTextArea(this)">
                    <i class="material-icons">refresh</i>
                </button>
                <button class="delete-btn" onclick="removeTextArea(this)">×</button>
            </div>
        </div>
        <textarea class="text-area" placeholder="输入关系，每行一个" style="display:none">${content}</textarea>
    `;
    // 修改点击事件处理
    newItem.querySelector('.text-area-header').addEventListener('click', function() {
        const textarea = this.nextElementSibling;

        if(textarea.style.display === 'none') {
            textarea.style.display = 'block';
            setActiveTextArea(textarea);
        } else {
            textarea.style.display = 'none';
        }
    });

    const textarea = newItem.querySelector('.text-area');
    textarea.addEventListener('input', function () {
        if (this === activeTextArea) {
            updateGraph(this.value);
        }
    });
    if (isActive) {
        setActiveTextArea(textarea);
    }

    return newItem;
}

function loadAllTopics() {
    const savedTopics = localStorage.getItem('allTopics');
    if (!savedTopics) {
        toggleEmptyPrompt(true);
        return;
    }

    const topics = JSON.parse(savedTopics);
    document.querySelectorAll('.text-area-item').forEach(item => item.remove());

    topics.forEach(topic => {
        const newItem = createTextAreaItem(topic.header, topic.content || '', topic.isActive);
        document.getElementById('textAreaContainer').appendChild(newItem);
        toggleEmptyPrompt(false)
    });

    if (topics.length === 0) {
        toggleEmptyPrompt(true)
    }
}

function addTextArea() {
    toggleEmptyPrompt(false);
    const count = document.querySelectorAll('.text-area-item').length + 1;
    const newItem = createTextAreaItem(`主题${count}`);
    document.getElementById('textAreaContainer').appendChild(newItem);
    saveAllTopics();
}

function removeTextArea(btn) {
    const item = btn.closest('.text-area-item');
    if (item.querySelector('.text-area') === activeTextArea) {
        const firstTextArea = document.querySelector('.text-area');
        setActiveTextArea(firstTextArea);
    }
    item.remove();

    if (document.querySelectorAll('.text-area-item').length === 0) {
        toggleEmptyPrompt(true);
    }
    saveAllTopics();
}

function setActiveTextArea(textarea) {
    // 移除所有active状态
    document.querySelectorAll('.text-area').forEach(ta => {
        ta.classList.remove('active');
        ta.style.height = '200px';
        ta.style.display = 'none'; // 默认收起
    });

    // 设置新的active状态
    textarea.style.display = 'block';
    textarea.classList.add('active');
    textarea.style.height = 'calc(100vh - 200px)';
    activeTextArea = textarea;
    textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    updateGraph(activeTextArea.value);
}