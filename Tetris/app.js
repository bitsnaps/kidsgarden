// Add this before closing </body> tag
document.addEventListener('DOMContentLoaded', () => {
    const jsConfetti = new JSConfetti();
    const gameBoard = document.querySelector('.game-board');
    const scoreDisplay = document.querySelector('.score');
    const nextGrid = document.querySelector('.next-grid');
    let score = 0;
    let speed = 1000;
    let gameInterval;
    let currentPiece;
    let nextPiece;
    let board = Array(200).fill(null);

    document.getElementById('up').addEventListener('touchstart', () => doRotatePiece(currentPiece));
    document.getElementById('down').addEventListener('touchstart', () => moveDown());
    document.getElementById('left').addEventListener('touchstart', () => doMoveLeft(currentPiece));
    document.getElementById('right').addEventListener('touchstart', () => doMoveRight(currentPiece));
    
    // Prevent scrolling when touching the buttons
    document.querySelectorAll('.control-button').forEach(button => {
        button.addEventListener('touchstart', (e) => e.preventDefault());
        button.addEventListener('touchmove', (e) => e.preventDefault());
        button.addEventListener('touchend', (e) => e.preventDefault());
    });

    const PIECES = {
        I: {
            shape: [
                [1, 1, 1, 1]
            ],
            className: 'piece-I'
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            className: 'piece-O'
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1]
            ],
            className: 'piece-T'
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0]
            ],
            className: 'piece-S'
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1]
            ],
            className: 'piece-Z'
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1]
            ],
            className: 'piece-J'
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1]
            ],
            className: 'piece-L'
        }
    };

    // Initialize game board
    for (let i = 0; i < 200; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        gameBoard.appendChild(cell);
    }

    // Initialize next piece preview
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        nextGrid.appendChild(cell);
    }

    function getRandomPiece() {
        const pieces = Object.keys(PIECES);
        const piece = PIECES[pieces[Math.floor(Math.random() * pieces.length)]];
        return {
            shape: piece.shape,
            className: piece.className,
            position: { x: 3, y: 0 },
            rotation: 0
        };
    }

    function rotatePiece(piece) {
        const newShape = piece.shape[0].map((_, i) =>
            piece.shape.map(row => row[i]).reverse()
        );
        return { ...piece, shape: newShape };
    }

    function drawPiece() {
        const cells = document.querySelectorAll('.game-board .cell');
        cells.forEach(cell => cell.className = 'cell');
        board.forEach((className, i) => {
            if (className) cells[i].classList.add(className);
        });

        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const pos = (currentPiece.position.y + y) * 10 + currentPiece.position.x + x;
                    if (pos >= 0) cells[pos].classList.add(currentPiece.className);
                }
            });
        });
    }

    function drawNextPiece() {
        const cells = document.querySelectorAll('.next-grid .cell');
        cells.forEach(cell => cell.className = 'cell');
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) cells[y * 4 + x].classList.add(nextPiece.className);
            });
        });
    }

    function collision(piece) {
        return piece.shape.some((row, y) => {
            return row.some((value, x) => {
                if (!value) return false;
                const nextPos = (piece.position.y + y) * 10 + (piece.position.x + x);
                return nextPos < 0 || nextPos >= 200 ||
                    x + piece.position.x < 0 ||
                    x + piece.position.x >= 10 ||
                    board[nextPos];
            });
        });
    }

    function mergePiece() {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const pos = (currentPiece.position.y + y) * 10 + currentPiece.position.x + x;
                    board[pos] = currentPiece.className;
                }
            });
        });
    }

    function clearLines() {
        let linesCleared = 0;
        for (let y = 19; y >= 0; y--) {
            const row = board.slice(y * 10, (y + 1) * 10);
            if (row.every(cell => cell)) {
                board.splice(y * 10, 10);
                board.unshift(...Array(10).fill(null));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared) {
            jsConfetti.addConfetti();
            score += linesCleared * 100;
            scoreDisplay.textContent = score;
            localStorage.setItem('score', score);
            speed = Math.max(100, 1000 - Math.floor(score / 100) * 50);
            clearInterval(gameInterval);
            gameInterval = setInterval(moveDown, speed);
        }
    }

    function moveDown() {
        currentPiece.position.y++;
        if (collision(currentPiece)) {
            currentPiece.position.y--;
            mergePiece();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = getRandomPiece();
            drawNextPiece();
            if (collision(currentPiece)) {
                alert('Game Over! Score: ' + score);
                init();
                return;
            }
        }
        drawPiece();
    }

    function init() {
        board = Array(200).fill(null);
        score = 0;
        speed = 1000;
        scoreDisplay.textContent = '0';
        clearInterval(gameInterval);
        currentPiece = getRandomPiece();
        nextPiece = getRandomPiece();
        drawNextPiece();
        gameInterval = setInterval(moveDown, speed);
    }
    function doRotatePiece(piece) {
        const rotated = rotatePiece(piece);
        if (!collision({ ...rotated, position: piece.position })) {
            piece.shape = rotated.shape;
        }        
    }

    function doMoveRight(piece) {
        piece.position.x++;
        if (collision(piece)) piece.position.x--;        
    }

    function doMoveLeft(piece) {
        piece.position.x--;
        if (collision(piece)) piece.position.x++;
    }

    document.addEventListener('keydown', e => {
        switch (e.key) {
            case 'ArrowLeft':
                doMoveLeft(currentPiece);
                break;
            case 'ArrowRight':
                doMoveRight(currentPiece);
                break;
            case 'ArrowDown':
                moveDown();
                break;
            case 'ArrowUp':
                doRotatePiece(currentPiece);
                break;
            case ' ':
                while (!collision(currentPiece)) {
                    currentPiece.position.y++;
                }
                currentPiece.position.y--;
                moveDown();
                break;
        }
        drawPiece();
    });

    init();
});