
        document.addEventListener('DOMContentLoaded', async () => {
            const canvas = document.getElementById('angle-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                let lines = [];
                const numLines = 50;

                const setCanvasSize = () => {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                };

                class Line {
                    constructor() {
                        this.reset();
                    }
                    reset() {
                        this.x = Math.random() * canvas.width;
                        this.y = Math.random() * canvas.height;
                        this.angle = Math.random() * Math.PI * 2;
                        this.speed = Math.random() * 0.5 + 0.1;
                        this.length = Math.random() * 40 + 20;
                        this.life = Math.random() * 200 + 100;
                        this.initialLife = this.life;
                        this.color = `rgba(45, 212, 191, ${Math.random() * 0.3 + 0.1})`;
                    }
                    update() {
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                        this.angle += (Math.random() - 0.5) * 0.1; // Slightly change direction
                        this.life--;
                        if (this.life <= 0 || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                            this.reset();
                        }
                    }
                    draw() {
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(this.x - Math.cos(this.angle) * this.length, this.y - Math.sin(this.angle) * this.length);
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = (this.life / this.initialLife) * 0.5;
                        ctx.stroke();
                    }
                }

                function initLines() {
                    lines = [];
                    for (let i = 0; i < numLines; i++) {
                        lines.push(new Line());
                    }
                }

                function animate() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1;
                    lines.forEach(line => {
                        line.update();
                        line.draw();
                    });
                    requestAnimationFrame(animate);
                }

                setCanvasSize();
                initLines();
                animate();

                window.addEventListener('resize', () => {
                    setCanvasSize();
                    initLines();
                });
            }

            


            CardLoader.loadCards({
                'jhrelth-img-container': 'Tindangle Jhrelth',
                'dholes-img-container': 'Tindangle Dholes',
                'delaunay-img-container-combo': 'Tindangle Delaunay',
                'cerberus-img-container': 'Tindangle Acute Cerberus',
                'fiendess-img-container': 'Subterror Behemoth Fiendess',
            });

            await CardLoader.renderDeckResourcesCompact('deck-resources-compact', 'Tindangle Deck Analyis.html');
            // Render archetype cards browser (compact mode at top)
            await CardLoader.renderArchetypeCardsBrowser('archetype-cards-browser', 'Tindangle Deck Analyis.html', { 
                compact: true, 
                buttonColor: 'from-purple-600 to-indigo-600',
                buttonHoverColor: 'from-purple-700 to-indigo-700'
            });


        });
    