// Optimized Visual Animations
gsap.registerPlugin(ScrollTrigger);

function setupVisuals() {
    // Dynamic Background Color Shift (Slow & Beautiful)
    const bg = document.querySelector('.bg-3d');
    if (bg) {
        let hue = 220;
        function animateBg() {
            hue = (hue + 0.1) % 360;
            bg.style.background = `linear-gradient(135deg, hsl(${hue}, 50%, 10%) 0%, hsl(${(hue+60)%360}, 50%, 15%) 100%)`;
            requestAnimationFrame(animateBg);
        }
        animateBg();
    }

    // Scroll reveal for sections
    gsap.utils.toArray('section').forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: "top 85%",
            },
            opacity: 0,
            y: 50,
            duration: 1,
            ease: "power3.out"
        });
    });
}

// Ensure cards don't jitter on hover
document.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.scholarship-card');
    if (card) {
        gsap.to(card, { y: -10, boxShadow: "0 20px 40px rgba(0,0,0,0.3)", duration: 0.3 });
    }
});

document.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.scholarship-card');
    if (card) {
        gsap.to(card, { y: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", duration: 0.3 });
    }
});

window.addEventListener('load', setupVisuals);
