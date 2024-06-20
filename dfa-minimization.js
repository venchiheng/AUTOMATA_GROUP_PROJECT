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

    // Display the minimized DFA as a graph
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
    let minimizedFinalStates = minimizedStates.filter(state => 
        state.split('').some(s => finalStates.includes(s))
    );
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
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    dfa.states.forEach(state => {
        nodes.add({
            id: state,
            label: state,
            shape: 'ellipse',
            color: state === dfa.startState ? 'green' : undefined,
            font: {
                size: 14,
                color: dfa.finalStates.includes(state) ? 'black' : undefined,
            },
            borderWidth: dfa.finalStates.includes(state) ? 3 : 1
        });
    });

    // Group transitions with the same 'from' and 'to' states
    const transitionMap = {};
    dfa.transitions.forEach(transition => {
        const key = `${transition.from}->${transition.to}`;
        if (!transitionMap[key]) {
            transitionMap[key] = [];
        }
        transitionMap[key].push(transition.input);
    });

    for (const key in transitionMap) {
        const [from, to] = key.split('->');
        const inputs = transitionMap[key].join(',');
        edges.add({
            from: from,
            to: to,
            label: inputs,
            arrows: 'to'
        });
    }

    const container = document.getElementById('mynetwork');
    const data = {
        nodes: nodes,
        edges: edges
    };
    const options = {
        edges: {
            smooth: {
                type: 'curvedCW',
                roundness: 0.2
            }
        },
        physics: {
            enabled: false
        }
    };
    new vis.Network(container, data, options);
}
