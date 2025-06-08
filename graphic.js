// 在脚本开始部分添加边样式配置对象
 const edgeStyles = {
    default: {
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 1.5,
                type: 'arrow' // 明确指定箭头类型
            }
        },
        font: {
            align: 'middle'
        },
        smooth: {
            type: 'continuous'
        }
    },
    superInEdge: {
        arrows: {
            to: {
                enabled: false,
                scaleFactor: 1.5
            }
        }
    },
    superOutEdge: {
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 1.5
            }
        }
    },
    superOutEdgeReverse: {
        arrows: {
            to: {
                enabled: false,
                scaleFactor: 1.5
            }
        }
    }
};

// 添加节点，包括超级边节点
// 修改nodeStyles配置
const nodeStyles = {
    default: {
        shape: 'box',
        color: {
            background: 'white',
            border: '#2B7CE9'
        },
        margin: 10,
        font: {
            size: 14
        },
        // 删除下面重复的color定义
        // color: {
        //    background: 'white',
        //    border: '#2B7CE9'
        // },
        shadow: {
            enabled: true,
        },
        widthConstraint: {
            maximum: 200  // 设置最大宽度
        },
        heightConstraint: {
            minimum: 30,  // 最小高度
            valign: 'middle'  // 垂直居中
        }
    },
    superEdge: {
        font: {
            italic: true
        },
        borderWidth: 0,
        color: {
            background: '#FFE4E1',
        },
        shadow: {
            enabled: true,
        }
    }
};

// 节点
class MyNode {
    relationIn = new Map(); // 入边
    relationOut = new Map(); // 出边

    constructor(id, label) {
        this.id = id;
        this.label = label;
    }

    addInputReason(myEdge) {
        if (this.relationIn.has(myEdge.reason)) {
            this.relationIn.get(myEdge.reason).add(myEdge);
            return;
        }
        this.relationIn.set(myEdge.reason, new Set([myEdge]));
    }

    addOutputEdges(myEdge) {
        if (this.relationOut.has(myEdge.reason)) {
            this.relationOut.get(myEdge.reason).add(myEdge);
            return;
        }
        this.relationOut.set(myEdge.reason, new Set([myEdge]));
    }

    isSuperOutEdge(myEdge) {
        let xx = this.relationOut.get(myEdge.reason);
        if (xx && xx.size > 1) {
            return true;
        }
        return false;
    }

    isSuperInEdge(myEdge) {
        let xx = this.relationIn.get(myEdge.reason);
        if (xx && xx.size > 1) {
            return true;
        }
        return false;
    }
}

// 边
class MyEdge {
    constructor(from, to, reason, isArrow = false) {
        this.from = from;
        this.to = to;
        this.reason = reason;
        this.isArrow = isArrow; // 是否有箭头
        this.id = `${from}-${reason}-${to}`;
    }

    getSuperInEdgeNodeName() {
        return this.reason + "_" + this.to;
    }

    getSuperOutEdgeNodeName() {
        return this.from + "_" + this.reason;
    }

    getSuperInEdgeNode() {
        return new MyNode(this.getSuperInEdgeNodeName(), this.reason);
    }

    getSuperOutEdgeNode() {
        return new MyNode(this.getSuperOutEdgeNodeName(), this.reason);
    }

    getToSuperInEdges() {
        return [new MyEdge(this.from, this.getSuperInEdgeNodeName(), this.reason, this.isArrow),
        new MyEdge(this.getSuperInEdgeNodeName(), this.to, this.reason, this.isArrow)
        ]
    }

    getSuperOutEdges() {
        return [new MyEdge(this.getSuperOutEdgeNodeName(), this.to, this.reason, this.isArrow),
        new MyEdge(this.from, this.getSuperOutEdgeNodeName(), this.reason, this.isArrow)]
    }

    isSuperInEdge() {
        if (myNodes.get(this.to)?.isSuperInEdge(this) && this.reason != '') {
            return true;
        }
        return false
    }

    isSuperOutEdge() {
        if (myNodes.get(this.from)?.isSuperOutEdge(this) && this.reason != '') {
            return true;
        }
    }
}


// 保留其他全局变量和初始化代码
var myNodes = new Map();
var myEdges = new Map();
let visNetwork;

// 添加节点
function addNode(id, label) {
    if (!myNodes.has(id)) {
        myNodes.set(id, new MyNode(id, label));
    }
    return myNodes.get(id);
}

// 添加边
function addEdge(from, to, reason, isArrow = false) {
    const edgeId = `${from}-${reason}-${to}`;
    if (!myEdges.has(edgeId)) {
        const edge = new MyEdge(from, to, reason, isArrow);
        myEdges.set(edgeId, edge);
    }
    myNodes.get(from).addOutputEdges(myEdges.get(edgeId));
    myNodes.get(to).addInputReason(myEdges.get(edgeId))
    return myEdges.get(edgeId);
}

function parseRelation(line) {
    line = line.trim();
    if (!line) return null;

    // 解析关系格式：fromNode(-{1,100})(>?)toNode
    const regexWithNames = /^(?<fromNode>.+?)(-+)(?:(?<reason>.+?)(-+))?(?<isArrow>>?)(?<toNode>.*)$/;
    const matchResultWithNames = line.match(regexWithNames);

    var retData = null
    if (!matchResultWithNames) {
        // 孤立节点
        retData = {
            from: line,
            to: '',
            isArrow: false
        };
    } else {
        if (matchResultWithNames && matchResultWithNames.groups) {
            retData = {
                from: matchResultWithNames.groups.fromNode.trim(),
                to: matchResultWithNames.groups.toNode?.trim() || '',
                reason: matchResultWithNames.groups.reason?.trim() || '',
                isArrow: matchResultWithNames.groups.isArrow === '>' ? true : false
            };
        }
    }

    console.log("parseRelation retData=", retData)
    return retData; // 返回解析后的关系对象，或者 null 表示解析失败或不匹配的 forma
}

function updateGraph(text) {
    // 过滤掉以#开头的行
    const lines = text.split('\n').filter(line => !line.startsWith('#'));
    myNodes.clear(); // 清空节点
    myEdges.clear(); // 清空边

    // 节点
    const nodeMap = new Map();
    // 边
    const edgeGroups = new Map();

    // 解析每行关系
    lines.forEach(line => {
        const relation = parseRelation(line);
        if (!relation) return;

        // 初始化节点和边
        addNode(relation.from, relation.from); // 添加from节点
        if (relation.to) {
            // to可能是多个节点，用逗号分隔
            relation.to.split(',').forEach(subToNode => {
                addNode(subToNode.trim(), subToNode.trim()); // 添加to节点
                addEdge(relation.from, subToNode.trim(), relation.reason || '', relation.isArrow); // 添加边
            });
        }
    });


    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    // 修改节点添加逻辑
    myNodes.forEach(myNode => {
        if (nodes.get(myNode.id) == null) {
            nodes.add({
                id: myNode.id,
                label: myNode.label,
                ...nodeStyles.default
            });
        }
    });

    // 添加边
    myEdges.forEach(myEdge => {
        if (myEdge.isSuperInEdge()) {
            let xxxnode = myEdge.getSuperInEdgeNode();
            let [edge0, edge1] = myEdge.getToSuperInEdges();
            if (nodes.get(xxxnode.id) == undefined) {
                nodes.add({ id: xxxnode.id, label: xxxnode.label, ...nodeStyles.superEdge });
            }
            if (!edges.get(edge0.id)) {
                edges.add({
                    id: edge0.id,
                    from: edge0.from,
                    to: edge0.to,
                    ...edgeStyles.superInEdge
                });
            }
            if (!edges.get(edge1.id)) {
                edges.add({
                    id: edge1.id,
                    from: edge1.from,
                    to: edge1.to,
                    ...edgeStyles.default
                });
            }
            return;
        }

        if (myEdge.isSuperOutEdge()) {
            let xxxnode = myEdge.getSuperOutEdgeNode();
            let [edge0, edge1] = myEdge.getSuperOutEdges();
            if (nodes.get(xxxnode.id) == undefined) {
                nodes.add({
                    id: xxxnode.id,
                    label: xxxnode.label,
                    font: { italic: true },
                    ...nodeStyles.superEdge
                });
            }
            if (!edges.get(edge0.id)) {
                edges.add({
                    id: edge0.id,
                    from: edge0.from,
                    to: edge0.to,
                    ...edgeStyles.superOutEdge
                });
            }
            if (!edges.get(edge1.id)) {
                edges.add({
                    id: edge1.id,
                    from: edge1.from,
                    to: edge1.to,
                    ...edgeStyles.superOutEdgeReverse
                });
            }
            return;
        }

        edges.add({
            id: myEdge.id,
            from: myEdge.from,
            to: myEdge.to,
            label: myEdge.reason,
            ...edgeStyles.default
        });
    });

    // 创建网络
    const container = document.getElementById('network');
    const data = { nodes, edges };
    const options = {
        nodes: {
            shape: 'box',
            margin: 10,
            font: { size: 14 },
            color: { background: 'white', border: '#2B7CE9' },
            physics: true, // 禁用节点的物理模拟
            fixed: false // 固定节点位置
        },
        edges: {
            smooth: {
                enabled: true,
                type: 'continuous',
                roundness: 0.5
            },
            length: 200 // 增加边的默认长度
        },
        physics: {
            enabled: true,
            solver: 'repulsion',
            repulsion: {
                nodeDistance: 300, // 增加节点间的最小距离
                centralGravity: 0.1,
                springLength: 300,
                springConstant: 0.01,
                damping: 0.09,
            },
            stabilization: {
                enabled: true,
                iterations: 1000,
                updateInterval: 25
            },
        },
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'LR', // 从上到下的层次布局
                sortMethod: 'directed', // 有向排序
                levelSeparation: 200, // 增加层次之间的距离
                nodeSpacing: 150 // 增加节点之间的距离
            },
            randomSeed: 42
        }
    };
    visNetwork = new vis.Network(container, data, options);

    // 保存节点位置
    visNetwork.on('stabilizationIterationsDone', function () {
        const positions = visNetwork.getPositions();
        localStorage.setItem('nodePositions', JSON.stringify(positions));
    });

    // 恢复节点位置
    const savedPositions = localStorage.getItem('nodePositions');
    if (savedPositions) {
        const positions = JSON.parse(savedPositions);
        nodes.forEach(node => {
            if (positions[node.id]) {
                node.x = positions[node.id].x;
                node.y = positions[node.id].y;
                node.fixed = false; // 固定位置
            }
        });
        visNetwork.setData({ nodes, edges });
    }
}

function exportToSVG() {
    if (!visNetwork) return;
    
    // 获取网络容器
    const container = document.getElementById('network');
    
    // 创建SVG元素
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", container.offsetWidth);
    svg.setAttribute("height", container.offsetHeight);
    svg.setAttribute("viewBox", `0 0 ${container.offsetWidth} ${container.offsetHeight}`);
    
    // 将canvas内容转换为SVG
    const canvas = container.querySelector('canvas');
    if (canvas) {
        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        img.setAttribute("width", container.offsetWidth);
        img.setAttribute("height", container.offsetHeight);
        img.setAttribute("href", canvas.toDataURL("image/png"));
        svg.appendChild(img);
    }
    
    // 创建下载链接
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], {type: "image/svg+xml"});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "concept-map.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 将函数添加到全局作用域
window.exportToSVG = exportToSVG;