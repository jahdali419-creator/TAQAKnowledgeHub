# 11 Real iPhone User Acceptance Testing

This carries forward the **Real iPhone UAT checklist** delivered with PR 2D (5–6 October 2026), unchanged, plus one production check at the end. The automated tests drive Chromium, a desktop WebKit build and an emulated iPhone 14 (`mobile-safari`, WebKit). They cannot run an installed iPhone app, Safari's own back-forward cache, the real notch and home indicator, or a real network dropping (`docs/TESTING.md`, "Real iPhone checks").

**None of these items is closed until it has been checked on a real iPhone.** Record the results in the table at the end, separately from the automated test results (09). Do not mark an item passed because the simulation passed.

Use Safari on an iPhone. Where a step says *installed app*, first open the site in Safari, tap Share, then Add to Home Screen, and open RISE from the home-screen icon.

1. **Back / Forward (PI-18).**
   - **Do:** open an area page, tap a document, then press Back (swipe from the left edge, or the Back arrow). Then go forward again.
   - **PASS:** the area page comes back fully visible and you can tap things straight away.
   - **FAIL:** a blank or faded page, or taps that do nothing until you reload.
2. **Master List / Workbench drawer (PI-08).**
   - **Do:** in the installed app, as QMS, open the Master List, then tap a row, or open "Waiting on QMS" and pick a document. Close it with the × at the top, then reopen it and close it with "Close" at the bottom.
   - **PASS:** both close the drawer, and the × sits below the clock and battery.
   - **FAIL:** the × is under the clock or does nothing, or there is no way out.
3. **Segment panel close (PI-61).**
   - **Do:** in the installed app, open an area page and tap a document card that opens the side panel. Tap the × at the top, then try again with "Close" at the bottom.
   - **PASS:** both close the panel.
   - **FAIL:** the × sits under the status bar and can't be tapped.
4. **Pager / Next (PI-51).**
   - **Do:** open an area with more than 25 documents in one tab, scroll to the bottom and tap "Next →".
   - **PASS:** you land at the top of page 2, with the first document just below the tabs.
   - **FAIL:** you land at the bottom, or the first document is hidden under the tabs.
5. **Portrait and landscape safe areas (PI-52).**
   - **Do:** in the installed app, turn the phone sideways. Open the menu, a drawer and the search filters.
   - **PASS:** nothing important sits under the notch or the bottom home bar, and every button can be tapped.
   - **FAIL:** text or buttons are cut off by the notch, or sit on the home bar.
6. **Installed app launch and navigation.**
   - **Do:** open RISE from the home-screen icon. Use the bell, the menu and a few pages.
   - **PASS:** it opens full-screen without Safari bars, and the bell and menu are below the clock and work.
   - **FAIL:** controls are under the status bar, or you are thrown out to Safari.
7. **Background and return.**
   - **Do:** with Upload half-filled (step 3), switch to another app for a minute, then come back.
   - **PASS:** your Upload is exactly where you left it.
   - **FAIL:** the page reloads to step 1, or the fields are empty.
8. **Offline → online.**
   - **Do:** on a page you have already opened, turn on Airplane Mode. Try to submit an Upload or a rejection. Then turn Airplane Mode off and wait about 20 seconds.
   - **PASS:**
     - One grey bar says "Offline. Nothing can be sent."
     - The action says "Not sent" and your text stays.
     - Back online, the bar disappears by itself and the same action goes through.
   - **FAIL:** it says "Submitted" while offline, your text disappears, or the bar never goes away.
9. **Update notice (if a new version is released while you test).**
   - **Do:** keep an Upload open when a new version is deployed.
   - **PASS:**
     - No sudden reload.
     - "New version available" appears at the bottom.
     - "Update now" warns you first, and "Keep working" keeps your form.
   - **FAIL:** the page reloads by itself and you lose your work.
10. **Bell and menu around the install suggestion.**
    - **Do:** in Safari (not the installed app), visit the Master List and a document page, then Home.
    - **PASS:**
      - The "Install RISE" sheet appears only on Home, and only when you are not in the middle of something.
      - It never covers the bell or menu on task pages.
      - "Maybe later" dismisses it.
    - **FAIL:** the sheet covers the bell or menu on a task page.

**In production, also check:** Microsoft Entra sign-in inside the installed iPhone app (it opens and returns correctly, and the session survives a background and return). That depends on IT's sign-in design and can only be tested once it exists.

## Results (fill in on the device)

| # | Item | iPhone model / iOS version | Safari or installed app | Date | Tester | PASS / FAIL | Notes / screenshot |
|---|---|---|---|---|---|---|---|
| 1 | Back / Forward (PI-18) | | | | | | |
| 2 | Master List / Workbench drawer (PI-08) | | | | | | |
| 3 | Segment panel close (PI-61) | | | | | | |
| 4 | Pager / Next (PI-51) | | | | | | |
| 5 | Safe areas, portrait and landscape (PI-52) | | | | | | |
| 6 | Installed app launch and navigation | | | | | | |
| 7 | Background and return | | | | | | |
| 8 | Offline → online | | | | | | |
| 9 | Update notice | | | | | | |
| 10 | Install suggestion vs bell and menu | | | | | | |

**Status at handover: none of the 10 has been run on a real iPhone.** All are open.
