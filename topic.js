

class TopicList {
    constructor() {
        this.topics = [];
        this.activeTopic = null;
    }

    add(header, content = '', isActive = false) {
        const topic = new Topic(header, content, isActive);
        this.topics.push(topic);
        if (isActive) {
            this.setActive(topic);
        }
        return topic;
    }

    remove(topic) {
        const index = this.topics.indexOf(topic);
        if (index !== -1) {
            this.topics.splice(index, 1);
            if (this.activeTopic === topic) {
                this.activeTopic = this.topics[0] || null;
            }
        }
    }

    setActive(topic) {
        if (this.activeTopic) {
            this.activeTopic.isActive = false;
        }
        this.activeTopic = topic;
        if (topic) {
            topic.isActive = true;
        }
    }

    save() {
        const data = this.topics.map(topic => topic.toJSON());
        localStorage.setItem('allTopics', JSON.stringify(data));
    }

    load() {
        const savedTopics = localStorage.getItem('allTopics');
        return savedTopics ? JSON.parse(savedTopics) : null;
    }

    clear() {
        this.topics = [];
        this.activeTopic = null;
    }
}

class Topic {
    constructor(header, content = '', isActive = false) {
        this.header = header;
        this.content = content;
        this.isActive = isActive;
    }

    updateContent(newContent) {
        this.content = newContent;
    }

    toggleActive() {
        this.isActive = !this.isActive;
    }

    toJSON() {
        return {
            header: this.header,
            content: this.content,
            isActive: this.isActive
        };
    }
}

class TopicPresenter {
    constructor() {
        this.topicList = new TopicList();
    }

    init() {
        this.textAreaContainer = document.getElementById('textAreaContainer');
        this.emptyPrompt = document.getElementById('emptyTextAreaPrompt');
        this.activeTextArea = document.querySelector('.text-area.active');
        this.loadTopics(); // 加载已有主题
    }

    toggleEmptyPrompt(show) {
        if (this.emptyPrompt) {
            this.emptyPrompt.style.display = show ? 'block' : 'none';
        }
    }

    createTopicElement(header, content) {
        const item = document.createElement('div');
        item.className = 'text-area-item';
        item.innerHTML = `
            <div class="text-area-header">
                <span>${header}</span>
                <div class="header-actions">
                    <button class="export-btn" onclick="exportToSVG()">
                        <i class="material-icons">download</i>
                    </button>
                    <button class="refresh-btn" onclick="topicPresenter.refreshCurrentTextArea(this)">
                        <i class="material-icons">refresh</i>
                    </button>
                    <button class="delete-btn" onclick="topicPresenter.removeTextArea(this)">×</button>
                </div>
            </div>
            <textarea class="text-area" placeholder="#新主题" style="display:none">${content}</textarea>
        `;

        // 添加标题点击事件
        const headerElement = item.querySelector('.text-area-header');
        const textarea = item.querySelector('.text-area');
        headerElement.addEventListener('click', () => {
            this.handleTextAreaHeaderClick(textarea);
        });

        // 添加内容变化监听
        textarea.addEventListener('input', () => {
            updateGraph(textarea.value);
        });

        return item;
    }

    handleTextAreaHeaderClick(textarea) {
        if (textarea.style.display === 'none') {
            this.setActiveTextArea(textarea);
        } else {
            this.setTextAreaInactive(textarea);
        }
    }

    appendToContainer(element) {
        this.textAreaContainer.appendChild(element);
    }

    removeFromContainer(element) {
        element.remove();
    }

    setTextAreaActive(textarea) {
        textarea.style.display = 'block';
        textarea.classList.add('active');
        textarea.style.height = 'calc(100vh - 200px)';
        textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    setTextAreaInactive(textarea) {
        textarea.style.display = 'none';
        textarea.classList.remove('active');
        textarea.style.height = '200px';
    }

    removeTextArea(btn) {
        const item = btn.closest('.text-area-item');
        const textarea = item.querySelector('.text-area');
        
        // 找到对应的Topic对象并移除
        const header = item.querySelector('.text-area-header span').textContent;
        const topicToRemove = this.topicList.topics.find(t => t.header === header);
        if (topicToRemove) {
            this.topicList.remove(topicToRemove);
        }
    
        if (textarea === this.activeTextArea) {
            const firstTextArea = document.querySelector('.text-area');
            this.setActiveTextArea(firstTextArea);
        }
        item.remove();
    
        if (document.querySelectorAll('.text-area-item').length === 0) {
            this.toggleEmptyPrompt(true);
        }
        this.topicList.save();
    }

    setActiveTextArea(textarea) {
        // 移除所有active状态
        document.querySelectorAll('.text-area').forEach(ta => {
            ta.classList.remove('active');
            ta.style.height = '200px';
            ta.style.display = 'none';
        });

        // 设置新的active状态
        textarea.style.display = 'block';
        textarea.classList.add('active');
        textarea.style.height = 'calc(100vh - 200px)';
        this.activeTextArea = textarea;
        textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        updateGraph(textarea.value);
    }


    addNewTopic() {
        const header = '新主题';
        const topic = this.topicList.add(header, '', true);
        const element = this.createTopicElement(topic.header, topic.content);
        this.appendToContainer(element);

        // 设置新创建的textarea为active
        const textarea = element.querySelector('.text-area');
        this.setActiveTextArea(textarea);

        // 隐藏空提示
        this.toggleEmptyPrompt(false);

        return topic;
    }

    loadTopics() {
        const savedTopics = this.topicList.load();
        if (savedTopics) {
            savedTopics.forEach(topicData => {
                const topic = this.topicList.add(topicData.header, topicData.content, topicData.isActive);
                const element = this.createTopicElement(topic.header, topic.content);
                this.appendToContainer(element);
            });
            this.toggleEmptyPrompt(false);
        }
    }

    refreshCurrentTextArea(btn) {
        const item = btn.closest('.text-area-item');
        const textarea = item.querySelector('.text-area');
        if (textarea) {
            // 更新概念地图
            updateGraph(textarea.value);
            // 重新激活当前文本框
            this.setActiveTextArea(textarea);
        }
    }
}

// 修改全局变量
const topicPresenter = new TopicPresenter();
