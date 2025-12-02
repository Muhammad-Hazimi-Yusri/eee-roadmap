// EEE Roadmap Data Structure
const roadmapData = {
    name: "Start",
    children: [
        {
            name: "Fundamentals",
            id: "fundamentals",
            children: [
                {
                    name: "Circuit Theory",
                    id: "circuit-theory",
                    description: "Basic electrical circuits, Ohm's law, KVL, KCL",
                    status: "available",
                    children: [
                        {
                            name: "DC Circuits",
                            id: "dc-circuits",
                            topics: ["Ohm's Law", "Series/Parallel", "Voltage Dividers", "Current Dividers"],
                            simulator: true
                        },
                        {
                            name: "AC Circuits",
                            id: "ac-circuits",
                            topics: ["Phasors", "Impedance", "Resonance", "Filters"],
                            simulator: true
                        }
                    ]
                },
                {
                    name: "Mathematics",
                    id: "mathematics",
                    description: "Essential math for EEE",
                    status: "available",
                    children: [
                        {
                            name: "Complex Numbers",
                            id: "complex-numbers",
                            topics: ["Rectangular Form", "Polar Form", "Operations"]
                        },
                        {
                            name: "Differential Equations",
                            id: "diff-eq",
                            topics: ["First Order", "Second Order", "Laplace Transform"]
                        }
                    ]
                },
                {
                    name: "Physics",
                    id: "physics",
                    description: "Electromagnetic theory",
                    status: "available",
                    children: [
                        {
                            name: "Electromagnetism",
                            id: "em",
                            topics: ["Electric Fields", "Magnetic Fields", "Maxwell's Equations"]
                        }
                    ]
                }
            ]
        },
        {
            name: "Core Topics",
            id: "core",
            children: [
                {
                    name: "Electronics",
                    id: "electronics",
                    description: "Semiconductor devices and applications",
                    status: "locked",
                    children: [
                        {
                            name: "Diodes",
                            id: "diodes",
                            topics: ["PN Junction", "Rectifiers", "Zener", "LEDs"],
                            simulator: true
                        },
                        {
                            name: "Transistors",
                            id: "transistors",
                            topics: ["BJT", "MOSFET", "Amplifiers", "Switches"],
                            simulator: true
                        },
                        {
                            name: "Op-Amps",
                            id: "opamps",
                            topics: ["Ideal Op-Amp", "Configurations", "Filters", "Oscillators"],
                            simulator: true
                        }
                    ]
                },
                {
                    name: "Digital Logic",
                    id: "digital",
                    description: "Digital circuits and systems",
                    status: "locked",
                    children: [
                        {
                            name: "Logic Gates",
                            id: "gates",
                            topics: ["Boolean Algebra", "Combinational", "Karnaugh Maps"],
                            simulator: true
                        },
                        {
                            name: "Sequential Logic",
                            id: "sequential",
                            topics: ["Flip-Flops", "Counters", "State Machines"],
                            simulator: true
                        }
                    ]
                },
                {
                    name: "Signals & Systems",
                    id: "signals",
                    description: "Signal processing fundamentals",
                    status: "locked",
                    children: [
                        {
                            name: "Fourier Analysis",
                            id: "fourier",
                            topics: ["Fourier Series", "FFT", "Frequency Domain"]
                        },
                        {
                            name: "Filters",
                            id: "filters",
                            topics: ["Analog Filters", "Digital Filters", "DSP"],
                            simulator: true
                        }
                    ]
                }
            ]
        },
        {
            name: "Advanced",
            id: "advanced",
            children: [
                {
                    name: "Power Systems",
                    id: "power",
                    description: "Power generation and distribution",
                    status: "locked",
                    children: [
                        {
                            name: "Machines",
                            id: "machines",
                            topics: ["Motors", "Generators", "Transformers"]
                        },
                        {
                            name: "Power Electronics",
                            id: "power-electronics",
                            topics: ["Converters", "Inverters", "SMPS"],
                            simulator: true
                        }
                    ]
                },
                {
                    name: "Control Systems",
                    id: "control",
                    description: "Feedback and control theory",
                    status: "locked",
                    children: [
                        {
                            name: "Classical Control",
                            id: "classical",
                            topics: ["PID", "Root Locus", "Bode Plots"]
                        },
                        {
                            name: "Modern Control",
                            id: "modern",
                            topics: ["State Space", "Optimal Control", "Robust Control"]
                        }
                    ]
                },
                {
                    name: "Communications",
                    id: "comms",
                    description: "Communication systems",
                    status: "locked",
                    children: [
                        {
                            name: "Analog Comm",
                            id: "analog-comm",
                            topics: ["AM", "FM", "PM"]
                        },
                        {
                            name: "Digital Comm",
                            id: "digital-comm",
                            topics: ["PCM", "ASK/FSK/PSK", "OFDM"]
                        }
                    ]
                }
            ]
        }
    ]
};

// Initialize D3 Roadmap
function initRoadmap() {
    const svg = d3.select("#roadmap-svg");
    const width = 1200;
    const height = 800;
    
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    
    // Create hierarchical layout
    const treeLayout = d3.tree().size([width - 100, height - 100]);
    const root = d3.hierarchy(roadmapData);
    const treeData = treeLayout(root);
    
    // Create container group
    const g = svg.append("g")
        .attr("transform", "translate(50, 50)");
    
    // Custom link generator for PCB-style traces (right angles)
    function pcbLink(d) {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        const midY = (sourceY + targetY) / 2;
        
        return `M ${sourceX} ${sourceY}
                L ${sourceX} ${midY}
                L ${targetX} ${midY}
                L ${targetX} ${targetY}`;
    }
    
    // Draw connections as PCB traces
    const links = g.selectAll(".link")
        .data(treeData.links())
        .enter()
        .append("g");
    
    // Add copper trace
    links.append("path")
        .attr("class", "node-connection")
        .attr("d", pcbLink);
    
    // Add via holes at connection points
    links.append("circle")
        .attr("class", "via-hole")
        .attr("cx", d => d.source.x)
        .attr("cy", d => (d.source.y + d.target.y) / 2)
        .attr("r", 3)
        .attr("fill", "var(--pcb-green)")
        .attr("stroke", "var(--copper)")
        .attr("stroke-width", 1.5);
    
    // Create nodes as components
    const nodes = g.selectAll(".node")
        .data(treeData.descendants())
        .enter()
        .append("g")
        .attr("class", "roadmap-node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
    
    // Add solder pads
    nodes.append("circle")
        .attr("class", "solder-point")
        .attr("cx", -65)
        .attr("cy", 0)
        .attr("r", 4);
    
    nodes.append("circle")
        .attr("class", "solder-point")
        .attr("cx", 65)
        .attr("cy", 0)
        .attr("r", 4);
    
    // Add component rectangles
    nodes.append("rect")
        .attr("class", d => {
            let classes = "node-rect";
            if (d.data.status === "completed") classes += " completed";
            if (d.data.status === "in-progress") classes += " in-progress";
            return classes;
        })
        .attr("x", -60)
        .attr("y", -20)
        .attr("width", 120)
        .attr("height", 40);
    
    // Add text labels (component designators)
    nodes.append("text")
        .attr("class", "node-text")
        .attr("dy", "0.35em")
        .text(d => d.data.name)
        .call(wrapText, 110);
    
    // Add LED indicator for simulator-enabled modules
    nodes.filter(d => d.data.simulator)
        .append("circle")
        .attr("cx", 55)
        .attr("cy", -15)
        .attr("r", 5)
        .attr("fill", "var(--led-green)")
        .attr("stroke", "none")
        .style("filter", "drop-shadow(0 0 3px rgba(0, 255, 65, 0.8))");
    
    // Add component ID labels
    nodes.append("text")
        .attr("x", 0)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("fill", "var(--copper-light)")
        .attr("font-family", "Courier New, monospace")
        .text((d, i) => `U${i + 1}`);
    
    // Add click interactions
    nodes.on("click", function(event, d) {
        // Flash effect
        d3.select(this).select(".node-rect")
            .transition()
            .duration(100)
            .attr("fill", "var(--led-yellow)")
            .transition()
            .duration(300)
            .attr("fill", "var(--pcb-green)");
        
        showNodeDetails(d.data);
    });
    
    // Add hover effect
    nodes.on("mouseenter", function(event, d) {
        d3.select(this).select(".node-rect")
            .attr("stroke", "var(--led-yellow)")
            .attr("stroke-width", 3);
    });
    
    nodes.on("mouseleave", function(event, d) {
        d3.select(this).select(".node-rect")
            .attr("stroke", "var(--copper)")
            .attr("stroke-width", 2);
    });
}

// Text wrapping helper
function wrapText(text, width) {
    text.each(function() {
        let text = d3.select(this);
        let words = text.text().split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        let lineHeight = 1.1;
        let y = text.attr("y");
        let dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null)
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", dy + "em");
        
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word);
            }
        }
    });
}

// Show node details (placeholder for future modal/sidebar)
function showNodeDetails(node) {
    if (node.id && node.topics) {
        console.log("Node clicked:", node.name);
        console.log("Topics:", node.topics);
        if (node.simulator) {
            console.log("This module has an interactive simulator!");
        }
        
        // In the future, this will open a modal or sidebar with:
        // - Detailed topic information
        // - Links to resources
        // - Embedded circuit simulator
        // - Progress tracking
        
        alert(`${node.name}\n\nTopics:\n• ${node.topics.join('\n• ')}\n\n${node.simulator ? '⚡ Interactive simulator available!' : ''}`);
    }
}

// Smooth scroll to roadmap
function scrollToRoadmap() {
    document.getElementById('roadmap').scrollIntoView({ behavior: 'smooth' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initRoadmap();
});

// Alternative tree layout for smaller screens
function adjustForMobile() {
    if (window.innerWidth < 768) {
        // Convert to vertical layout for mobile
        const svg = d3.select("#roadmap-svg");
        svg.attr("viewBox", "0 0 400 1200");
        // Re-render with vertical orientation
        // This would need additional implementation
    }
}

window.addEventListener('resize', adjustForMobile);
