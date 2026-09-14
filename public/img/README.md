# Project artwork

Put one image per project here, named exactly after the project id in
`src/content/projects.ts`:

```
public/img/crypto-trade-outcome-predictor.jpg
public/img/crypto-spark-pipeline.jpg
public/img/crm-analytics-funnel.jpg
public/img/trading-analytics.jpg
```

Recommended: 1400 × 875 (16:10), `.jpg` at quality ~82 or `.webp`. The four
placeholder plates here are 36–80 KB each; stay in that range. `.png` works but a
1600px screenshot PNG is routinely 900 KB, which is 3× the whole JavaScript budget
for a texture nobody can read at 22° tilt.
Anything exported from a real UI screenshot, terminal run or dashboard counts —
the plate is displayed tilted and slightly desaturated, so high contrast survives best.

If a file is missing nothing breaks: the DOM card falls back to a procedural SVG
plate, and the WebGL texture loader falls back to the same gradient.
