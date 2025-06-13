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
        this.id = "edge_" + fromNode.id + "_" + toNode.id
    }
}

const MyEdgeLineType = {
    SOLID: 'solid',
    DASHED: 'dashed'
}

class ConceptNodeBase {
    getId() {
        return ''
    }

    getNodes() {
        return []
    }

    getEdges() {
        return []
    }
}

class SingleNode extends ConceptNodeBase {
    constructor(name) {
        this.name = name || ''
    }

    getId() {
        return this.name
    }

    getNodes() {
        return [new MyNode({ id: this.getId(), label: this.name, style: nodeStyles.default })]
    }

    getEdges() {
        return []
    }
}

class SuperOutNode extends ConceptNodeBase {
    constructor(left, right, lineType = MyEdgeLineType.SOLID, line = '') {
        this.left = left || ''
        this.right = right || ''
        this.lineType = lineType || MyEdgeLineType.SOLID
        this.line = line || ''
    }

    getId() {
        return this.left + "_" + this.right + "_" + this.constructor.name
    }

    getNodes() {
        return [new MyNode( { id: this.left, label: this.left, style: nodeStyles.default }), new MyNode( { id: this.right, label: this.right, style: nodeStyles.superEdge })]
    }

    getEdges() {
        return [new MyEdge({ from: this.left, to: this.right, style: edgeStyles.superOutEdge})]
    }
}

class SuperInNode extends ConceptNodeBase {
    constructor(left, right, lineType = MyEdgeLineType.SOLID, line = '') {
        this.left = left || ''
        this.right = right || ''
        this.lineType = lineType || MyEdgeLineType.SOLID
        this.line = line || ''
    }

    getId() {
        return this.left + "_" + this.right + "_" + this.constructor.name
    }

    getNodes() {
        return [new MyNode( { id: this.left, label: this.left, style: nodeStyles.superEdge }), new MyNode( { id: this.right, label: this.right, style: nodeStyles.default })]
    }

    getEdges() {
        return [new MyEdge({ from: this.left, to: this.right, style: edgeStyles.superInEdge})]
    }
}

class RelatioManager {
    static K_FROM_TO_RELATIONS = []
    static K_ONE_ONDE = []
    static K_SUPER_OUT_RELATIONS = new Map()
    static K_SUPER_IN_RELATIONS = new Map()

    static clear() {
        this.K_FROM_TO_RELATIONS = []
        this.K_ONE_ONDE = []
        this.K_SUPER_IN_RELATIONS.clear()
        this.K_SUPER_OUT_RELATIONS.clear()
    }

    static parseRelation(line) {
        if (line.trim() === '') {
            return;
        }

        var from = '';
        var to = '';
        var reason = '';;

        var from2ReasonLine = '-'
        var reason2toLine = '-'
        var from2toLine = '-'
        var tos = []; // 用于存储多个to节点

        const regexWithNames = /^(?<fromNode>.+?)(?<from2ReasonLine>-+)(?:(?<reason>.+?)(?<reason2toLine>-+))?(?<isArrow>>?)(?<toNode>.*)$/;
        const matchResultWithNames = line.match(regexWithNames);

        if (!matchResultWithNames) {
            console.log("add one onde: " + line.trim() + " to K_ONE_ONDE")
            this.K_ONE_ONDE.push(new NoRelation(from = line.trim()))
            return;
        }

        if (matchResultWithNames && matchResultWithNames.groups) {
            console.log("from2ReasonLine ", matchResultWithNames.groups.from2ReasonLine, "reason2toLine ", matchResultWithNames.groups.reason2toLine);

            from = matchResultWithNames.groups.fromNode.trim();
            to = matchResultWithNames.groups.toNode?.trim() || '';
            reason = matchResultWithNames.groups.reason?.trim() || '';
            from2ReasonLine = matchResultWithNames.groups.from2ReasonLine || '';
            reason2toLine = matchResultWithNames.groups.reason2toLine || '';
            from2toLine = matchResultWithNames.groups.toNode;
        }

        if (to != '' && from != '') {
            tos = to.split(',').map(node => node.trim()); // 解析多个to节点
        }

        tos.forEach(subToNode => {
            if (reason === '') {
                var tmpRelation = new From2ToRelation(from, subToNode, MyEdgeLineType.SOLID)
                var tmpRelationLine = from2ReasonLine + reason2toLine
                if (tmpRelationLine === '-') {
                    tmpRelation.lineType = MyEdgeLineType.SOLID
                } else {
                    tmpRelation.lineType = MyEdgeLineType.DASHED
                }
                console.log("add subrelation: " + tmpRelation)
                this.K_FROM_TO_RELATIONS.push(tmpRelation)
            } else {
                var from2ReasonRelation = new From2ReasonRelation(from, reason, MyEdgeLineType.SOLID, line)
                var reason2toRelation = new Reason2ToRelation(reason, subToNode, MyEdgeLineType.SOLID, line)

                if (from2ReasonLine != '-') {
                    from2ReasonRelation.lineType = MyEdgeLineType.DASHED
                }

                if (reason2toLine != '-') {
                    reason2toRelation.lineType = MyEdgeLineType.DASHED
                }

                if (!this.K_SUPER_OUT_RELATIONS.has(from2ReasonRelation.getId())) {

                    this.K_SUPER_OUT_RELATIONS.set(from2ReasonRelation.getId(), [reason2toRelation])
                } else {
                    this.K_SUPER_OUT_RELATIONS.get(from2ReasonRelation.getId()).push(reason2toRelation)
                }
                console.log("add super out relation: " + from2ReasonRelation.getId() + " to " + JSON.stringify(this.K_SUPER_OUT_RELATIONS.get(from2ReasonRelation.getId())))

                if (!this.K_SUPER_IN_RELATIONS.has(reason2toRelation.getId())) {
                    this.K_SUPER_IN_RELATIONS.set(reason2toRelation.getId(), [from2ReasonRelation])
                } else {
                    this.K_SUPER_IN_RELATIONS.get(reason2toRelation.getId()).push(from2ReasonRelation)
                }
                console.log("add super in relation: " + reason2toRelation.getId() + " to " + JSON.stringify(this.K_SUPER_IN_RELATIONS.get(reason2toRelation.getId())))
            }
        })
    }
}

class GraphManager {
    constructor() {
        this.visNetwork = null;
        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();
    }

    addNode(myNode) {
        if (this.nodes.get(myNode.id) == null) {
            console.log("add node: " + JSON.stringify(myNode))
            this.nodes.add({
                id: myNode.id,
                label: myNode.label, ...myNode.style
            });
        }
    }

    addEdge(myEdge) {
        if (this.edges.get(myEdge.id) == null) {
            console.log("add edge: " + JSON.stringify(myEdge))
            this.edges.add({
                id: myEdge.id,
                from: myEdge.fromNode.id,
                to: myEdge.toNode.id, ...myEdge.style
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

        // 添加节点
        RelatioManager.K_ONE_ONDE.forEach(relation => {
            // console.log("relation one : " + JSON.stringify(relation))
            relation.getNodes().forEach(tmpNode => {
                this.addNode(tmpNode);
            });
        })

        RelatioManager.K_FROM_TO_RELATIONS.forEach(relation => {
            // console.log("relation only from to : " + JSON.stringify(relation))
            relation.getNodes().forEach(tmpNode => {
                this.addNode(tmpNode);
            });
            relation.getEdges().forEach(tmpEdge => {
                // console.log("~~~~  : " + JSON.stringify(tmpEdge))
                this.addEdge(tmpEdge);
            })
        })

        RelatioManager.K_SUPER_OUT_RELATIONS.forEach((relations, key) => {
            console.log(key + " --> " + JSON.stringify(relations))
            if (relations.size > 1) {
                relations.forEach(relation => {
                    relation.getNodes().forEach(tmpNode => {
                        this.addNode(tmpNode);
                    });
                    relation.getEdges().forEach(tmpEdge => {
                        this.addEdge(tmpEdge);
                    })
                }
                )
            }
        })

        RelatioManager.K_SUPER_IN_RELATIONS.forEach((relations, key) => {
            console.log(JSON.stringify(relations) + "~~>" + key)
            if (relations.size > 1) {
                relations.forEach(relation => {
                    relation.getNodes().forEach(tmpNode => {
                        this.addNode(tmpNode);
                    });
                    relation.getEdges().forEach(tmpEdge => {
                        this.addEdge(tmpEdge);
                    })
                }
                )
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