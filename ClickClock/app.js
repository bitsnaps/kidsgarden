
const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const level = ref(1);
        const score = ref(0);
        const gameStarted = ref(false);
        const speechBubble = ref({ text: 'What time is it?', visible: false });
        const hourHandRotation = ref('rotate(0deg)');
        const minuteHandRotation = ref('rotate(0deg)');
        const options = ref([]);
        const correctTime = ref(null);
        const isBusy = ref(true);

        const numberOptions = ref([]);
        const placedNumbers = ref({});
        const numbersToPlace = ref([]);
        const dragOverZone = ref(null);


        const synth = window.speechSynthesis;
        let voices = [];

        const levels = [
            { level: 1, type: 'place-numbers', count: 1 },
            { level: 2, type: 'place-numbers', count: 2 },
            { level: 3, type: 'place-numbers', count: 3 },
            { level: 4, type: 'place-numbers', count: 12 },
            { level: 5, type: 'hour', questions: 5 },
            { level: 6, type: 'half-hour', questions: 7 },
            { level: 7, type: 'quarter-hour', questions: 10 },
            { level: 8, type: 'any', questions: 15 },
        ];

        let gameState = {
            question: 0,
        };

        function populateVoiceList() {
            if(typeof synth === 'undefined') {
                return;
            }
            voices = synth.getVoices();
        }

        function speak(text, onEndCallback) {
            if (synth.speaking) {
                synth.cancel();
            }
            const utterThis = new SpeechSynthesisUtterance(text);
            utterThis.onend = () => {
                if(onEndCallback) onEndCallback();
            };
            utterThis.onerror = (event) => {
                if (event.error !== 'interrupted') {
                    console.error('SpeechSynthesisUtterance.onerror', event);
                }
            };
            const childVoice = voices.find(voice => voice.name.includes('Google UK English Female') || voice.name.includes('Female'));
            if(childVoice) utterThis.voice = childVoice;
            utterThis.pitch = 1.2;
            utterThis.rate = 0.9;
            synth.speak(utterThis);
        }

        function showSpeechBubble(text, duration = 3000) {
            speechBubble.value.text = text;
            speechBubble.value.visible = true;
            setTimeout(() => speechBubble.value.visible = false, duration);
        }

        function hideSpeechBubble() {
            speechBubble.value.visible = false;
        }

        function updateSunMoon(hour) {
            const sun = document.getElementById('sun');
            const moon = document.getElementById('moon');
            const moonCutout = document.getElementById('moon-cutout');
            const app = document.getElementById('app');

            let newBgColor;

            if (level.value >= 5) {
                if (hour >= 6 && hour < 18) { // Day time (6 AM to 6 PM)
                    sun.style.display = 'block';
                    moon.style.display = 'none';
                    newBgColor = '#87CEEB'; // Sky Blue
                } else { // Night time (6 PM to 6 AM)
                    sun.style.display = 'none';
                    moon.style.display = 'block';
                    newBgColor = '#2C3E50'; // Dark Blue/Night Sky
                }
            } else {
                sun.style.display = 'none';
                moon.style.display = 'none';
                newBgColor = '#87CEEB'; // Default Sky Blue
            }
            app.style.backgroundColor = newBgColor;
            if (moonCutout) {
                moonCutout.setAttribute('fill', newBgColor);
            }
        }

        function updateClock(hour, minute) {
            const minuteDeg = (minute / 60) * 360;
            const hourDeg = ((hour % 12) / 12) * 360 + (minute / 60) * 30;
            minuteHandRotation.value = `rotate(${minuteDeg}deg)`;
            hourHandRotation.value = `rotate(${hourDeg}deg)`;
            updateSunMoon(hour);
        }

        function formatTime(hour, minute) {
            const h = hour % 12 === 0 ? 12 : hour % 12;
            const m = minute < 10 ? `0${minute}` : minute;
            return `${h}:${m}`;
        }

        function generateTime() {
            let hour, minute;
            const levelInfo = levels[level.value - 1];

            switch (levelInfo.type) {
                case 'hour':
                    hour = Math.floor(Math.random() * 12) + 1;
                    minute = 0;
                    break;
                case 'half-hour':
                    hour = Math.floor(Math.random() * 12) + 1;
                    minute = Math.random() < 0.5 ? 0 : 30;
                    break;
                case 'quarter-hour':
                    hour = Math.floor(Math.random() * 12) + 1;
                    minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
                    break;
                case 'any':
                    hour = Math.floor(Math.random() * 12) + 1;
                    minute = Math.floor(Math.random() * 12) * 5;
                    break;
            }
            return { hour, minute };
        }

        function generateOptions() {
            const opts = new Set();
            opts.add(correctTime.value);

            while (opts.size < 4) {
                const { hour, minute } = generateTime();
                opts.add(formatTime(hour, minute));
            }

            options.value = [...opts].sort(() => Math.random() - 0.5);
        }

        function setupNumberPlacementLevel() {
            const levelInfo = levels[level.value - 1];
            placedNumbers.value = {};
            
            const allNumbers = Array.from({length: 12}, (_, i) => i + 1);
            numbersToPlace.value = allNumbers.sort(() => 0.5 - Math.random()).slice(0, levelInfo.count);
            numberOptions.value = [...numbersToPlace.value].sort(() => 0.5 - Math.random());

            showSpeechBubble(`Place the number${levelInfo.count > 1 ? 's' : ''} on the clock!`);
            speak(`Let's place the number${levelInfo.count > 1 ? 's' : ''} on the clock!`);
        }

        function nextQuestion() {
            isBusy.value = true;
            const currentLevelInfo = levels[level.value - 1];

            if (currentLevelInfo.type.startsWith('place-numbers')) {
                setupNumberPlacementLevel();
                isBusy.value = false;
                return;
            }

            if (gameState.question >= currentLevelInfo.questions) {
                levelUp();
                return;
            }

            gameState.question++;
            const { hour, minute } = generateTime();
            correctTime.value = formatTime(hour, minute);

            updateClock(hour, minute);
            generateOptions();
            
            showSpeechBubble("What time is it?");
            speak("What time is it?", () => {
                isBusy.value = false;
            });
        }
        
        function levelUp() {
            score.value += 100; // Add 100 points for leveling up
            if (level.value < levels.length) {
                level.value++;
                gameState.question = 0;
                const msg = `Great job! Welcome to level ${level.value}!`;
                showSpeechBubble(msg);
                speak(msg, () => setTimeout(nextQuestion, 1000));
            } else {
                const msg = "Wow! You finished all the levels! You're a clock master!";
                showSpeechBubble(msg);
                speak(msg);
                gameStarted.value = false;
            }
        }

        function showCorrectStar() {
            const star = document.getElementById('correct-star');
            star.style.display = 'block';
            star.style.transform = 'translate(-50%, -50%) scale(1)';
            setTimeout(() => {
                star.style.transform = 'translate(-50%, -50%) scale(0)';
                setTimeout(() => {
                    star.style.display = 'none';
                }, 500);
            }, 1000);
        }

        function checkAnswer(selectedTime, event) {
            if (isBusy.value) return;
            isBusy.value = true;

            const btn = event.target;

            if (selectedTime === correctTime.value) {
                score.value += 10; // Add 10 points for a correct answer
                btn.style.backgroundColor = 'var(--correct-color)';
                showSpeechBubble("Correct!");
                speak("Correct!", () => {
                    showCorrectStar();
                    setTimeout(() => {
                        btn.style.backgroundColor = 'var(--button-bg)';
                        nextQuestion();
                    }, 1500);
                });
            } else {
                btn.style.backgroundColor = 'var(--incorrect-color)';
                showSpeechBubble("Try again!");
                speak("Try again!", () => {
                    btn.style.backgroundColor = 'var(--button-bg)';
                    isBusy.value = false;
                });
            }
        }

        function startGame() {
            gameStarted.value = true;
            level.value = 1;
            gameState.question = 0;
            speak("Let's learn the time!", () => {
                 isBusy.value = false;
                 nextQuestion();
            });
        }
        
        function dragStart(number, event) {
            event.dataTransfer.setData("text/plain", number);
            event.dataTransfer.effectAllowed = "move";
        }

        function dragOver(zoneNumber) {
            if (!placedNumbers.value[zoneNumber]) {
                dragOverZone.value = zoneNumber;
            }
        }

        function dragLeave() {
            dragOverZone.value = null;
        }

        function drop(zoneNumber) {
            if (placedNumbers.value[zoneNumber]) {
                dragOverZone.value = null;
                return;
            }
            
            const droppedNumber = parseInt(event.dataTransfer.getData("text/plain"));
            dragOverZone.value = null;

            if (droppedNumber === zoneNumber) {
                placedNumbers.value[zoneNumber] = droppedNumber;
                numberOptions.value = numberOptions.value.filter(n => n !== droppedNumber);
                speak(droppedNumber);

                const allPlaced = numbersToPlace.value.every(num => placedNumbers.value[num] === num);
                if (allPlaced) {
                    score.value += 50; // Add 50 points for completing the level
                    showSpeechBubble("Well done!");
                    speak("Well done!", () => {
                        showCorrectStar();
                        setTimeout(levelUp, 1500);
                    });
                }
            } else {
                showSpeechBubble("Oops, wrong spot!");
                speak("Oops, wrong spot!");
            }
        }


        onMounted(() => {
            populateVoiceList();
            if (typeof synth !== 'undefined' && synth.onvoiceschanged !== undefined) {
                synth.onvoiceschanged = populateVoiceList;
            }
        });

        return {
            level,
            score,
            gameStarted,
            speechBubble,
            hourHandRotation,
            minuteHandRotation,
            options,
            startGame,
            checkAnswer,
            dragStart,
            numberOptions,
            placedNumbers,
            dragOverZone,
            dragOver,
            dragLeave,
            drop
        };
    }
}).mount('#app');