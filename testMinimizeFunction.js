function removeUnreachableStates(dfa) {
    const reachable = new Set();
    const stack = [dfa.startState];
    while (stack.length > 0) {
        const state = stack.pop();
        if (!reachable.has(state)) {
            reachable.add(state);
            for (const symbol of dfa.alphabet) {
                const nextState = dfa.transitions[state][symbol];
                if (nextState && !reachable.has(nextState)) {
                    stack.push(nextState);
                }
            }
        }
    }
    const newStates = Array.from(reachable);
    const newTransitions = {};
    for (const state of newStates) {
        newTransitions[state] = dfa.transitions[state];
    }
    const newFinalStates = dfa.finalStates.filter(state => reachable.has(state));
    return {
        states: newStates,
        alphabet: dfa.alphabet,
        transitions: newTransitions,
        startState: dfa.startState,
        finalStates: newFinalStates,
    };
}
function initializeDistinguishabilityTable(states) {
    const table = {};
    for (let i = 0; i < states.length; i++) {
        for (let j = i + 1; j < states.length; j++) {
            table[`${states[i]},${states[j]}`] = false;
        }
    }
    return table;
}
function markDistinguishablePairs(dfa, table) {
    let changed;
    do {
        changed = false;
        for (let [pair, marked] of Object.entries(table)) {
            if (!marked) {
                const [state1, state2] = pair.split(',');
                for (const symbol of dfa.alphabet) {
                    const nextState1 = dfa.transitions[state1][symbol];
                    const nextState2 = dfa.transitions[state2][symbol];
                    if (nextState1 && nextState2 && table[`${nextState1},${nextState2}`] === true) {
                        table[pair] = true;
                        changed = true;
                        break;
                    }
                }
            }
        }
    } while (changed);
}
function formEquivalenceClasses(states, table) {
    const classes = [];
    const visited = new Set();
    for (const state of states) {
        if (!visited.has(state)) {
            const eqClass = [state];
            visited.add(state);
            for (const otherState of states) {
                if (state !== otherState && !table[`${state},${otherState}`]) {
                    eqClass.push(otherState);
                    visited.add(otherState);
                }
            }
            classes.push(eqClass);
        }
    }
    return classes;
}
function constructMinimizedDFA(dfa, equivalenceClasses) {
    const newStates = equivalenceClasses.map(eqClass => eqClass.join(''));
    const newTransitions = {};
    const eqClassMap = {};
    equivalenceClasses.forEach(eqClass => {
        const repr = eqClass.join('');
        eqClass.forEach(state => {
            eqClassMap[state] = repr;
        });
    });
    newStates.forEach(newState => {
        newTransitions[newState] = {};
        const reprState = equivalenceClasses.find(eqClass => eqClass.join('') === newState)[0];
        for (const symbol of dfa.alphabet) {
            const nextState = dfa.transitions[reprState][symbol];
            newTransitions[newState][symbol] = eqClassMap[nextState];
        }
    });
    const newStartState = eqClassMap[dfa.startState];
    const newFinalStates = dfa.finalStates.map(state => eqClassMap[state]);
    return {
        states: newStates,
        alphabet: dfa.alphabet,
        transitions: newTransitions,
        startState: newStartState,
        finalStates: Array.from(new Set(newFinalStates)),
    };
}
function minimizeDFA(dfa) {
    // Step 1: Remove unreachable states
    const reachableDFA = removeUnreachableStates(dfa);

    // Step 2: Initialize the table of distinguishability
    const table = initializeDistinguishabilityTable(reachableDFA.states);

    // Step 3: Mark distinguishable pairs
    markDistinguishablePairs(reachableDFA, table);

    // Step 4: Form equivalence classes
    const equivalenceClasses = formEquivalenceClasses(reachableDFA.states, table);

    // Step 5: Construct the minimized DFA
    const minimizedDFA = constructMinimizedDFA(reachableDFA, equivalenceClasses);

    return minimizedDFA;
}

// Example DFA definition
const dfa = {
    states: ['q0', 'q1', 'q2', 'q3'],
    alphabet: ['a', 'b'],
    transitions: {
        'q0': { 'a': 'q1', 'b': 'q2' },
        'q1': { 'a': 'q0', 'b': 'q3' },
        'q2': { 'a': 'q3', 'b': 'q0' },
        'q3': { 'a': 'q2', 'b': 'q1' }
    },
    startState: 'q0',
    finalStates: ['q0', 'q3']
};

// Minimize the DFA
const minimizedDFA = minimizeDFA(dfa);

console.log(minimizedDFA);
