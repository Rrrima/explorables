# Promoted

A runnable scrolly essay on the Peter Principle, after Pluchino, Rapisarda & Garofalo, "The Peter principle revisited: a computational study", *Physica A* 389 (2010), arXiv:0907.0455 (Ig Nobel Prize in Management, 2010).

1. **The rules**: a company of 160 people on six floors, acted out by crayon office workers (darker trousers = more competent): firing, retiring, promotion chains, the two theories, efficiency.
2. **Run it**: choose common sense or the Peter hypothesis and who gets promoted (best, worst, random, or a mix); watch each year's promotions arc up the floors.
3. **Careers**: competence on every floor of a career; the Peter cliff appears with the Peter hypothesis and promoting the best.
4. **Six companies**: the paper's Fig. 2 and Table 1, rerun live (20 companies × 1,000 years each).
5. **Flip a coin**: the paper's Fig. 3: mixing best and worst; the two theories cross near p ≈ 0.45.
6. **Limits**.

`js/sim.js` is the model (also runs in Node); floor weights come from the paper's Fig. 1. Competence is clipped to [1, 10], which reproduces the starting efficiency (69.96% vs 69.68%). Over 50 companies × 1,000 years: common sense best/worst/random +8.7/−2.3/+2.9 points (paper +9/−5/+2); Peter −9.0/+13.0/+1.9 (paper −10/+12/+1). `js/crayon.js` draws everything in textured black and red wax.

Serve the folder: `python3 -m http.server 8791`
