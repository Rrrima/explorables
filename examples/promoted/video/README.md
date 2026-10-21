# Promoted · the explainer

A TED-Ed style explainer for the Promoted scrolly essay, built on `explainer-kit`. Style: black crayon on white: slouchy office workers, one red crayon, Caveat Brush; crayon-textured cursor.

```
ANTHROPIC_API_KEY=… node ../explainer-kit/server/server.mjs .     # http://localhost:8902/
node ../explainer-kit/pipeline/build.mjs . mix                      # after changing cues
```

Pause anywhere (or click something in the picture) and ask; answers can be asked inside answers and regenerated (↻ New take).
