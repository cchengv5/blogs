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
    constructor(id, label, style = nodeStyles.default) {
        this.id = id;
        this.label = label;
        this.style = style
    }
}

// 边
class MyEdge {
    constructor(fromNode, toNode, label = '', style = edgeStyles.default) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.label = label;
        this.style = style; // 存储边的样式
        this.id = "edge_" + fromNode + "_" + toNode
    }
}

const MyEdgeLineType = {
    SOLID: 'solid',
    DASHED: 'dashed'
}

class RelationBase {
    constructor(left, right, lineType = MyEdgeLineType.SOLID) {
        this.left = left || ''
        this.right = right || ''
        this.lineType = lineType || MyEdgeLineType.SOLID
        this.count = 1
    }

    getId() {
        return this.left + "_" + this.right + "_" + this.constructor.name
    }

    incCount() {
        this.count++
    }

    getCount() {
        return this.count
    }
}

class From2ToRelation extends RelationBase {
    constructor(left, right, lineType = MyEdgeLineType.SOLID) {
        super(left, right, lineType)
    }

    getId() {
        return this.left + "_" + this.right + "_" + this.constructor.name
    }
}

class From2ReasonRelation extends RelationBase {
    constructor(left, right, lineType = MyEdgeLineType.SOLID, line = '') {
        super(left, right, lineType)
        this.line = line || ''
    }

    getId() {
        return this.left + "_" + this.right + "_" + this.constructor.name
    }
}

class Reason2ToRelation extends RelationBase {
    constructor(left, right, lineType = MyEdgeLineType.SOLID, line = '') {
        super(left, right, lineType)
        this.line = line || ''
    }

    getId() {
        return this.left + "_" + this.right + "_" + this.constructor.name
    }
}

class NormalNode {
    constructor(name, relationLeft = '', relationRight = '') {
        this.name = name || ''
        this.relationLeft = relationLeft || ''
        this.relationRight = relationRight || ''
    }

    getId() {
        return this.name
    }

    getNodeStyle() {
        return nodeStyles.default
    }

    getFixedNodeId() {
        return this.name
    }

    getLabel() {
        return this.name
    }
}

class ReaonNode extends NormalNode {
    constructor(name, relationLeft, relationRight) {
        super(name, relationLeft, relationRight)
    }

    getId() {
        return this.name + "_" + this.relationLeft + "_" + this.relationRight + "_" + this.constructor.name
    }

    getNodeStyle() {
        return nodeStyles.superEdge
    }

    getFixedNodeId() {
        let relationLeftrr = RelatioManager.K_RELATIONS_COUNT.get(this.relationLeft)
        if (relationLeftrr && relationLeftrr.getCount() > 1) {
            // console.log("relationLeftrr: " + JSON.stringify(relationLeftrr))
            return relationLeftrr.getId()
        }
        let relationRightrr = RelatioManager.K_RELATIONS_COUNT.get(this.relationRight)
        if (relationRightrr && relationRightrr.getCount() > 1) {
            return relationRightrr.getId()
        }
        return this.name
    }
}

class RelatioManager {
    static K_SPLITTER_IN_NODES = '||'
    static K_SPLITTER_BETWEEN_NODES = '-'
    static K_REASON_SUFFIX_AND_PREFIX = '_'

    static K_RELATIONS_COUNT = new Map()
    static K_NODES = new Map()

    static clear() {
        RelatioManager.K_RELATIONS_COUNT.clear()
        RelatioManager.K_NODES.clear()
    }

    static extractNodeNames(str) {
        return str.split(this.K_SPLITTER_IN_NODES).map(node => node.trim());
    }

    static addRelation(relation) {
        const key = relation.getId();
        if (RelatioManager.K_RELATIONS_COUNT.has(key)) {
            RelatioManager.K_RELATIONS_COUNT.get(key).incCount();
        } else {
            RelatioManager.K_RELATIONS_COUNT.set(key, relation);
        }
    }

    static addNode(node) {
        const key = node.getId();
        // console.log("add node: " + key)
        if (!RelatioManager.K_NODES.has(key)) {
            RelatioManager.K_NODES.set(key, node);
            // console.log([...RelatioManager.K_NODES])
            // console.log("add node~~: " + JSON.stringify(RelatioManager.K_NODES))
        }
    }

    static parseRelation(line) {
        if (line.trim() === '') {
            return;
        }

        var fromNodess = []
        var reasonNodes = []
        var toNodes = []

        let parts = line.split('-').map(part => part.trim()).filter(item => item.trim() !== '');
        if (parts.length >= 1) {
            fromNodess = this.extractNodeNames(parts[0])
        }
        if (parts.length == 2) {
            toNodes = this.extractNodeNames(parts[1])
        } else if (parts.length == 3) {
            reasonNodes = this.extractNodeNames(parts[1])
            toNodes = this.extractNodeNames(parts[2])
        }

        // console.log("fromNodess: " + JSON.stringify(fromNodess))
        // console.log("reasonNodes: " + JSON.stringify(reasonNodes))
        // console.log("toNodes: " + JSON.stringify(toNodes))
        // console.log("parts: " + JSON.stringify(parts))

        fromNodess.forEach(fromNode => {
            this.addNode(new NormalNode(fromNode))
            // console.log("add node~~!!!: " + JSON.stringify(RelatioManager.K_NODES))

            toNodes.forEach(toNode => {
                this.addNode(new NormalNode(toNode))
                // console.log("add node~~!!!: " + JSON.stringify(RelatioManager.K_NODES))

                if (reasonNodes.length == 0) {
                    var from2toRelation = new From2ToRelation(fromNode, toNode, MyEdgeLineType.SOLID)
                    this.addRelation(from2toRelation)
                    return
                }

                reasonNodes.forEach(reasonNode => {
                    var from2ReasonRelation = new From2ReasonRelation(fromNode, reasonNode, MyEdgeLineType.SOLID, line)
                    var reason2toRelation = new Reason2ToRelation(reasonNode, toNode, MyEdgeLineType.SOLID, line)
                    this.addRelation(from2ReasonRelation)
                    this.addRelation(reason2toRelation)

                    this.addNode(new ReaonNode(reasonNode, from2ReasonRelation.getId(), reason2toRelation.getId()))
                })
            })
        })

        // console.log("add node~~!!!: " + JSON.stringify(RelatioManager.K_NODES))
    }
}

class GraphManager {
    constructor() {
        this.visNetwork = null;
        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();
    }

    addNode(myNode) {
        console.log("add node: " + JSON.stringify(myNode))

        if (this.nodes.get(myNode.getFixedNodeId()) == null) {
            this.nodes.add({
                id: myNode.getFixedNodeId(),
                label: myNode.getLabel(), ...myNode.getNodeStyle()
            });
        }
    }

    addEdge(myEdge) {
        if (this.edges.get(myEdge?.id) == null) {
            console.log("add edge: " + JSON.stringify(myEdge))
            this.edges.add({
                id: myEdge.id,
                from: myEdge.fromNode,
                to: myEdge.toNode, ...myEdge.style
            });
        }
    }

    updateGraph(text) {
        this.nodes.clear()
        this.edges.clear()
        RelatioManager.clear()

        // 过滤掉以#开头的行
        const lines = text.split('\n').filter(line => !line.startsWith('#'));
        // 解析每行关系
        lines.forEach(line => {
            RelatioManager.parseRelation(line);
        })

        // console.log("relations count: " + JSON.stringify(RelatioManager.K_RELATIONS_COUNT))
        console.log([...RelatioManager.K_RELATIONS_COUNT])

        // 添加节点
        RelatioManager.K_NODES.forEach((node, id) => {
            this.addNode(node);
        })

        RelatioManager.K_NODES.forEach((node, id) => {
            if (node instanceof ReaonNode) {
                let relationLeft = RelatioManager.K_RELATIONS_COUNT.get(node.relationLeft)
                let relationRight = RelatioManager.K_RELATIONS_COUNT.get(node.relationRight)

                console.log("relationLeft: " + JSON.stringify(relationLeft) + "~~" + relationLeft?.left)
                console.log("relationRight: " + JSON.stringify(relationRight))
                if (relationLeft && relationLeft?.left) {
                    this.addEdge(new MyEdge(
                        relationLeft?.left || '',
                        node.getFixedNodeId(),
                        '',
                        edgeStyles.superInEdge
                    ));
                }

                if (relationRight && relationRight?.right) {
                    this.addEdge(new MyEdge(
                        node.getFixedNodeId(),
                        relationRight?.right || '',
                        '',
                        edgeStyles.superOutEdge
                    ));
                }
            }
        })

        RelatioManager.K_RELATIONS_COUNT.forEach((relation, relatioName) => {
            if (relation instanceof From2ToRelation) {
                this.addEdge(new MyEdge(
                    relation.left,
                    relation.right,
                    '',
                    edgeStyles.default
                ));
            }
        })

        // 创建网络
        const container = document.getElementById('network');
        const data = { nodes: this.nodes, edges: this.edges };

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
        this.visNetwork = new vis.Network(container, data, options);

        // 保存节点位置
        this.visNetwork.on('stabilizationIterationsDone', () => {
            const positions = this.visNetwork.getPositions();
            localStorage.setItem('nodePositions', JSON.stringify(positions));
        });

        // 恢复节点位置
        const savedPositions = localStorage.getItem('nodePositions');
        if (savedPositions) {
            const positions = JSON.parse(savedPositions);
            this.nodes.forEach(node => {
                if (positions[node.id]) {
                    node.x = positions[node.id].x;
                    node.y = positions[node.id].y;
                    node.fixed = false; // 固定位置
                }
            });
            this.visNetwork.setData({ nodes: this.nodes, edges: this.edges });
        }
    }

    exportToSVG() {
        if (!this.visNetwork) return;

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
        const blob = new Blob([svgStr], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "concept-map.svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

const graphManager = new GraphManager();

// 将函数添加到全局作用域
window.graphManager = graphManager;
window.updateGraph = graphManager.updateGraph.bind(graphManager);
window.exportToSVG = graphManager.exportToSVG.bind(graphManager);