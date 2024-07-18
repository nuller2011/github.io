async function fetchWikipediaData(topic) {
    const url = `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const response = await fetch(url);
    if (response.ok) {
        const data = await response.json();
        return data.extract; // Возвращаем текст статьи
    } else {
        return null;
    }
}

async function fetchDuckDuckGoData(query) {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`;
    const response = await fetch(url);
    if (response.ok) {
        const data = await response.json();
        return data.AbstractText || null;
    } else {
        return null;
    }
}

const trainingData = [
    { question: "Как тебя зовут?", answer: "Меня зовут ChatGPT." },
    { question: "Как дела?", answer: "Я модель искусственного интеллекта, у меня всё отлично!" },
    { question: "Что ты умеешь делать?", answer: "Я могу отвечать на различные вопросы и искать информацию в интернете." },
    { question: "Кто ты такой?", answer: "Я чат-бот, созданный на основе нейронных сетей." },
    { question: "Где ты обучался?", answer: "Я обучался на платформе OpenAI." },
    { question: "Зачем ты нужен?", answer: "Я разработан для помощи в получении информации и ответа на вопросы пользователей." },
    { question: "Какие у тебя хобби?", answer: "Я не имею физической формы, но мое хобби - изучать новые алгоритмы и языки программирования." },
    { question: "Чем ты отличаешься от других ИИ?", answer: "Каждый ИИ имеет свои особенности. Я специализируюсь на обработке естественного языка и поиске информации." },
    { question: "Какой твой любимый цвет?", answer: "Мой любимый цвет - это код!" },
    { question: "Какие технологии используются в нейросетях?", answer: "Нейросети используют различные алгоритмы машинного обучения, такие как сверточные нейронные сети и рекуррентные нейронные сети." },
    { question: "Какие проблемы решает машинное обучение?", answer: "Машинное обучение решает задачи классификации, регрессии, кластеризации, обработки текстов и изображений." },
    { question: "Что такое глубокое обучение?", answer: "Глубокое обучение - это подход в машинном обучении, использующий многократные слои для автоматического извлечения признаков из данных." }
];

// Простая нейросеть
const model = tf.sequential();
model.add(tf.layers.dense({units: 10, inputShape: [1], activation: 'relu'}));
model.add(tf.layers.dense({units: 1, activation: 'linear'}));

model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

// Обучение модели на данных
const xs = tf.tensor1d(trainingData.map((_, i) => i));
const ys = tf.tensor1d(trainingData.map((data) => data.answer.length)); // Используем длину ответа как выходное значение

model.fit(xs, ys, {epochs: 100}).then(() => {
    console.log('Model trained');
});

async function answerQuestion() {
    const question = document.getElementById('question').value;

    // Простейший подход: находим наиболее подходящий вопрос в обучающем наборе
    let bestMatch = trainingData[0];
    let bestScore = -Infinity;
    trainingData.forEach(data => {
        const score = similarity(question, data.question);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = data;
        }
    });

    // Если не найдено подходящего ответа, попробуем получить данные с Википедии
    if (bestScore < 0.5) {
        const wikiData = await fetchWikipediaData(question);
        if (wikiData) {
            displayAnswer(wikiData);
            return;
        }

        // Если данных с Википедии недостаточно, попробуем получить данные с DuckDuckGo
        const duckDuckGoData = await fetchDuckDuckGoData(question);
        if (duckDuckGoData) {
            displayAnswer(duckDuckGoData);
            return;
        }
    }

    displayAnswer(bestMatch.answer);
}

// Функция для отображения ответа с анимацией
function displayAnswer(answer) {
    const answerElement = document.getElementById('answer');
    answerElement.innerHTML = ''; // Очищаем содержимое

    const answerText = document.createElement('div');
    answerText.classList.add('fadeInText'); // Добавляем класс анимации
    answerText.textContent = answer;
    answerElement.appendChild(answerText);
}

// Простейшая функция для сравнения строк (похожесть строк)
function similarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

// Расстояние Левенштейна
function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) {
            costs[s2.length] = lastValue;
        }
    }
    return costs[s2.length];
}
