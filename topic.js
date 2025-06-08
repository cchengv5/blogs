

class TopicList {
    constructor() {
        this.topics = new Map(); // 改为Map结构
        this.activeTopic = null;
    }

    add(header, content = '', isActive = false) {
        const topic = new Topic(header, content, isActive);
        this.topics.set(topic.id, topic); // 使用id作为key
        if (isActive) {
            this.setActive(topic);
        }
        this.save();
        return topic;
    }

    remove(topic) {
        this.topics.delete(topic.id); // 通过id删除
        if (this.activeTopic === topic) {
            this.activeTopic = this.topics.values().next().value || null;
        }
        this.save()
    }

    setActive(topic) {
        if (this.activeTopic) {
            this.activeTopic.isActive = false;
        }
        this.activeTopic = topic;
        if (topic) {
            topic.isActive = true;
        }
        this.save()
    }

    save() {
        const data = Array.from(this.topics.values()).map(topic => topic.toJSON());
        localStorage.setItem('allTopics', JSON.stringify(data));
        console.log("主题保存成功" + JSON.stringify(data))
    }

    load() {
        const savedTopics = localStorage.getItem('allTopics');
        if (!savedTopics) return null;
        
        const parsedTopics = JSON.parse(savedTopics);
        parsedTopics.forEach(topicData => {
            const topic = new Topic(topicData.header, topicData.content, topicData.isActive);
            topic.id = topicData.id; // 保持原有ID
            this.topics.set(topic.id, topic);
        });
        return parsedTopics;
    }

    clear() {
        this.topics = new Map(); // 改为Map结构
        this.activeTopic = null;
        this.save();
    }
}

class Topic {
    constructor(header, content = '', isActive = false) {
        this.id = crypto.randomUUID(); // 使用浏览器内置的UUID生成器
        this._header = header;
        this._content = content;
        this.isActive = isActive;
        this.element = null;

        return new Proxy(this, {
            set(target, prop, value) {
                const domProps = ['_header', '_content'];
                if (domProps.includes(prop) && target.element) {
                    const textarea = target.element.querySelector('.text-area');
                    if (textarea) {
                        if (prop === '_header') {
                            const headerSpan = target.element.querySelector('.text-area-header span');
                            if (headerSpan) headerSpan.textContent = value;
                        } else {
                            textarea.value = value;
                        }
                    }
                }
                target[prop] = value;
                return true;
            }
        });
    }

    getHeader() {
        return this._header;
    }

    getContent() {
        return this._content;
    }

    update(newContent) {
        this._content = newContent;
        this._header = newContent.split('\n')[0].replace('#', '').trim();
    }

    toJSON() {
        return {
            id: this.id,
            header: this._header,
            content: this._content,
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

    updateTopicHeader(topic) {
        if (topic.element) {
            const textarea = topic.element.querySelector('.text-area');
            if (textarea) {
                const headerSpan = topic.element.querySelector('.text-area-header span');
                if (headerSpan) {
                    headerSpan.textContent = topic.getHeader();
                }
            }
        }
    }

    createTopicElement(topic) {
        const item = document.createElement('div');
        topic.element = item
        item.className = 'text-area-item';
        item.dataset.topicId = topic.id;
        item.innerHTML = `
            <div class="text-area-header">
                <span>${topic.getHeader()}</span>
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
            <textarea class="text-area" placeholder="#新主题" style="display:none">${topic.getContent()}</textarea>
        `;

        // 添加标题点击事件
        const headerElement = item.querySelector('.text-area-header');
        const textarea = item.querySelector('.text-area');
        headerElement.addEventListener('click', () => {
            this.handleTextAreaHeaderClick(textarea);
        });

        // 添加内容变化监听
        textarea.addEventListener('input', () => {
            topic.update(textarea.value); // 自动触发Proxy更新
            updateGraph(topic.getContent());
            this.topicList.save()
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
        const topicId = item.dataset.topicId; // 添加data属性存储id

        if (topicId) {
            const topic = this.topicList.topics.get(topicId);
            if (topic) {
                this.topicList.remove(topic);
            }
        }
        if (textarea === this.activeTextArea) {
            const firstTextArea = document.querySelector('.text-area');
            this.setActiveTextArea(firstTextArea);
        }
        item.remove();

        if (document.querySelectorAll('.text-area-item').length === 0) {
            this.toggleEmptyPrompt(true);
        }
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
        const defaultHeader = '新主题';
        const defaultContent = '#新主题'
        const topic = this.topicList.add(defaultHeader, defaultContent, true);
        const element = this.createTopicElement(topic);
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
        console.log("加载的主题：", savedTopics || "无主题")
        if (savedTopics) {
            savedTopics.forEach(topicData => {
                const topic = new Topic(topicData.header, topicData.content, topicData.isActive);
                topic.id = topicData.id;
                const element = this.createTopicElement(topic);
                this.appendToContainer(element);
                if (topicData.isActive) {
                    const textarea = element.querySelector('.text-area');
                    this.setActiveTextArea(textarea);
                }
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
