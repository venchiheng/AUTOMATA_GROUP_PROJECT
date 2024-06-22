function minimizeDFA() {
    // Read inputs
    const states = document.getElementById('states').value.split(',').map(s => s.trim());
    const alphabet = document.getElementById('alphabet').value.split(',').map(a => a.trim());
    const startState = document.getElementById('startState').value.trim();
    const finalStates = document.getElementById('finalStates').value.split(',').map(f => f.trim());

    const transitionInput = document.getElementById('transitions').value.trim().split('\n');
    const transitions = transitionInput.map(t => {
        const parts = t.split(',').map(p => p.trim());
        return { from: parts[0], input: parts[1], to: parts[2] };
    });

    console.log('Input DFA:', { states, alphabet, startState, finalStates, transitions });

    // Build DFA structure
    const dfa = {
        states: states,
        alphabet: alphabet,
        startState: startState,
        finalStates: finalStates,
        transitions: transitions
    };

    // Minimize DFA using partition refinement algorithm
    const minimizedDFA = partitionRefinement(dfa);

    // Output the minimized DFA
    document.getElementById('output').textContent = formatDFA(minimizedDFA);
    console.log('Minimized DFA:', minimizedDFA);
    displayGraph(minimizedDFA);
}

function partitionRefinement(dfa) {
    let { states, alphabet, startState, finalStates, transitions } = dfa;
    let nonFinalStates = states.filter(state => !finalStates.includes(state));

    // Initial partition
    let P = [finalStates, nonFinalStates];
    let W = [finalStates, nonFinalStates];

    while (W.length > 0) {
        let A = W.pop();
        for (let symbol of alphabet) {
            let X = states.filter(state => {
                let transition = transitions.find(t => t.from === state && t.input === symbol);
                return transition && A.includes(transition.to);
            });

            for (let Y of P) {
                let intersection = Y.filter(state => X.includes(state));
                let difference = Y.filter(state => !X.includes(state));

                if (intersection.length > 0 && difference.length > 0) {
                    P = P.filter(part => part !== Y);
                    P.push(intersection, difference);

                    let index = W.indexOf(Y);
                    if (index !== -1) {
                        W.splice(index, 1, intersection, difference);
                    } else {
                        W.push(intersection.length <= difference.length ? intersection : difference);
                    }
                }
            }
        }
    }

    let minimizedStates = P.map(group => group.join(''));
    let minimizedFinalStates = P
        .filter(group => group.some(state => finalStates.includes(state)))
        .map(group => group.join(''));
    let minimizedStartState = minimizedStates.find(state => state.includes(startState));
    let minimizedTransitions = [];

    for (let group of P) {
        for (let symbol of alphabet) {
            let fromState = group.join('');
            let representative = group[0];
            let transition = transitions.find(t => t.from === representative && t.input === symbol);
            if (transition) {
                let toState = P.find(part => part.includes(transition.to)).join('');
                minimizedTransitions.push({ from: fromState, input: symbol, to: toState });
            }
        }
    }

    return {
        states: minimizedStates,
        alphabet: alphabet,
        startState: minimizedStartState,
        finalStates: minimizedFinalStates,
        transitions: minimizedTransitions
    };
}

function formatDFA(dfa) {
    let result = `States: ${dfa.states.join(', ')}\n`;
    result += `Alphabet: ${dfa.alphabet.join(', ')}\n`;
    result += `Start State: ${dfa.startState}\n`;
    result += `Final States: ${dfa.finalStates.join(', ')}\n`;
    result += `Transitions:\n`;
    for (let t of dfa.transitions) {
        result += `${t.from}, ${t.input}, ${t.to}\n`;
    }
    return result;
}

function displayGraph(dfa) {
    resetGraph();
    dfa.states.forEach(drawState);
    setInitialState(dfa.startState);
    dfa.finalStates.forEach(highlightAcceptState);
    dfa.transitions.forEach(t => drawTransition(t.from, t.to, t.input));
}

function resetGraph() {
    const canvas = document.getElementById('minimize-canvas');
    canvas.innerHTML = '<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#000"/></marker></defs>';
    transitionsMap = {};  // Reset the transitions map
}

function drawState(stateId) {
    const canvas = document.getElementById('minimize-canvas');
    const existingStates = document.querySelectorAll('circle');
    const stateRadius = 30;
    let x, y;

    do {
        x = Math.random() * (canvas.clientWidth - 2 * stateRadius) + stateRadius;
        y = Math.random() * (canvas.clientHeight - 2 * stateRadius) + stateRadius;
        var overlap = false;
        existingStates.forEach(existingState => {
            const existingX = parseFloat(existingState.getAttribute('cx'));
            const existingY = parseFloat(existingState.getAttribute('cy'));
            const distance = Math.sqrt(Math.pow(x - existingX, 2) + Math.pow(y - existingY, 2));
            if (distance < 2 * stateRadius) {
                overlap = true;
            }
        });
    } while (overlap);

    const state = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    state.setAttribute('cx', x);
    state.setAttribute('cy', y);
    state.setAttribute('r', stateRadius);
    state.setAttribute('id', stateId);
    state.setAttribute('stroke', 'black');
    state.setAttribute('stroke-width', 2);
    state.setAttribute('fill', 'silver');
    state.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))');
    canvas.appendChild(state);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y + 5);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dy', '.3em');
    label.textContent = stateId;
    canvas.appendChild(label);
}

function setInitialState(stateId) {
    const stateElement = document.getElementById(stateId);
    stateElement.setAttribute('fill', 'blue');

    const canvas = document.getElementById('minimize-canvas');
    const centerX = parseFloat(stateElement.getAttribute('cx'));
    const centerY = parseFloat(stateElement.getAttribute('cy'));
    const arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    arrowLine.setAttribute('x1', centerX - 80);
    arrowLine.setAttribute('y1', centerY);
    arrowLine.setAttribute('x2', centerX - 40);
    arrowLine.setAttribute('y2', centerY);
    arrowLine.setAttribute('stroke', 'black');
    arrowLine.setAttribute('stroke-width', 2);
    arrowLine.setAttribute('marker-end', 'url(#arrow)');
    canvas.appendChild(arrowLine);
}

let transitionsMap = {};

function drawTransition(fromState, toState, symbol) {
    const canvas = document.getElementById('minimize-canvas');
    const fromElement = document.getElementById(fromState);
    const toElement = document.getElementById(toState);

    const fromX = parseFloat(fromElement.getAttribute('cx'));
    const fromY = parseFloat(fromElement.getAttribute('cy'));
    const toX = parseFloat(toElement.getAttribute('cx'));
    const toY = parseFloat(toElement.getAttribute('cy'));

    const radius = parseFloat(fromElement.getAttribute('r'));

    if (!transitionsMap[fromState]) {
        transitionsMap[fromState] = {};
    }

    if (!transitionsMap[fromState][toState]) {
        transitionsMap[fromState][toState] = [];
    }

    const transitionCount = transitionsMap[fromState][toState].length;

    // Register the transition
    transitionsMap[fromState][toState].push(symbol);

    if (transitionCount > 0 || (transitionsMap[toState] && transitionsMap[toState][fromState] && transitionsMap[toState][fromState].length > 0)) {
        // Create a curved line for the bidirectional transition
        const controlX = (fromX + toX) / 2 + (fromY - toY) / 4;
        const controlY = (fromY + toY) / 2 + (toX - fromX) / 4;

        // Draw the curved arrow
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${fromX},${fromY} Q${controlX},${controlY} ${toX},${toY}`);
        path.setAttribute('stroke', 'red');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrow)');
        canvas.appendChild(path);

        // Add label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', controlX);
        label.setAttribute('y', controlY);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dy', '-0.5em');
        label.textContent = symbol;
        canvas.appendChild(label);
    } else {
        // Calculate the angle between the two states
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Calculate the starting point of the arrow on the fromState circle
        const startX = fromX + Math.cos(angle) * radius;
        const startY = fromY + Math.sin(angle) * radius;

        // Calculate the ending point of the arrow on the toState circle
        const endX = toX - Math.cos(angle) * radius;
        const endY = toY - Math.sin(angle) * radius;

        // Draw the straight arrow
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${startX},${startY} L${endX},${endY}`);
        path.setAttribute('stroke', 'red');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrow)');
        canvas.appendChild(path);

        // Add label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', (startX + endX) / 2);
        label.setAttribute('y', (startY + endY) / 2);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dy', '-0.5em');
        label.textContent = symbol;
        canvas.appendChild(label);
    }
}





function addSelfTransition(state, symbol) {
    const canvas = document.getElementById('minimize-canvas');
            const stateElement = document.getElementById(state);

            const cx = parseFloat(stateElement.getAttribute('cx'));
            const cy = parseFloat(stateElement.getAttribute('cy'));

            const curveX = cx + 20;
            const curveY = cy - 20;
            const controlX = cx + 8;
            const controlY = cy - 100;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M${cx - 20},${cy - 20} Q${controlX},${controlY} ${curveX},${curveY}`);
            path.setAttribute('stroke', 'black');
            path.setAttribute('fill', 'none');
            canvas.appendChild(path);

            const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            arrowHead.setAttribute('points', `${curveX},${curveY} ${curveX - 5},${curveY - 10} ${curveX + 5},${curveY - 10}`);
            arrowHead.setAttribute('fill', 'black');
            canvas.appendChild(arrowHead);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', curveX);
            label.setAttribute('y', curveY - 35);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dy', '-0.5em');
            label.textContent = symbol;
            canvas.appendChild(label);
}

function highlightAcceptState(stateId) {
    const state = document.getElementById(stateId);
    state.setAttribute('fill', 'green');

    const doubleCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const radius = parseFloat(state.getAttribute('r'));
    doubleCircle.setAttribute('cx', parseFloat(state.getAttribute('cx')));
    doubleCircle.setAttribute('cy', parseFloat(state.getAttribute('cy')));
    doubleCircle.setAttribute('r', radius * 1.2);
    doubleCircle.setAttribute('stroke', 'black');
    doubleCircle.setAttribute('stroke-width', 2);
    doubleCircle.setAttribute('fill', 'none');
    doubleCircle.classList.add('double-circle');
    const canvas = document.getElementById('minimize-canvas');
    canvas.appendChild(doubleCircle);
}
