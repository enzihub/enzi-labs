# Note Trainer

A Next.js app for learning to read sheet music. A note appears on the staff, you press the matching piano key (or `1 2 3 4 5 W E` on the keyboard), and it keeps score.

![Treble clef practice with hints on](../docs/assets/note-trainer.png)

## Modes

- **Treble clef** and **bass clef** drills, with optional hints and a skip button
- **Song practice**: sight-read the first lines of public-domain tunes such as *Twinkle Twinkle Little Star* and *Mary Had a Little Lamb*
- Confetti and an automatic switch to the other clef once you reach 50 correct answers

Notes are drawn with [VexFlow](https://www.vexflow.com/).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.
