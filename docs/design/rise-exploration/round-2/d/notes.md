# Option D · Beacon

**Idea.** RISE as a lit signal. The deep ink of the logo (`#002B32`) is the ground, and the logo's own colours are the only light on the screen.

**Brand moment.** A full-screen entrance, 700 ms, once per session (`entrance.html`). The real logo file (`rise-logo-reverse.png`) is cut into six parts with `clip-path`, so the artwork is never redrawn or recoloured: the pillar rises (0–420 ms), the cyan bar slides in from the right (120–520 ms), the orange bar from the left (200–600 ms), the name settles (320–680 ms) and the full stop pops in (520–700 ms). A tap skips it. With `prefers-reduced-motion`, the finished logo shows at once.

**Why it works**
- The symbol and WHAT WE KNOW. lock up on Home the way RISE sits beside the pillar in the logo. It is the strongest first impression of the three.
- The phone home has three things: search (with QR scan), the critical alert and the last document opened. The tab bar is Home, Areas, Saved and Ask.
- The dark ground is calm in control cabins and on night shifts. Cyan actions and the status colours are very legible on it.
- Desktop reuses the same pages (one responsive stylesheet). The cards move to a right-hand column and the register figures go to a footer.

**Watch out for**
- Dark screens are harder to read in direct sun. Outdoor use needs a light theme too.
- Long reading sits on a light sheet, so the ground changes between lists and documents.

**Tokens.** Ink `#002B32` · raised `#063A43` · line `#1A5059` · cyan `#00ADC2` (actions, active tab) · cyan text `#3CCFE0` · orange `#FD5805` (logo and critical alerts only) · sheet `#F5F7F6` · Current `#4FD39A` on ink · Review due `#F4BE52` on ink. Type: BW Gradual 800 for the statement, 700 for titles, Inter for the interface, document numbers in Inter 600 with tabular figures. 44 px minimum targets and 16 px minimum body text on the phone.

**Files.** `beacon.css` (mobile first; `@media (min-width:1024px)` scales up) · `entrance.html` · `home.html` · `area.html` · `document.html`.
