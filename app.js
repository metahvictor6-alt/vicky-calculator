const expressionEl = document.querySelector('#expression');
const resultEl = document.querySelector('#result');
let expression = '';
let justCalculated = false;

const isOperator = (value) => ['+', '−', '×', '÷', '%'].includes(value);

function render() {
  expressionEl.textContent = expression || '\u00a0';
  resultEl.textContent = expression ? preview(expression) : '0';
}

function preview(value) {
  try {
    const answer = evaluate(value);
    return formatNumber(answer);
  } catch {
    return '0';
  }
}

function formatNumber(number) {
  if (!Number.isFinite(number)) throw new Error('Invalid result');
  return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(10)));
}

// A small parser keeps calculations safe without using eval().
function evaluate(input) {
  const normalized = input.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
  const tokens = normalized.match(/(?:\d*\.\d+|\d+\.?\d*|[+\-*/%])/g);
  if (!tokens || tokens.join('') !== normalized.replace(/\s/g, '')) throw new Error('Invalid expression');
  const values = [];
  const operators = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };
  const apply = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (left === undefined || right === undefined || (operator === '/' && right === 0)) throw new Error('Invalid calculation');
    values.push(operator === '+' ? left + right : operator === '-' ? left - right : operator === '*' ? left * right : operator === '/' ? left / right : left % right);
  };
  tokens.forEach((token) => {
    if (!isNaN(token)) values.push(Number(token));
    else {
      if (token === '-' && (values.length === 0 || operators.length && isOperator(operators.at(-1)))) values.push(0);
      while (operators.length && precedence[operators.at(-1)] >= precedence[token]) apply();
      operators.push(token);
    }
  });
  while (operators.length) apply();
  if (values.length !== 1) throw new Error('Invalid expression');
  return values[0];
}

function addValue(value) {
  if (justCalculated && !isOperator(value)) expression = '';
  justCalculated = false;
  if (isOperator(value)) {
    if (!expression && value !== '−') return;
    if (isOperator(expression.at(-1))) expression = expression.slice(0, -1) + value;
    else expression += value;
  } else if (value === '.') {
    const current = expression.split(/[+−×÷%]/).at(-1);
    if (current.includes('.')) return;
    expression += current ? '.' : '0.';
  } else expression += value;
  render();
}

function calculate() {
  if (!expression) return;
  try {
    const answer = formatNumber(evaluate(expression));
    expressionEl.textContent = `${expression} =`;
    resultEl.textContent = answer;
    expression = answer.replace('-', '−');
    justCalculated = true;
  } catch {
    resultEl.textContent = 'Error';
    justCalculated = true;
  }
}

document.querySelector('.keypad').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.action === 'clear') { expression = ''; justCalculated = false; render(); }
  else if (button.dataset.action === 'delete') { expression = expression.slice(0, -1); justCalculated = false; render(); }
  else if (button.dataset.action === 'calculate') calculate();
  else addValue(button.dataset.value);
});

document.addEventListener('keydown', (event) => {
  const keys = { '*': '×', '/': '÷', '-': '−', '+': '+', '%': '%', '.': '.' };
  if (/\d/.test(event.key) || keys[event.key]) { event.preventDefault(); addValue(keys[event.key] || event.key); }
  else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
  else if (event.key === 'Backspace') { expression = expression.slice(0, -1); render(); }
  else if (event.key === 'Escape') { expression = ''; render(); }
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
render();
